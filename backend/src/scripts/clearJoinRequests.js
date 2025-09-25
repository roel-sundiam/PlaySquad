const mongoose = require('mongoose');
const Club = require('../models/Club');
const User = require('../models/User');
require('dotenv').config();

async function clearJoinRequests() {
  try {
    console.log('🔍 Clearing join requests for sundiamhelen@yahoo.com...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'sundiamhelen@yahoo.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);

    // Find all clubs and remove any join requests from this user
    const clubs = await Club.find({});
    
    for (const club of clubs) {
      const beforeCount = club.joinRequests.length;
      
      // Remove any join requests from this user
      club.joinRequests = club.joinRequests.filter(
        request => request.user.toString() !== user._id.toString()
      );
      
      const afterCount = club.joinRequests.length;
      
      if (beforeCount !== afterCount) {
        await club.save();
        console.log(`🧹 Removed ${beforeCount - afterCount} join request(s) from "${club.name}"`);
      }
    }

    console.log('✅ All join requests cleared for user');

  } catch (error) {
    console.error('❌ Error clearing join requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearJoinRequests();