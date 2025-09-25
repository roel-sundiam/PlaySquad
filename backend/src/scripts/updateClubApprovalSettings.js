const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');

async function updateClubApprovalSettings() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    // First, get all clubs and show current settings
    const clubs = await Club.find({})
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (clubs.length === 0) {
      console.log('No clubs found in database.');
      process.exit(0);
    }

    console.log(`\n🔍 Found ${clubs.length} club(s) to update:\n`);
    
    // Show current settings
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Owner: ${club.owner.firstName} ${club.owner.lastName}`);
      console.log(`   Current Auto Accept: ${club.settings.autoAcceptMembers ? '✅ YES (auto-accept)' : '❌ NO (requires approval)'}`);
      console.log('');
    });

    // Update all clubs to require approval (set autoAcceptMembers to false)
    console.log('🔄 Updating all clubs to require approval for new members...\n');

    const updateResult = await Club.updateMany(
      {}, // Update all clubs
      { 
        $set: { 
          'settings.autoAcceptMembers': false 
        } 
      }
    );

    console.log(`✅ Update completed!`);
    console.log(`   Clubs matched: ${updateResult.matchedCount}`);
    console.log(`   Clubs modified: ${updateResult.modifiedCount}`);

    // Verify the changes
    console.log('\n🔍 Verifying changes...\n');
    
    const updatedClubs = await Club.find({})
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    updatedClubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Owner: ${club.owner.firstName} ${club.owner.lastName}`);
      console.log(`   Updated Auto Accept: ${club.settings.autoAcceptMembers ? '✅ YES (auto-accept)' : '❌ NO (requires approval)'}`);
      console.log('');
    });

    console.log('🎉 All clubs now require approval for new members!');
    console.log('💡 Users will now need to submit join requests that must be approved by club admins/organizers.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating club settings:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  updateClubApprovalSettings();
}

module.exports = { updateClubApprovalSettings };