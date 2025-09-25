const axios = require('axios');
const API_BASE = 'http://localhost:3000/api';

async function testCoinDeduction() {
  console.log('🧪 Testing coin deduction on event creation...\n');
  
  try {
    // 1. Register and login as a test user
    console.log('1. Creating test user...');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser_' + Date.now() + '@example.com',
        password: 'TestPassword123!',
        skillLevel: 5,
        preferredSport: 'tennis'
      });
    } catch (err) {
      // User might already exist, that's okay
    }
    
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'superadmin@playsquad.com',
      password: 'SuperAdmin123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    // 3. Get user's clubs and check coin balance
    console.log('3. Getting user clubs...');
    const clubsResponse = await axios.get(`${API_BASE}/clubs`, config);
    const clubs = clubsResponse.data.data;
    
    if (clubs.length === 0) {
      console.log('❌ No clubs found for user');
      return;
    }
    
    const testClub = clubs[0];
    console.log(`📊 Club "${testClub.name}" - Current balance: ${testClub.coinWallet?.balance || 0} coins`);
    
    const initialBalance = testClub.coinWallet?.balance || 0;
    
    if (initialBalance < 10) {
      console.log('❌ Club has insufficient coins for event creation (need 10 coins)');
      return;
    }
    
    // 4. Create an event
    console.log('4. Creating event...');
    const eventData = {
      title: `Test Event ${Date.now()}`,
      description: 'Test event for coin deduction',
      club: testClub._id,
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 120,
      format: 'doubles',
      maxParticipants: 8,
      rsvpDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
      location: {
        name: 'Test Court',
        address: '123 Test Street'
      },
      status: 'published'
    };
    
    const eventResponse = await axios.post(`${API_BASE}/events`, eventData, config);
    console.log(`✅ Event created: ${eventResponse.data.data.title}`);
    console.log(`💰 Coin cost: ${eventResponse.data.coinCost || 0} coins`);
    
    // 5. Check club balance after event creation
    console.log('5. Checking updated balance...');
    const updatedClubsResponse = await axios.get(`${API_BASE}/clubs`, config);
    const updatedClub = updatedClubsResponse.data.data.find(c => c._id === testClub._id);
    const finalBalance = updatedClub?.coinWallet?.balance || 0;
    
    console.log(`📊 Updated balance: ${finalBalance} coins`);
    console.log(`🔄 Balance change: ${initialBalance - finalBalance} coins`);
    
    if (initialBalance - finalBalance === 10) {
      console.log('✅ SUCCESS: Coins were properly deducted!');
    } else {
      console.log('❌ FAILURE: Coins were not properly deducted!');
    }
    
    // 6. Test insufficient funds scenario
    console.log('\n6. Testing insufficient funds scenario...');
    
    // First, let's check if the club has very low balance
    if (finalBalance < 10) {
      console.log('Perfect! Club has insufficient balance for another event.');
      
      try {
        await axios.post(`${API_BASE}/events`, {
          ...eventData,
          title: `Failed Event ${Date.now()}`
        }, config);
        console.log('❌ FAILURE: Event was created despite insufficient funds!');
      } catch (error) {
        if (error.response?.status === 402) {
          console.log('✅ SUCCESS: Event creation properly blocked due to insufficient funds!');
        } else {
          console.log('❌ Event creation failed for wrong reason:', error.response?.data?.message);
        }
      }
    } else {
      console.log('Skipping insufficient funds test - club still has enough balance');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCoinDeduction().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(console.error);