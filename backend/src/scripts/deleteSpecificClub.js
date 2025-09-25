const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');
const Event = require('../models/Event');

async function deleteClubByName(clubName) {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    // Find the club by name (case insensitive)
    const club = await Club.findOne({ name: { $regex: clubName, $options: 'i' } })
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');
    
    if (!club) {
      console.log(`❌ Club "${clubName}" not found.`);
      
      // Show available clubs
      const allClubs = await Club.find({}).select('name sport');
      if (allClubs.length > 0) {
        console.log('\n🔍 Available clubs:');
        allClubs.forEach(c => {
          console.log(`  - ${c.name} (${c.sport})`);
        });
      }
      process.exit(1);
    }

    console.log(`✅ Found club: ${club.name}`);
    console.log(`   Sport: ${club.sport}`);
    console.log(`   Owner: ${club.owner.firstName} ${club.owner.lastName} (${club.owner.email})`);
    console.log(`   Location: ${club.location.name}`);
    console.log(`   Members: ${club.memberCount}`);

    if (club.members.length > 0) {
      console.log(`\n👥 Club Members:`);
      club.members.forEach(member => {
        if (member.user) {
          console.log(`  - ${member.user.firstName} ${member.user.lastName} (${member.role}) - ${member.user.email}`);
        }
      });
    }

    // Delete events associated with this club
    const eventsDeleted = await Event.deleteMany({ club: club._id });
    console.log(`\n🗑️  Deleted ${eventsDeleted.deletedCount} events from "${club.name}"`);

    // Remove club memberships from all users
    const usersUpdated = await User.updateMany(
      { "clubs.club": club._id },
      { $pull: { clubs: { club: club._id } } }
    );
    console.log(`   Removed club membership from ${usersUpdated.modifiedCount} users`);

    // Delete the club
    await Club.deleteOne({ _id: club._id });
    console.log(`   Deleted club "${club.name}"`);

    console.log(`\n✅ Successfully deleted club "${club.name}"!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting club:', error);
    process.exit(1);
  }
}

// Check command line arguments
const clubName = process.argv[2];

if (!clubName) {
  console.log('Usage: node deleteSpecificClub.js <clubName>');
  console.log('Example: node deleteSpecificClub.js "Rich Town 2 Tennis Club"');
  process.exit(1);
}

if (require.main === module) {
  console.log(`🔍 Searching for club: ${clubName}`);
  deleteClubByName(clubName);
}

module.exports = { deleteClubByName };