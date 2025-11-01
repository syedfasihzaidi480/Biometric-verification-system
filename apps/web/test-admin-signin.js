// Test Admin signin with correct endpoint
const testAdminSignin = async () => {
  const formData = new URLSearchParams();
  formData.append('email', 'f219110@cfd.nu.edu.pk');
  formData.append('password', 'Fasih@123');
  formData.append('callbackUrl', '/admin');

  try {
    console.log('Testing signin with:');
    console.log('- Email:', 'f219110@cfd.nu.edu.pk');
    console.log('- Endpoint:', 'http://localhost:4000/api/auth/signin/credentials');
    console.log('');

    const response = await fetch('http://localhost:4000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      redirect: 'manual',
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('');
    
    const text = await response.text();
    console.log('Response body:', text);
    console.log('');
    
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response is not JSON (might be a redirect)');
    }

    // Check cookies
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      console.log('Set-Cookie headers:', setCookie);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testAdminSignin();
