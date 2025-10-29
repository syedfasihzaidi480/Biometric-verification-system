const params = new URLSearchParams({
  email: 'syed.hassan.shah4554@gmail.com',
  password: 'Test123!'
});

const url = 'http://localhost:4000/api/auth/callback/credentials';

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params.toString(),
  redirect: 'manual'
}).then(async (res) => {
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers));
  const text = await res.text();
  console.log('Body:', text.slice(0, 500));
}).catch((err) => {
  console.error('Error:', err);
});
