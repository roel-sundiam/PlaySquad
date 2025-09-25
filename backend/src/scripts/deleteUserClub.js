const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');
const Event = require('../models/Event');

async function deleteClubByUserEmail(email) {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Find clubs owned by this user
    const ownedClubs = await Club.find({ owner: user._id });
    
    if (ownedClubs.length === 0) {
      console.log(`ℹ️  User "${email}" doesn't own any clubs.`);
      process.exit(0);
    }

    console.log(`\n📋 Found ${ownedClubs.length} club(s) owned by ${user.email}:`);
    ownedClubs.forEach((club, index) => {
      console.log(`  ${index + 1}. ${club.name} (${club.sport}) - ${club.memberCount} members`);
    });

    // Delete events associated with these clubs
    for (let club of ownedClubs) {
      const eventsDeleted = await Event.deleteMany({ club: club._id });
      console.log(`   Deleted ${eventsDeleted.deletedCount} events from "${club.name}"`);
    }

    // Remove club memberships from all users
    const clubIds = ownedClubs.map(club => club._id);
    const usersUpdated = await User.updateMany(
      { "clubs.club": { $in: clubIds } },
      { $pull: { clubs: { club: { $in: clubIds } } } }
    );
    console.log(`   Removed club memberships from ${usersUpdated.modifiedCount} users`);

    // Delete the clubs
    const clubsDeleted = await Club.deleteMany({ owner: user._id });
    console.log(`   Deleted ${clubsDeleted.deletedCount} clubs`);

    console.log(`\n✅ Successfully deleted all clubs owned by "${email}"!`);
    console.log('Summary:');
    ownedClubs.forEach((club, index) => {
      console.log(`  - ${club.name} (${club.sport})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting clubs:', error);
    process.exit(1);
  }
}

// Check if email is provided as command line argument
const targetEmail = process.argv[2];
if (!targetEmail) {
  console.log('Usage: node deleteUserClub.js <email>');
  console.log('Example: node deleteUserClub.js sundiamhelen@yahoo.com');
  process.exit(1);
}

if (require.main === module) {
  console.log(`🔍 Searching for clubs owned by: ${targetEmail}`);
  deleteClubByUserEmail(targetEmail);
}

module.exports = { deleteClubByUserEmail };