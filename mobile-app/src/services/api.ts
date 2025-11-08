import axios, { AxiosInstance } from 'axios';

// Prefer Expo public env in Expo; fall back to generic API_URL for compatibility
let apiBase =
  (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_BASE_URL) ||
  (typeof process !== 'undefined' && (process as any).env?.API_URL) ||
  'http://localhost:4000';

let token: string | null = null;

export const setToken = (t: string | null) => {
  token = t;
};

export const createApi = (): AxiosInstance => {
  const instance = axios.create({ baseURL: apiBase, timeout: 10000 });

  instance.interceptors.request.use(async (config) => {
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      // TODO: token refresh flow on 401
      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = createApi();

export async function apiRegister(body: {
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  preferredLanguage?: string;
}) {
  const res = await api.post('/api/auth/register', body);
  return res.data;
}

export async function apiLogin() {
  const res = await api.post('/api/auth/login');
  return res.data;
}

export async function apiVerifyVoice(enrollmentId: string | null, file: { uri: string; name: string; type: string }) {
  const form = new FormData();
  if (enrollmentId) form.append('enrollmentId', enrollmentId);
  // In Expo, you’d use expo-file-system or fetch blob; this is placeholder signature
  // @ts-ignore
  form.append('file', { uri: file.uri, name: file.name, type: file.type });
  const res = await api.post('/api/verify-voice', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function apiLiveness(image: { uri: string; name: string; type: string }) {
  const form = new FormData();
  // @ts-ignore
  form.append('image', { uri: image.uri, name: image.name, type: image.type });
  const res = await api.post('/api/liveness', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function apiDocument(image: { uri: string; name: string; type: string }) {
  const form = new FormData();
  // @ts-ignore
  form.append('image', { uri: image.uri, name: image.name, type: image.type });
  const res = await api.post('/api/document', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}
