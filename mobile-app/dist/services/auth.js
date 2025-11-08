export const signInWithVoice = async () => {
    // TODO: hit /api/auth/login + /verify-voice
    return {
        user: { id: 'u1', name: 'Demo User', phone: '+10000000000', preferredLanguage: 'en' },
        accessToken: 'demo'
    };
};
export const registerUser = async (data) => {
    // TODO: POST /api/auth/register
    return { id: 'u2', ...data };
};
