const mongoose = require('mongoose');
const Club = require('../models/Club');
const User = require('../models/User');
require('dotenv').config();

async function debugJoinRequests() {
  try {
    console.log('🔍 Debugging join requests...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the club with populated join requests
    const club = await Club.findOne({ name: 'Rich Town 2 Tennis Club' })
      .populate('joinRequests.user', 'firstName lastName email avatar skillLevel');

    if (!club) {
      console.log('❌ Club not found');
      return;
    }

    console.log(`🏓 Club: ${club.name}`);
    console.log(`📋 Total Join Requests: ${club.joinRequests.length}`);

    if (club.joinRequests.length === 0) {
      console.log('ℹ️ No join requests found');
    } else {
      club.joinRequests.forEach((request, index) => {
        console.log(`\n📝 Request ${index + 1}:`);
        console.log(`   ID: ${request._id}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Message: ${request.message || 'No message'}`);
        console.log(`   Requested At: ${request.requestedAt}`);
        
        if (request.user) {
          console.log(`   User ID: ${request.user._id}`);
          console.log(`   First Name: ${request.user.firstName || 'undefined'}`);
          console.log(`   Last Name: ${request.user.lastName || 'undefined'}`);
          console.log(`   Email: ${request.user.email || 'undefined'}`);
          console.log(`   Skill Level: ${request.user.skillLevel || 'undefined'}`);
        } else {
          console.log(`   User: null/undefined`);
        }
      });
    }

    // Also check if there are any users with pending requests
    console.log('\n🔍 Checking all users for references...');
    const users = await User.find({});
    console.log(`Found ${users.length} users total`);
    
    users.forEach(user => {
      console.log(`User: ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
    });

  } catch (error) {
    console.error('❌ Error debugging join requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugJoinRequests();