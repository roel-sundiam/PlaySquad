const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');
require('dotenv').config();

async function testJoinDirectAPI() {
  try {
    console.log('🔍 Testing direct API call to join club...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user and club
    const user = await User.findOne({ email: 'sundiamhelen@yahoo.com' });
    const club = await Club.findOne({ name: 'Rich Town 2 Tennis Club' });

    if (!user || !club) {
      console.log('❌ User or club not found');
      return;
    }

    // First login to get JWT token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'sundiamhelen@yahoo.com',
      password: 'password123' // Assuming this is the test password
    });

    const token = loginResponse.data.token;
    console.log('🔑 Got JWT token');

    // Try to join the club
    console.log(`🚀 Making API call to join club ${club._id}...`);
    
    const joinResponse = await axios.post(
      `http://localhost:3000/api/clubs/${club._id}/join`, 
      {
        message: 'Test join request from script'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📋 API Response:');
    console.log('   Status:', joinResponse.status);
    console.log('   Success:', joinResponse.data.success);
    console.log('   Message:', joinResponse.data.message);
    console.log('   Data:', joinResponse.data.data);

    // Check if it was auto-joined or created a request
    if (joinResponse.data.data && joinResponse.data.data.status === 'pending') {
      console.log('✅ CORRECT: Created join request (requires approval)');
    } else if (joinResponse.data.message.includes('Successfully joined')) {
      console.log('❌ WRONG: Auto-joined without approval');
    } else {
      console.log('❓ UNKNOWN: Unexpected response');
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.message);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testJoinDirectAPI();