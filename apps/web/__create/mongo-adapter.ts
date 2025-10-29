import type { AdapterUser } from '@auth/core/adapters';
import type { ProviderType } from '@auth/core/providers';
import type { Db, Collection } from 'mongodb';

interface MongoUser extends AdapterUser {
  accounts?: Array<{
    provider: string;
    providerAccountId: string;
    password?: string;
  }>;
}

export default function MongoAdapter(db: Db) {
  const users: Collection<MongoUser> = db.collection('auth_users');
  const accounts: Collection<any> = db.collection('auth_accounts');

  return {
    async createUser(user: any): Promise<AdapterUser> {
      // Ensure an id exists (use provided or generate uuid-like)
      const id = user.id ?? globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const doc: MongoUser = {
        id,
        name: user.name ?? null,
        email: user.email ?? null,
        emailVerified: user.emailVerified ?? null,
        image: user.image ?? null,
      } as MongoUser;
      await users.insertOne(doc);
      return doc as AdapterUser;
    },
    async getUser(id: string): Promise<AdapterUser | null> {
      return (await users.findOne({ id })) as AdapterUser | null;
    },
    async getUserByEmail(email: string): Promise<MongoUser | null> {
      const user = (await users.findOne({ email })) as MongoUser | null;
      if (!user) return null;
      const accs = await accounts
        .find({ providerAccountId: user.id })
        .project({ _id: 0 })
        .toArray();
      return { ...user, accounts: accs } as MongoUser;
    },
    async getUserByAccount({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<AdapterUser | null> {
      const account = await accounts.findOne({ provider, providerAccountId });
      if (!account) return null;
      return (await users.findOne({ id: account.userId })) as AdapterUser | null;
    },
    async linkAccount(account: {
      userId: string;
      provider: string;
      providerAccountId: string;
      type: ProviderType;
      access_token?: string | null;
      expires_at?: number | null;
      refresh_token?: string | null;
      id_token?: string | null;
      scope?: string | null;
      session_state?: string | null;
      token_type?: string | null;
      extraData?: Record<string, unknown>;
    }): Promise<void> {
      await accounts.insertOne({
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
        password: (account.extraData as any)?.password,
      });
    },
  };
}
