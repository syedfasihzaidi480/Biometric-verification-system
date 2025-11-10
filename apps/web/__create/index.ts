import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';
import nodeConsole from 'node:console';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { Db, MongoClient } from 'mongodb';
import { verify } from 'argon2';
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import ws from 'ws';
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';

neonConfig.webSocketConstructor = ws;

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

let adapter: any;
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function initializePersistence() {
  if (process.env.MONGODB_URI) {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    mongoDb = mongoClient.db(process.env.MONGODB_DB || 'auth');
    const { default: MongoAdapter } = await import('./mongo-adapter');
    adapter = MongoAdapter(mongoDb);
  } else if (process.env.DATABASE_URL?.trim()) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    adapter = NeonAdapter(pool);
  } else {
    throw new Error('No database connection configured. Please set either MONGODB_URI or DATABASE_URL environment variable.');
  }
}

async function createServer() {
  await initializePersistence();

  const app = new Hono();

  app.use('*', requestId());

  app.use('*', (c, next) => {
    const requestId = c.get('requestId');
    return als.run({ requestId }, () => next());
  });

  app.use(contextStorage());

  app.onError((err, c) => {
    if (c.req.method !== 'GET') {
      return c.json(
        {
          error: 'An error occurred in your app',
          details: serializeError(err),
        },
        500
      );
    }
    return c.html(getHTMLForErrorPage(err), 200);
  });

  if (process.env.CORS_ORIGINS) {
    app.use(
      '/*',
      cors({
        origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
      })
    );
  }

  // Initialize Auth.js configuration with explicit basePath and dev fallback secret
  app.use(
    '*',
    initAuthConfig(() => ({
      secret: process.env.AUTH_SECRET || 'dev-fallback-secret-change-me',
      basePath: '/api/auth',
      trustHost: true,
      pages: {
        // Use the end-user sign-in screen by default so non-admin flows stay in-app
        signIn: '/account/signin',
        signOut: '/account/signin',
        error: '/account/signin',
      },
      // Use Auth.js sentinel to disable CSRF protection (already imported)
      skipCSRFCheck,
      session: { strategy: 'jwt' },
      callbacks: {
        session({ session, token }) {
          if (token?.sub) {
            // @ts-ignore
            session.user.id = token.sub;
          }
          return session;
        },
      },
      cookies: {
        csrfToken: {
          options: {
            secure: Boolean(process.env.AUTH_URL?.startsWith('https')),
            sameSite: Boolean(process.env.AUTH_URL?.startsWith('https')) ? 'none' : 'lax',
          },
        },
        sessionToken: {
          options: {
            secure: Boolean(process.env.AUTH_URL?.startsWith('https')),
            sameSite: Boolean(process.env.AUTH_URL?.startsWith('https')) ? 'none' : 'lax',
          },
        },
        callbackUrl: {
          options: {
            secure: Boolean(process.env.AUTH_URL?.startsWith('https')),
            sameSite: Boolean(process.env.AUTH_URL?.startsWith('https')) ? 'none' : 'lax',
          },
        },
      },
      providers: [
        Credentials({
          id: 'credentials',
          name: 'Credentials Sign in',
          credentials: {
            identifier: { label: 'Email or Phone', type: 'text' },
            email: { label: 'Email', type: 'email' },
            phone: { label: 'Phone', type: 'text' },
            password: { label: 'Password', type: 'password' },
          },
          authorize: async (credentials) => {
            const { identifier, email, phone, password } = (credentials ?? {}) as {
              identifier?: string;
              email?: string;
              phone?: string;
              password?: string;
            };

            if (!password || typeof password !== 'string') {
              console.error('[SIGN-IN] Missing password');
              return null;
            }

            const rawIdentifier =
              (typeof identifier === 'string' && identifier) ||
              (typeof email === 'string' && email) ||
              (typeof phone === 'string' && phone) ||
              '';

            const trimmedIdentifier = rawIdentifier.trim();
            if (!trimmedIdentifier) {
              console.error('[SIGN-IN] Missing identifier');
              return null;
            }

            const normalizedEmail = (typeof email === 'string' && email.trim()) ||
              (trimmedIdentifier.includes('@') ? trimmedIdentifier.toLowerCase() : '');
            const normalizedPhone = (typeof phone === 'string' && phone.trim()) ||
              (!trimmedIdentifier.includes('@') ? trimmedIdentifier : '');

            console.log('[SIGN-IN] Authorize called with identifier:', trimmedIdentifier);

            let user: any = null;

            if (normalizedEmail) {
              try {
                console.log('[SIGN-IN] Looking up user by email...');
                user = await adapter.getUserByEmail(normalizedEmail);
              } catch (err) {
                console.error('[SIGN-IN] Email lookup failed:', err);
              }

              // Fallback: if not found in auth_users, try mapping via profile users collection
              if (!user && mongoDb) {
                try {
                  const usersCollection = mongoDb.collection('users');
                  const authUsersCollection = mongoDb.collection('auth_users');
                  const authAccountsCollection = mongoDb.collection('auth_accounts');

                  const profile = await usersCollection.findOne({ email: normalizedEmail });
                  if (profile?.auth_user_id) {
                    const authUser = await authUsersCollection.findOne({ id: profile.auth_user_id });
                    const authAccount = await authAccountsCollection.findOne({
                      userId: profile.auth_user_id,
                      provider: 'credentials',
                    });

                    if (authUser && authAccount?.password) {
                      user = {
                        id: authUser.id,
                        name: authUser.name,
                        email: authUser.email,
                        emailVerified: authUser.emailVerified,
                        image: authUser.image,
                        accounts: [
                          {
                            provider: 'credentials',
                            providerAccountId: authAccount.providerAccountId ?? authAccount.userId,
                            password: authAccount.password,
                          },
                        ],
                      };
                    }
                  }
                } catch (err) {
                  console.error('[SIGN-IN] Email fallback lookup failed:', err);
                }
              }
            }

            if (!user && normalizedPhone && mongoDb) {
              try {
                console.log('[SIGN-IN] Looking up user by phone...');
                const usersCollection = mongoDb.collection('users');
                const authUsersCollection = mongoDb.collection('auth_users');
                const authAccountsCollection = mongoDb.collection('auth_accounts');

                const profile = await usersCollection.findOne({ phone: normalizedPhone });
                if (profile?.auth_user_id) {
                  const authUser = await authUsersCollection.findOne({ id: profile.auth_user_id });
                  const authAccount = await authAccountsCollection.findOne({
                    userId: profile.auth_user_id,
                    provider: 'credentials',
                  });

                  if (authUser && authAccount?.password) {
                    user = {
                      id: authUser.id,
                      name: authUser.name,
                      email: authUser.email,
                      emailVerified: authUser.emailVerified,
                      image: authUser.image,
                      accounts: [
                        {
                          provider: 'credentials',
                          providerAccountId: authAccount.providerAccountId ?? authAccount.userId,
                          password: authAccount.password,
                        },
                      ],
                    };
                  }
                }
              } catch (err) {
                console.error('[SIGN-IN] Phone lookup failed:', err);
              }
            }

            if (!user) {
              console.error('[SIGN-IN] User not found for identifier:', trimmedIdentifier);
              return null;
            }

            console.log('[SIGN-IN] User found:', user.id);
            const matchingAccount = user.accounts?.find((a: any) => a.provider === 'credentials');
            const accountPassword = matchingAccount?.password;
            if (!accountPassword) {
              console.error('[SIGN-IN] No credentials account found for user');
              return null;
            }

            console.log('[SIGN-IN] Verifying password...');
            const isValid = await verify(accountPassword, password);
            if (!isValid) {
              console.error('[SIGN-IN] Invalid password');
              return null;
            }

            console.log('[SIGN-IN] Authentication successful!');
            return user;
          },
        }),
      ],
    }))
  );

  app.all('/integrations/:path{.+}', async (c) => {
    const queryParams = c.req.query();
    const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${
      Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''
    }`;

    return proxy(url, {
      method: c.req.method,
      body: c.req.raw.body ?? null,
      // @ts-ignore - this key is accepted even if types not aware and is
      // required for streaming integrations
      duplex: 'half',
      redirect: 'manual',
      headers: {
        ...c.req.header(),
        'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
        'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
        Host: process.env.NEXT_PUBLIC_CREATE_HOST,
        'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
      },
    });
  });

  // ========================================
  // CRITICAL: API routes MUST be handled before React Router!
  // ========================================

  // First, handle Auth.js endpoints (signin, signout, callback, session, etc.)
  // This MUST come before registering the generic /api routes, otherwise
  // the nested /api router will swallow /api/auth/* and Auth.js won't run.
  app.use('/api/auth/*', async (c, next) => {
    const path = c.req.path;
    const method = c.req.method;
    const stripped = path.replace(/^\/api\/auth\/?/, '');
    const segments = stripped.split('/').filter(Boolean);
    console.log('[AUTH MIDDLEWARE] Checking path:', path, 'method:', method, 'segments:', segments);

    if (isAuthAction(path)) {
      console.log('[AUTH MIDDLEWARE] Handling as auth action');
      return authHandler()(c, next);
    }

    console.log('[AUTH MIDDLEWARE] Skipping, not an auth action');
    return next();
  });

  // Then, register custom API routes (includes /api/auth/register)
  app.route(API_BASENAME, api);

  // Catch-all: if a request reaches here and starts with /api,
  // it means no handler was found - return 404
  app.all('/api/*', (c) => {
    console.log('[API 404] No handler found for:', c.req.path);
    return c.json({ error: 'API endpoint not found' }, 404);
  });

  // Ensure expected build-time route discovery path exists to prevent ENOENT during SSR build.
  // Some tooling expects build/server/src/app/api to exist when registering routes; create it if missing.
  try {
    const buildApiPath = path.resolve(process.cwd(), 'build', 'server', 'src', 'app', 'api');
    if (!fs.existsSync(buildApiPath)) {
      fs.mkdirSync(buildApiPath, { recursive: true });
      // Copy current source api route files into that location so discovery succeeds.
      const srcApiPath = path.resolve(process.cwd(), 'src', 'app', 'api');
      if (fs.existsSync(srcApiPath)) {
        for (const entry of fs.readdirSync(srcApiPath)) {
          const s = path.join(srcApiPath, entry);
          const d = path.join(buildApiPath, entry);
          if (fs.statSync(s).isDirectory()) {
            // Shallow copy only top-level route folders/files
            fs.mkdirSync(d, { recursive: true });
            for (const child of fs.readdirSync(s)) {
              const cs = path.join(s, child);
              const cd = path.join(d, child);
              if (fs.statSync(cs).isFile()) {
                fs.copyFileSync(cs, cd);
              }
            }
          } else {
            fs.copyFileSync(s, d);
          }
        }
      }
      console.log('[route-discovery] Prepared build route directory at', buildApiPath);
    }
  } catch (e) {
    console.warn('[route-discovery] Failed to prepare build route directory', e);
  }

  const server = await createHonoServer({
    app,
    defaultLogger: false,
  });

  return server;
}

const serverPromise = createServer().catch((err) => {
  console.error('[bootstrap] Failed to start server', err);
  throw err;
});

export default serverPromise;
