import { useCallback } from 'react';

/**
 * Auth hook for Auth.js (not @auth/create)
 * Works with credentials provider configured in __create/index.ts
 */
function useAuth() {
  const callbackUrl = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('callbackUrl')
    : null;

  const signInWithCredentials = useCallback(async (options) => {
    const { email, password, redirect = true, callbackUrl: optionsCallbackUrl } = options;
    
    const finalCallbackUrl = optionsCallbackUrl || callbackUrl || '/';
    
    console.log('[CLIENT] Sign-in attempt:', { email });
    
    // Call Auth.js callback endpoint (POST form data)
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('callbackUrl', finalCallbackUrl);
    
    const res = await fetch('/api/auth/callback/credentials-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include',
    });

    console.log('[CLIENT] Sign-in response:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('[CLIENT] Sign-in failed:', text);
      throw new Error('CredentialsSignin');
    }

    if (redirect) {
      // Auth.js returns redirect URL or we use fallback
      const redirectUrl = res.redirected ? res.url : finalCallbackUrl;
      window.location.href = redirectUrl;
    }

    return res;
  }, [callbackUrl]);

  const signUpWithCredentials = useCallback(async (options) => {
    const { email, password, redirect = true, callbackUrl: optionsCallbackUrl } = options;
    
    const finalCallbackUrl = optionsCallbackUrl || callbackUrl || '/';
    
    console.log('[CLIENT] Sign-up attempt:', { email });
    
    // Call Auth.js callback endpoint (POST form data)
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('callbackUrl', finalCallbackUrl);
    
    const res = await fetch('/api/auth/callback/credentials-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include',
    });

    console.log('[CLIENT] Sign-up response:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('[CLIENT] Sign-up failed:', text);
      throw new Error('CredentialsSignin');
    }

    if (redirect) {
      const redirectUrl = res.redirected ? res.url : finalCallbackUrl;
      window.location.href = redirectUrl;
    }

    return res;
  }, [callbackUrl]);

  const signOut = useCallback(async () => {
    console.log('[CLIENT] Sign-out attempt');
    
    const res = await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('[CLIENT] Sign-out response:', res.status);

    if (res.ok || res.redirected) {
      window.location.href = '/account/signin';
    }

    return res;
  }, []);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signOut,
  };
}

export default useAuth;