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
  const res = await apiFetch(path, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no-op; leave data as null if not JSON
  }
  if (!res.ok && data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : (data.error.message || 'Request failed'));
  }
  return data;
}

export default apiFetch;
