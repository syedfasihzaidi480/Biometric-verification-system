import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../src/app/api/profile/route.js';

// Mock auth to simulate two distinct users without emails or phone numbers
vi.mock('../src/auth.js', () => {
  let callCount = 0;
  return {
    auth: async () => {
      callCount += 1;
      return {
        user: {
          id: `u-${callCount}`,
          name: `Test User ${callCount}`,
          email: undefined,
        },
      };
    },
  };
});

// Mock Mongo connection layer
vi.mock('../src/app/api/utils/mongo', () => {
  const users: any[] = [];
  return {
    getMongoDb: async () => {
      return {
        collection: (name: string) => {
          if (name !== 'users') throw new Error('Only users collection mocked');
          return {
            async findOne(query: any) {
              return users.find((u) => u.auth_user_id === query.auth_user_id) || null;
            },
            async insertOne(doc: any) {
              if (users.some((u) => u.auth_user_id === doc.auth_user_id)) {
                const err: any = new Error('Duplicate key error');
                err.code = 11000;
                throw err;
              }
              users.push(doc);
              return { acknowledged: true, insertedId: doc.id };
            },
          };
        },
      };
    },
  };
});

describe('Profile GET user creation', () => {
  beforeEach(() => {
    // Reset modules between tests to reset callCount/users
    vi.resetModules();
  });

  it('creates first user successfully', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.auth_user_id).toBe('u-1');
    expect(body.user.email).toBe(''); // empty email normalized
  });

  it('creates second distinct user without collision', async () => {
    const res1 = await GET();
    const body1 = await res1.json();
    const res2 = await GET();
    const body2 = await res2.json();
    expect(body1.success).toBe(true);
    expect(body2.success).toBe(true);
    expect(body1.user.auth_user_id).not.toBe(body2.user.auth_user_id);
    expect(body1.user.id).not.toBe(body2.user.id);
  });
});
