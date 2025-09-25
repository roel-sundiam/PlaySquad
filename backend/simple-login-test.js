const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'superadmin@playsquad.com',
      password: 'SuperAdmin123!'
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data && response.data.data.token) {
      console.log('✅ Login successful');
      console.log('Token:', response.data.data.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed - unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin();