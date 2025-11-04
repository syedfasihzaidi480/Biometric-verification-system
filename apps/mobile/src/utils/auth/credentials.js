import { apiFetch, apiFetchJson, toApiUrl } from '@/utils/api';
import { useAuthStore } from './store';

// Programmatic credentials sign-in for mobile clients
// 1) POST to /api/auth/callback/credentials with form-encoded body
// 2) Fetch /api/auth/session to retrieve the session payload
// 3) Persist session in auth store (SecureStore)
/**
 * @param {{ identifier?: string; email?: string; phone?: string; password: string; callbackUrl?: string }} params
 */
export async function signInWithCredentials({ identifier, email, phone, password, callbackUrl = '/' }) {
  try {
    const loginIdentifier = identifier || email || phone;
    if (!loginIdentifier) {
      throw new Error('An email or phone number is required for sign in');
    }
    const body = new URLSearchParams();
    body.set('identifier', loginIdentifier);
    const trimmedEmail = (email ?? '').trim();
    const trimmedPhone = (phone ?? '').trim();
    if (trimmedEmail || loginIdentifier.includes('@')) {
      body.set('email', trimmedEmail || loginIdentifier);
    }
    if (trimmedPhone || !loginIdentifier.includes('@')) {
      body.set('phone', trimmedPhone || loginIdentifier);
    }
    body.set('password', password);
    // Provide a callbackUrl so Auth.js has a target (even if we don't follow it here)
    if (callbackUrl) body.set('callbackUrl', callbackUrl);

    console.log('[signInWithCredentials] Attempting to sign in with identifier:', loginIdentifier);

    // Auth.js may respond with a redirect; RN fetch will still apply Set-Cookie
    const authResponse = await apiFetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    console.log('[signInWithCredentials] Auth callback response status:', authResponse.status);
    console.log('[signInWithCredentials] Auth callback response URL:', authResponse.url);
    
    // Log response headers to check if Set-Cookie was sent
    const headers = {};
    authResponse.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('[signInWithCredentials] Response headers:', JSON.stringify(headers));
    
    // Check if the response indicates an error
    if (authResponse.status === 401 || authResponse.status === 403) {
  console.log('[signInWithCredentials] Authentication failed - invalid credentials');
  return { ok: false, error: 'Invalid credentials' };
    }

    // Check if response contains an error parameter in URL (Auth.js error redirect)
    const responseUrl = authResponse.url || '';
    if (responseUrl.includes('error=')) {
      const errorMatch = responseUrl.match(/error=([^&]+)/);
      const errorType = errorMatch ? decodeURIComponent(errorMatch[1]) : 'CredentialsSignin';
      console.log('[signInWithCredentials] Auth error detected:', errorType);
  return { ok: false, error: 'Invalid credentials' };
    }

    // Give the server a moment to set the session cookie
    await new Promise(resolve => setTimeout(resolve, 500));

    // Now retrieve the session JSON
    console.log('[signInWithCredentials] Fetching session...');
    const session = await apiFetchJson('/api/auth/session', { method: 'GET' });
    console.log('[signInWithCredentials] Session retrieved:', JSON.stringify(session));
    
    if (session && (session.user || session?.expires)) {
      // Store in auth store for app UI
      useAuthStore.getState().setAuth(session);
      console.log('[signInWithCredentials] Sign in successful!');
      return { ok: true, session };
    }
    
    console.log('[signInWithCredentials] No valid session returned');
    return { ok: false, error: 'No session returned' };
  } catch (error) {
    console.error('[signInWithCredentials] Error during sign in:', error);
    return { ok: false, error: error.message || 'Sign in failed' };
  }
}

export default signInWithCredentials;
