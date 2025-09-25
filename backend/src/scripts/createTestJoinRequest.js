const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Club = require('../models/Club');
const User = require('../models/User');

async function createTestJoinRequest() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const clubId = '68d22ff0501954a6676f4172'; // Rich Town 2 Tennis Club
    
    // Find a user who is not already a member to create a test request
    const club = await Club.findById(clubId);
    const existingMemberIds = club.members.map(m => m.user.toString());
    
    // Find a user who is not a member and not an admin
    const testUser = await User.findOne({
      _id: { $nin: existingMemberIds },
      email: { $not: /admin/i }
    });

    if (!testUser) {
      console.log('❌ No suitable test user found. Creating one...');
      
      // Create a test user
      const newTestUser = new User({
        firstName: 'Test',
        lastName: 'Requester',
        email: 'test.requester@example.com',
        password: 'testpassword123',
        skillLevel: 5,
        preferredFormat: 'singles'
      });
      
      await newTestUser.save();
      console.log('✅ Created test user:', newTestUser.email);
      
      // Add join request
      club.joinRequests.push({
        user: newTestUser._id,
        message: 'Hi! I would like to join this awesome tennis club. I play regularly and am looking forward to participating in club events.',
        status: 'pending',
        requestedAt: new Date()
      });
      
      await club.save();
      
      console.log('🎉 Created test join request!');
      console.log(`   • User: ${newTestUser.firstName} ${newTestUser.lastName} (${newTestUser.email})`);
      console.log(`   • Club: ${club.name}`);
      console.log(`   • Status: pending`);
      
    } else {
      // Use existing user
      club.joinRequests.push({
        user: testUser._id,
        message: 'Hello! I would love to join this tennis club. I have been playing for several years and am excited to meet other players.',
        status: 'pending',
        requestedAt: new Date()
      });
      
      await club.save();
      
      console.log('🎉 Created test join request!');
      console.log(`   • User: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
      console.log(`   • Club: ${club.name}`);
      console.log(`   • Status: pending`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script
createTestJoinRequest().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});