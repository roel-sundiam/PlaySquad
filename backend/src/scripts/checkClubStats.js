const mongoose = require('mongoose');
const Club = require('../models/Club');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

async function checkClubStats() {
  try {
    console.log('🔍 Checking club statistics...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the club
    const club = await Club.findOne({ name: 'Rich Town 2 Tennis Club' })
      .populate('members.user', 'firstName lastName email')
      .populate('owner', 'firstName lastName email');

    if (!club) {
      console.log('❌ Club not found');
      return;
    }

    console.log(`🏓 Club: ${club.name}`);
    console.log(`👑 Owner: ${club.owner.firstName} ${club.owner.lastName} (${club.owner.email})`);
    console.log(`📊 Member Count Property: ${club.memberCount}`);
    console.log(`📊 Actual Members Array Length: ${club.members.length}`);
    console.log(`📊 Stats - Total Events: ${club.stats.totalEvents}`);
    console.log(`📊 Stats - Total Matches: ${club.stats.totalMatches}`);
    console.log(`📊 Stats - Active Members: ${club.stats.activeMembersCount}`);

    console.log('\n👥 Current members:');
    if (club.members.length === 0) {
      console.log('   (no members)');
    } else {
      club.members.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.user.firstName} ${member.user.lastName} (${member.user.email}) - ${member.role}`);
        console.log(`      Active: ${member.isActive}, Joined: ${member.joinedAt}`);
      });
    }

    // Check actual events for this club
    const events = await Event.find({ club: club._id });
    console.log(`\n📅 Actual Events in Database: ${events.length}`);
    
    if (events.length > 0) {
      console.log('   Events:');
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title} - Status: ${event.status}`);
      });
    }

    // Check if there's a mismatch
    if (club.memberCount !== club.members.length) {
      console.log(`\n⚠️  MISMATCH: memberCount (${club.memberCount}) !== members.length (${club.members.length})`);
    }

    if (club.stats.totalEvents !== events.length) {
      console.log(`\n⚠️  MISMATCH: stats.totalEvents (${club.stats.totalEvents}) !== actual events (${events.length})`);
    }

  } catch (error) {
    console.error('❌ Error checking club stats:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkClubStats();