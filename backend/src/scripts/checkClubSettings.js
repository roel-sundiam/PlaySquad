const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');

async function checkClubSettings() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    const clubs = await Club.find({})
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (clubs.length === 0) {
      console.log('No clubs found in database.');
      process.exit(0);
    }

    console.log(`\n🔍 Club Settings Report (${clubs.length} clubs):\n`);
    
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Owner: ${club.owner.firstName} ${club.owner.lastName}`);
      console.log(`   Sport: ${club.sport}`);
      console.log(`   Location: ${club.location.name}`);
      console.log(`   📊 Settings:`);
      console.log(`     • Auto Accept Members: ${club.settings.autoAcceptMembers ? '✅ YES (auto-accept)' : '❌ NO (requires approval)'}`);
      console.log(`     • Max Members: ${club.settings.maxMembers}`);
      console.log(`     • Allow Guest Players: ${club.settings.allowGuestPlayers ? 'YES' : 'NO'}`);
      console.log(`     • Skill Level Range: ${club.settings.minSkillLevel} - ${club.settings.maxSkillLevel}`);
      console.log(`     • Is Private: ${club.isPrivate ? 'YES' : 'NO'}`);
      
      if (club.joinRequests && club.joinRequests.length > 0) {
        console.log(`   📝 Join Requests: ${club.joinRequests.length} pending`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking club settings:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  checkClubSettings();
}

module.exports = { checkClubSettings };