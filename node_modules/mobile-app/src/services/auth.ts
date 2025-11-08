// Placeholder auth service. Real app will use JWT + refresh and SecureStore
export type User = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferredLanguage: string;
};

export const signInWithVoice = async (): Promise<{ user: User; accessToken: string }> => {
  // TODO: hit /api/auth/login + /verify-voice
  return {
    user: { id: 'u1', name: 'Demo User', phone: '+10000000000', preferredLanguage: 'en' },
    accessToken: 'demo'
  };
};

export const registerUser = async (data: Omit<User, 'id'>): Promise<User> => {
  // TODO: POST /api/auth/register
  return { id: 'u2', ...data } as User;
};
