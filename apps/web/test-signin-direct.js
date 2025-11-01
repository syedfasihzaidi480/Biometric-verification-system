// Test Auth.js signin
const testSignin = async () => {
  const formData = new URLSearchParams();
  formData.append('email', 'fasihzaidi480@gmail.com');
  formData.append('password', 'Fasih@123');
  formData.append('callbackUrl', '/admin');
  formData.append('json', 'true');

  try {
    const response = await fetch('http://localhost:4000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      redirect: 'manual',
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testSignin();
