// Lightweight API client for the mobile app
// Uses global fetch polyfilled in src/__create/polyfills

const handleResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  const isJSON = contentType.includes('application/json');
  const data = isJSON ? await res.json().catch(() => null) : await res.text().catch(() => null);
  if (!res.ok) {
    const error = (isJSON && data && (data.error || data)) || { message: 'Request failed' };
    const message = typeof error === 'string' ? error : error.message || 'Request failed';
    const details = typeof error === 'object' ? error.details : undefined;
    const err = new Error(message);
    err.details = details;
    err.status = res.status;
    throw err;
  }
  return data;
};

export async function postJSON(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return handleResponse(res);
}

export async function postForm(path, formData) {
  const res = await fetch(path, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function registerUser({ name, phone, email, date_of_birth, preferred_language }) {
  return postJSON('/api/auth/register', {
    name,
    phone,
    email: email || undefined,
    date_of_birth: date_of_birth || undefined,
    preferred_language: preferred_language || 'en',
  });
}
