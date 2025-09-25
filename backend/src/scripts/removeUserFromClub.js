const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');

async function removeUserFromClub(userEmail, clubName = null) {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    // Find the user by email
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      console.log(`❌ User with email "${userEmail}" not found.`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Find clubs where user is a member
    let clubsQuery = { 'members.user': user._id };
    if (clubName) {
      clubsQuery.name = { $regex: clubName, $options: 'i' };
    }

    const clubs = await Club.find(clubsQuery);
    
    if (clubs.length === 0) {
      console.log(`ℹ️  User "${userEmail}" is not a member of any clubs${clubName ? ` matching "${clubName}"` : ''}.`);
      process.exit(0);
    }

    console.log(`\n📋 Found ${clubs.length} club(s) where ${user.email} is a member:`);
    clubs.forEach((club, index) => {
      const memberInfo = club.members.find(m => m.user.toString() === user._id.toString());
      console.log(`  ${index + 1}. ${club.name} (${club.sport}) - Role: ${memberInfo.role}`);
    });

    // Remove user from all found clubs
    for (let club of clubs) {
      await club.removeMember(user._id);
      console.log(`   ✅ Removed ${user.firstName} ${user.lastName} from "${club.name}"`);
    }

    // Remove clubs from user's clubs array
    await User.updateOne(
      { _id: user._id },
      { $pull: { clubs: { club: { $in: clubs.map(c => c._id) } } } }
    );

    console.log(`\n✅ Successfully removed "${userEmail}" from ${clubs.length} club(s)!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing user from club:', error);
    process.exit(1);
  }
}

// Check command line arguments
const userEmail = process.argv[2];
const clubName = process.argv[3];

if (!userEmail) {
  console.log('Usage: node removeUserFromClub.js <email> [clubName]');
  console.log('Examples:');
  console.log('  node removeUserFromClub.js sundiamhelen@yahoo.com');
  console.log('  node removeUserFromClub.js sundiamhelen@yahoo.com "Rich Town 2 Tennis Club"');
  process.exit(1);
}

if (require.main === module) {
  console.log(`🔍 Removing user ${userEmail} from club(s)${clubName ? ` matching "${clubName}"` : ''}...`);
  removeUserFromClub(userEmail, clubName);
}

module.exports = { removeUserFromClub };