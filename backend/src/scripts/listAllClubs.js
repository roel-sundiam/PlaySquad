const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');

async function listAllClubs() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    const clubs = await Club.find({})
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (clubs.length === 0) {
      console.log('No clubs found in database.');
      process.exit(0);
    }

    console.log(`\n📋 All clubs in database (${clubs.length} total):\n`);
    
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Sport: ${club.sport}`);
      console.log(`   Owner: ${club.owner.firstName} ${club.owner.lastName} (${club.owner.email})`);
      console.log(`   Location: ${club.location.name}, ${club.location.address}`);
      console.log(`   Members: ${club.memberCount} (${club.isPrivate ? 'Private' : 'Public'})`);
      console.log(`   Created: ${club.createdAt.toDateString()}`);
      
      if (club.members.length > 0) {
        console.log(`   Club Members:`);
        club.members.forEach(member => {
          if (member.user) {
            console.log(`     - ${member.user.firstName} ${member.user.lastName} (${member.role}) - ${member.user.email}`);
          }
        });
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing clubs:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  listAllClubs();
}

module.exports = { listAllClubs };