const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');

async function clearAllClubs() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    // Delete all clubs
    const clubsDeleted = await Club.deleteMany({});
    console.log(`Deleted ${clubsDeleted.deletedCount} clubs`);

    // Clear clubs array from all users
    const usersUpdated = await User.updateMany(
      {}, 
      { $set: { clubs: [] } }
    );
    console.log(`Cleared club memberships from ${usersUpdated.modifiedCount} users`);

    console.log('✅ All clubs and memberships cleared successfully!');
    console.log('Database is now ready for fresh testing.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing clubs:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  clearAllClubs();
}

module.exports = { clearAllClubs };