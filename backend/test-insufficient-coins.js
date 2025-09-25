// Test script to demonstrate insufficient coins error when creating events

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testInsufficientCoins() {
  console.log('=== Testing Insufficient Coins for Event Creation ===\n');

  try {
    // 1. Login as a test user
    console.log('1. Attempting to login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('Login failed, need to create test data first');
      return;
    }

    const token = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log('✓ Login successful');
    console.log('User:', loginResponse.data.data.user.firstName, loginResponse.data.data.user.lastName);
    console.log('User Clubs:', loginResponse.data.data.user.clubs.length, 'clubs\n');

    // 2. Get user's clubs
    console.log('2. Fetching user clubs...');
    const clubsResponse = await axios.get(`${API_BASE}/clubs`, { headers });
    
    if (!clubsResponse.data.success || clubsResponse.data.data.length === 0) {
      console.log('No clubs found for user');
      return;
    }

    const club = clubsResponse.data.data[0];
    console.log('✓ Found club:', club.name);
    console.log('Club coin balance:', club.coinWallet?.balance || 0, 'coins\n');

    // 3. Try to create an event (costs 10 coins)
    console.log('3. Attempting to create event (requires 10 coins)...');
    
    const eventData = {
      title: 'Test Event - Should Fail',
      club: club.id,
      eventType: 'sports',
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 120,
      format: 'doubles',
      maxParticipants: 8,
      description: 'Test event to demonstrate insufficient coins error',
      location: {
        name: 'Test Court',
        address: '123 Test Street'
      },
      rsvpDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now
    };

    try {
      const eventResponse = await axios.post(`${API_BASE}/events`, eventData, { headers });
      console.log('❌ Event creation succeeded unexpectedly:', eventResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 402) {
        console.log('✓ Got expected 402 error - Insufficient coins');
        console.log('Error message:', error.response.data.message);
        console.log('Error details:');
        console.log('  Required coins:', error.response.data.data.required);
        console.log('  Available coins:', error.response.data.data.available);
        console.log('  Shortfall:', error.response.data.data.shortfall);
        
        console.log('\n=== User Experience Analysis ===');
        console.log('When a club has 0 coins and tries to create an event:');
        console.log('1. Backend returns HTTP 402 (Payment Required)');
        console.log('2. Error message: "Insufficient club coins for event creation"');
        console.log('3. Detailed breakdown provided showing required vs available coins');
        console.log('4. Frontend should catch this error and show appropriate modal');
        
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('Script error:', error.response?.data || error.message);
  }
}

// Run the test if server is available
testInsufficientCoins().catch(console.error);