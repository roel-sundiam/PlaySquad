const mongoose = require('mongoose');
const Club = require('../models/Club');
require('dotenv').config();

async function cleanProcessedRequests() {
  try {
    console.log('🧹 Cleaning processed join requests...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all clubs with processed join requests
    const clubs = await Club.find({
      'joinRequests.status': { $in: ['approved', 'rejected'] }
    });

    for (const club of clubs) {
      const beforeCount = club.joinRequests.length;
      
      // Remove approved and rejected requests, keep only pending
      club.joinRequests = club.joinRequests.filter(
        request => request.status === 'pending'
      );
      
      const afterCount = club.joinRequests.length;
      
      if (beforeCount !== afterCount) {
        await club.save();
        console.log(`🧹 Removed ${beforeCount - afterCount} processed request(s) from "${club.name}"`);
      }
    }

    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Error cleaning requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanProcessedRequests();