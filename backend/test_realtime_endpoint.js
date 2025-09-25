const axios = require('axios');

// Test the realtime endpoint with proper admin authentication
async function testRealtimeEndpoint() {
  try {
    console.log('Testing realtime endpoint...');
    
    // First, try to login as admin
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@test.com',
      password: 'TestAdmin123!'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Admin login successful, token:', token.substring(0, 20) + '...');
      
      // Now test the realtime endpoint
      const realtimeResponse = await axios.get('http://localhost:3000/api/admin/dashboard/realtime', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Realtime endpoint response:');
      console.log(JSON.stringify(realtimeResponse.data, null, 2));
      
    } else {
      console.log('Admin login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('Error testing realtime endpoint:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
}

testRealtimeEndpoint();