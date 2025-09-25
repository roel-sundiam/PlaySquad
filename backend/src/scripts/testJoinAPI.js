const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');
require('dotenv').config();

async function testJoinAPI() {
  try {
    console.log('🔍 Testing club join logic...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user and club
    const user = await User.findOne({ email: 'sundiamhelen@yahoo.com' });
    const club = await Club.findOne({ name: 'Rich Town 2 Tennis Club' });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    if (!club) {
      console.log('❌ Club not found');
      return;
    }

    console.log('👤 User:', user.email);
    console.log('🏓 Club:', club.name);
    console.log('⚙️  Club autoAcceptMembers:', club.settings.autoAcceptMembers);

    // Check if user is already a member
    const isMember = club.isMember(user._id);
    console.log('🏅 Is already member:', isMember);

    // Check if user has pending request
    const existingRequest = club.joinRequests.find(
      request => request.user.toString() === user._id.toString() && request.status === 'pending'
    );
    console.log('📋 Has pending request:', !!existingRequest);

    // Test the logic path
    console.log('\n🔧 Testing join logic:');
    
    if (club.settings.autoAcceptMembers) {
      console.log('✅ Path: AUTO-ACCEPT (will join immediately)');
    } else {
      console.log('⏳ Path: REQUIRES APPROVAL (will create join request)');
    }

    console.log('\n📊 Current club members:');
    club.members.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.user} (${member.role})`);
    });

    console.log('\n📋 Current join requests:');
    if (club.joinRequests.length === 0) {
      console.log('   (no pending requests)');
    } else {
      club.joinRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.user} - Status: ${request.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing join API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testJoinAPI();