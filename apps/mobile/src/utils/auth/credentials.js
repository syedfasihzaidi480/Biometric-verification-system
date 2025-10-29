import { apiFetch, apiFetchJson, toApiUrl } from '@/utils/api';
import { useAuthStore } from './store';

// Programmatic credentials sign-in for mobile clients
// 1) POST to /api/auth/callback/credentials with form-encoded body
// 2) Fetch /api/auth/session to retrieve the session payload
// 3) Persist session in auth store (SecureStore)
export async function signInWithCredentials({ email, password, callbackUrl = '/' }) {
  const body = new URLSearchParams();
  body.set('email', email);
  body.set('password', password);
  // Provide a callbackUrl so Auth.js has a target (even if we don't follow it here)
  if (callbackUrl) body.set('callbackUrl', callbackUrl);

  // Auth.js may respond with a redirect; RN fetch will still apply Set-Cookie
  await apiFetch('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  // Now retrieve the session JSON
  const session = await apiFetchJson('/api/auth/session', { method: 'GET' });
  if (session && (session.user || session?.expires)) {
    // Store in auth store for app UI
    useAuthStore.getState().setAuth(session);
    return { ok: true, session };
  }
  return { ok: false, error: 'No session returned' };
}

export default signInWithCredentials;
