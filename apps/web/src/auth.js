/**
 * WARNING: This file connects this app to Anythings's internal auth system. Do
 * not attempt to edit it. Modifying it will have no effect on your project as it is controlled by our system.
 * Do not import @auth/create or @auth/create anywhere else or it may break. This is an internal package.
 */
import CreateAuth from "@auth/create"
import Credentials from "@auth/core/providers/credentials"
import { MongoClient } from 'mongodb'
import { verify } from 'argon2'

function Adapter(db) {
  const users = db.collection('auth_users');
  const accounts = db.collection('auth_accounts');
  const sessions = db.collection('auth_sessions');
  const verificationTokens = db.collection('auth_verification_token');

  return {
    async createVerificationToken(verificationToken) {
      const { identifier, expires, token } = verificationToken;
      await verificationTokens.insertOne({ identifier, expires, token });
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      const result = await verificationTokens.findOneAndDelete(
        { identifier, token },
        { projection: { _id: 0 } }
      );
      return result.value || null;
    },

    async createUser(user) {
      const id = user.id ?? globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const doc = {
        id,
        name: user.name ?? null,
        email: user.email ?? null,
        emailVerified: user.emailVerified ?? null,
        image: user.image ?? null,
      };
      await users.insertOne(doc);
      return doc;
    },
    async getUser(id) {
      try {
        const user = await users.findOne({ id }, { projection: { _id: 0 } });
        return user || null;
      } catch {
        return null;
      }
    },
    async getUserByEmail(email) {
      const user = await users.findOne({ email }, { projection: { _id: 0 } });
      if (!user) return null;
      
      const userAccounts = await accounts
        .find({ userId: user.id })
        .project({ _id: 0 })
        .toArray();
      
      return {
        ...user,
        accounts: userAccounts,
      };
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await accounts.findOne(
        { provider, providerAccountId },
        { projection: { _id: 0 } }
      );
      if (!account) return null;
      
      const user = await users.findOne({ id: account.userId }, { projection: { _id: 0 } });
      return user || null;
    },
    async updateUser(user) {
      const oldUser = await users.findOne({ id: user.id }, { projection: { _id: 0 } });
      const newUser = { ...oldUser, ...user };
      
      await users.updateOne(
        { id: user.id },
        {
          $set: {
            name: newUser.name,
            email: newUser.email,
            emailVerified: newUser.emailVerified,
            image: newUser.image,
          },
        }
      );
      return newUser;
    },
    async linkAccount(account) {
      const doc = {
        userId: account.userId,
        provider: account.provider,
        type: account.type,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token ?? null,
        expires_at: account.expires_at ?? null,
        refresh_token: account.refresh_token ?? null,
        id_token: account.id_token ?? null,
        scope: account.scope ?? null,
        session_state: account.session_state ?? null,
        token_type: account.token_type ?? null,
        password: account.extraData?.password ?? null,
      };
      await accounts.insertOne(doc);
      return doc;
    },
    async createSession({ sessionToken, userId, expires }) {
      if (userId === undefined) {
        throw Error('userId is undef in createSession');
      }
      const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const doc = {
        id,
        sessionToken,
        userId,
        expires,
      };
      await sessions.insertOne(doc);
      return doc;
    },

    async getSessionAndUser(sessionToken) {
      if (sessionToken === undefined) {
        return null;
      }
      const session = await sessions.findOne(
        { sessionToken },
        { projection: { _id: 0 } }
      );
      if (!session) return null;

      const user = await users.findOne(
        { id: session.userId },
        { projection: { _id: 0 } }
      );
      if (!user) return null;

      return { session, user };
    },
    async updateSession(session) {
      const { sessionToken } = session;
      const originalSession = await sessions.findOne(
        { sessionToken },
        { projection: { _id: 0 } }
      );
      if (!originalSession) return null;

      const newSession = { ...originalSession, ...session };
      await sessions.updateOne(
        { sessionToken },
        { $set: { expires: newSession.expires } }
      );
      return newSession;
    },
    async deleteSession(sessionToken) {
      await sessions.deleteOne({ sessionToken });
    },
    async unlinkAccount(partialAccount) {
      const { provider, providerAccountId } = partialAccount;
      await accounts.deleteOne({ providerAccountId, provider });
    },
    async deleteUser(userId) {
      await users.deleteOne({ id: userId });
      await sessions.deleteMany({ userId });
      await accounts.deleteMany({ userId });
    },
  };
}
// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const mongoDbName = process.env.MONGODB_DB || 'auth';

let cachedClient = null;
let cachedDb = null;
let cachedAdapter = null;

async function getAdapter() {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  if (!cachedDb || !cachedClient?.topology?.isConnected?.()) {
    cachedClient = new MongoClient(mongoUri);
    await cachedClient.connect();
    cachedDb = cachedClient.db(mongoDbName);
  }

  cachedAdapter = Adapter(cachedDb);
  return cachedAdapter;
}

export const { auth } = CreateAuth({
  adapter: {
    async createUser(user) {
      const adapter = await getAdapter();
      return adapter.createUser(user);
    },
    async getUser(id) {
      const adapter = await getAdapter();
      return adapter.getUser(id);
    },
    async getUserByEmail(email) {
      const adapter = await getAdapter();
      return adapter.getUserByEmail(email);
    },
    async getUserByAccount(account) {
      const adapter = await getAdapter();
      return adapter.getUserByAccount(account);
    },
    async updateUser(user) {
      const adapter = await getAdapter();
      return adapter.updateUser(user);
    },
    async linkAccount(account) {
      const adapter = await getAdapter();
      return adapter.linkAccount(account);
    },
    async unlinkAccount(account) {
      const adapter = await getAdapter();
      return adapter.unlinkAccount(account);
    },
    async createSession(session) {
      const adapter = await getAdapter();
      return adapter.createSession(session);
    },
    async getSessionAndUser(sessionToken) {
      const adapter = await getAdapter();
      return adapter.getSessionAndUser(sessionToken);
    },
    async updateSession(session) {
      const adapter = await getAdapter();
      return adapter.updateSession(session);
    },
    async deleteSession(sessionToken) {
      const adapter = await getAdapter();
      return adapter.deleteSession(sessionToken);
    },
    async createVerificationToken(verificationToken) {
      const adapter = await getAdapter();
      return adapter.createVerificationToken(verificationToken);
    },
    async useVerificationToken(verificationToken) {
      const adapter = await getAdapter();
      return adapter.useVerificationToken(verificationToken);
    },
    async deleteUser(userId) {
      const adapter = await getAdapter();
      return adapter.deleteUser(userId);
    },
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials Sign in',
      credentials: {
        identifier: {
          label: 'Email or Phone',
          type: 'text',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      authorize: async (credentials) => {
        const { identifier, password } = credentials;
        if (!identifier || !password) {
          return null;
        }
        if (typeof identifier !== 'string' || typeof password !== 'string') {
          return null;
        }
        const trimmedIdentifier = identifier.trim();
        if (!trimmedIdentifier) {
          return null;
        }

        // Determine lookup strategy
        const adapter = await getAdapter();
        let user = null;

        if (trimmedIdentifier.includes('@')) {
          const normalizedEmail = trimmedIdentifier.toLowerCase();
          user = await adapter.getUserByEmail(normalizedEmail);
          // Fallback: if not found in auth_users, try mapping via profile users collection
          if (!user) {
            try {
              const mongoClient = new MongoClient(mongoUri);
              await mongoClient.connect();
              const mongoDb = mongoClient.db(mongoDbName);
              const usersCollection = mongoDb.collection('users');
              const matchedUser = await usersCollection.findOne({ email: normalizedEmail });
              if (matchedUser?.auth_user_id) {
                user = await adapter.getUser(matchedUser.auth_user_id);
                if (user) {
                  // hydrate accounts for password validation
                  const accs = await mongoDb
                    .collection('auth_accounts')
                    .find({ userId: user.id })
                    .project({ _id: 0 })
                    .toArray();
                  user = { ...user, accounts: accs };
                }
              }
              await mongoClient.close();
            } catch (err) {
              console.error('[AUTH] Email lookup fallback failed:', err);
            }
          }
        } else {
          // Try to resolve by phone via users collection
          const db = await getAdapter();
          if (db?.getUserByPhone) {
            user = await db.getUserByPhone(trimmedIdentifier);
          }
        }

        if (!user && !trimmedIdentifier.includes('@')) {
          try {
            const mongoClient = new MongoClient(mongoUri);
            await mongoClient.connect();
            const mongoDb = mongoClient.db(mongoDbName);
            const usersCollection = mongoDb.collection('users');
            const matchedUser = await usersCollection.findOne({ phone: trimmedIdentifier });
            if (matchedUser?.auth_user_id) {
              user = await adapter.getUser(matchedUser.auth_user_id);
            }
            await mongoClient.close();
          } catch (err) {
            console.error('[AUTH] Phone lookup failed:', err);
          }
        }

        if (!user) {
          return null;
        }
        const matchingAccount = user.accounts.find(
          (account) => account.provider === 'credentials'
        );
        const accountPassword = matchingAccount?.password;
        if (!accountPassword) {
          return null;
        }

        const isValid = await verify(accountPassword, password);
        if (!isValid) {
          return null;
        }

        // return user object with the their profile data
        return user;
      },
    }),
  ],
  pages: {
    signIn: '/account/signin',
    signOut: '/account/logout',
  },
})