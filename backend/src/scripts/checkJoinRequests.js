const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Club = require('../models/Club');
const User = require('../models/User');

async function checkJoinRequests() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const clubId = '68d33a46bc3be79d7bebd392';
    
    console.log('\n📊 Checking join requests for club:', clubId);

    // Find the club
    const club = await Club.findById(clubId)
      .populate('joinRequests.user', 'firstName lastName email')
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');

    if (!club) {
      console.log('❌ Club not found');
      return;
    }

    console.log('\n🏆 Club Details:');
    console.log(`   • Name: ${club.name}`);
    console.log(`   • Owner: ${club.owner.firstName} ${club.owner.lastName} (${club.owner.email})`);
    console.log(`   • Members: ${club.members.length}`);
    console.log(`   • Active: ${club.isActive}`);

    console.log('\n👥 Club Members:');
    club.members.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.user.firstName} ${member.user.lastName} (${member.user.email}) - Role: ${member.role}`);
    });

    console.log('\n📋 Join Requests:');
    if (club.joinRequests && club.joinRequests.length > 0) {
      club.joinRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.user.firstName} ${request.user.lastName} (${request.user.email})`);
        console.log(`      Status: ${request.status}`);
        console.log(`      Requested: ${request.requestedAt}`);
        if (request.message) {
          console.log(`      Message: "${request.message}"`);
        }
        console.log('');
      });
    } else {
      console.log('   📝 No join requests found');
    }

    // Check if sundiamr@aol.com is admin
    console.log('\n🔒 Admin Check for sundiamr@aol.com:');
    const targetUser = await User.findOne({ email: 'sundiamr@aol.com' });
    if (targetUser) {
      const memberRecord = club.members.find(m => m.user._id.toString() === targetUser._id.toString());
      if (memberRecord) {
        console.log(`   ✅ User is a member with role: ${memberRecord.role}`);
        console.log(`   🔓 Can manage requests: ${memberRecord.role === 'admin' || memberRecord.role === 'organizer'}`);
      } else {
        console.log('   ❌ User is not a member of this club');
      }
    } else {
      console.log('   ❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the check
checkJoinRequests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});