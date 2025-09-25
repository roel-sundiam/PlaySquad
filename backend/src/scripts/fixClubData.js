const mongoose = require('mongoose');
const Club = require('../models/Club');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

async function fixClubData() {
  try {
    console.log('🔧 Fixing club data inconsistencies...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the club
    const club = await Club.findOne({ name: 'Rich Town 2 Tennis Club' });

    if (!club) {
      console.log('❌ Club not found');
      return;
    }

    console.log(`🏓 Club: ${club.name}`);
    console.log(`📊 Before - Member Count: ${club.memberCount}, Members Array: ${club.members.length}`);

    // Remove any members with null/invalid user references
    const validMembers = [];
    for (const member of club.members) {
      if (member.user) {
        // Check if user actually exists
        const userExists = await User.findById(member.user);
        if (userExists) {
          validMembers.push(member);
          console.log(`✅ Valid member: ${userExists.email}`);
        } else {
          console.log(`🧹 Removing invalid member reference: ${member.user}`);
        }
      } else {
        console.log(`🧹 Removing null member reference`);
      }
    }

    // Update the club with valid members only
    club.members = validMembers;
    
    // Update member count to match actual members
    club.memberCount = validMembers.length;

    // Update stats
    const actualEvents = await Event.find({ club: club._id });
    club.stats.totalEvents = actualEvents.length;
    club.stats.activeMembersCount = validMembers.filter(m => m.isActive).length;

    await club.save();

    console.log(`📊 After - Member Count: ${club.memberCount}, Members Array: ${club.members.length}`);
    console.log(`📊 Events Count: ${club.stats.totalEvents}`);
    console.log(`📊 Active Members: ${club.stats.activeMembersCount}`);

    console.log('✅ Club data fixed successfully');

  } catch (error) {
    console.error('❌ Error fixing club data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixClubData();