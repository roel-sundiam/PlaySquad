const mongoose = require('mongoose');
const Club = require('../models/Club');
require('dotenv').config();

async function forceUpdateClubSettings() {
  try {
    console.log('🔧 Force updating club settings...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific club
    const club = await Club.findOne({ name: 'Rich Town 2 Tennis Club' });
    
    if (!club) {
      console.log('❌ Club not found');
      return;
    }

    console.log('📋 Before update:');
    console.log(`   autoAcceptMembers: ${club.settings.autoAcceptMembers}`);

    // Force update using direct MongoDB update
    const result = await Club.updateOne(
      { _id: club._id },
      { 
        $set: { 
          'settings.autoAcceptMembers': false 
        } 
      }
    );

    console.log('📊 Update result:', result);

    // Verify the update
    const updatedClub = await Club.findById(club._id);
    console.log('📋 After update:');
    console.log(`   autoAcceptMembers: ${updatedClub.settings.autoAcceptMembers}`);

    if (updatedClub.settings.autoAcceptMembers === false) {
      console.log('✅ Successfully updated club to require approval');
    } else {
      console.log('❌ Update failed - still auto-accepting');
    }

  } catch (error) {
    console.error('❌ Error updating club settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

forceUpdateClubSettings();