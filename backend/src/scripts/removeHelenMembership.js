const mongoose = require('mongoose');
const Club = require('../models/Club');
const User = require('../models/User');
require('dotenv').config();

async function removeHelenMembership() {
  try {
    console.log('🧹 Removing Helen\'s membership completely...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Helen's user
    const helen = await User.findOne({ email: 'sundiamhelen@yahoo.com' });
    if (!helen) {
      console.log('❌ Helen not found');
      return;
    }

    console.log(`👤 Found Helen: ${helen.firstName} ${helen.lastName} (${helen.email})`);

    // Find the club
    const club = await Club.findOne({ name: 'Rich Town 2 Tennis Club' });
    if (!club) {
      console.log('❌ Club not found');
      return;
    }

    console.log(`🏓 Club: ${club.name}`);
    console.log(`📊 Before - Member Count: ${club.memberCount}, Members Array: ${club.members.length}`);

    // Remove Helen from club members
    const helenMemberIndex = club.members.findIndex(member => 
      member.user && member.user.toString() === helen._id.toString()
    );

    if (helenMemberIndex !== -1) {
      club.members.splice(helenMemberIndex, 1);
      console.log('✅ Removed Helen from club members array');
    } else {
      console.log('ℹ️ Helen not found in club members array');
    }

    // Update member count
    club.memberCount = club.members.length;
    
    // Update active members count
    club.stats.activeMembersCount = club.members.filter(m => m.isActive).length;

    await club.save();

    // Remove club from Helen's clubs array
    const clubIndex = helen.clubs.findIndex(userClub => 
      userClub.club && userClub.club.toString() === club._id.toString()
    );

    if (clubIndex !== -1) {
      helen.clubs.splice(clubIndex, 1);
      await helen.save();
      console.log('✅ Removed club from Helen\'s clubs array');
    } else {
      console.log('ℹ️ Club not found in Helen\'s clubs array');
    }

    console.log(`📊 After - Member Count: ${club.memberCount}, Members Array: ${club.members.length}`);
    console.log(`📊 Active Members: ${club.stats.activeMembersCount}`);
    console.log(`📊 Events Count: ${club.stats.totalEvents}`);

    console.log('✅ Helen\'s membership removed successfully');

  } catch (error) {
    console.error('❌ Error removing Helen\'s membership:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

removeHelenMembership();