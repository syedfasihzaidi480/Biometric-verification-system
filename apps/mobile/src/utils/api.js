import { Platform } from 'react-native';

// Compute API base URL for mobile (Expo) environments
// Prefer EXPO_PUBLIC_API_URL; otherwise use sensible localhost defaults per platform
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, ''))
  || (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');

// Helper to build absolute URL from a path or pass-through absolute URLs
export const toApiUrl = (path) => {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

// Smart fetch wrapper for API calls from React Native
// - Prefixes API_BASE
// - Sets JSON headers/body when a plain object is provided
// - Avoids setting Content-Type for FormData (let RN set boundaries)
export async function apiFetch(path, options = {}) {
  const url = toApiUrl(path);
  const opts = { ...options };

  // Normalize headers
  const headers = { ...(opts.headers || {}) };

  // Ensure cookies are included so API sessions stay intact
  if (typeof opts.credentials === 'undefined') {
    opts.credentials = 'include';
  }

  // If body is a plain object, JSON-encode it
  const isPlainObject = opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData);
  if (isPlainObject) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    opts.body = JSON.stringify(opts.body);
  }

  // If body is FormData, ensure we don't manually set Content-Type
  if (opts.body instanceof FormData) {
    // React Native will set the correct multipart boundary automatically
    if ('Content-Type' in headers) delete headers['Content-Type'];
  }

  opts.headers = headers;

  const res = await fetch(url, opts);
  return res;
}

// Convenience to fetch JSON with basic error surface
export async function apiFetchJson(path, options = {}) {
  try {
    const res = await apiFetch(path, options);
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      // Response might not be JSON; that's okay
    }

    if (!res.ok) {
      const message =
        (data && (typeof data.error === 'string' ? data.error : data?.error?.message)) ||
        `${res.status} ${res.statusText || 'Request failed'}`;
      const err = new Error(message);
      // attach a few useful fields for the UI
      // @ts-ignore
      err.status = res.status;
      // @ts-ignore
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    // Normalize common RN network error
    if (err instanceof TypeError && /network request failed/i.test(err.message)) {
      const e = new Error('Network request failed');
      // @ts-ignore
      e.code = 'NETWORK_ERROR';
      throw e;
    }
    throw err;
  }
}

export default apiFetch;
