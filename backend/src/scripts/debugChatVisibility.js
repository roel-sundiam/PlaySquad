require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const Club = require('../models/Club');

const MONGODB_URI = process.env.MONGODB_URI;

async function debugChatVisibility() {
  try {
    console.log('🔍 Debugging chat visibility issue...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user1Email = 'sundiamhelen@yahoo.com';
    const user2Email = 'sundiamr@aol.com';

    // Find both users
    console.log('\n📋 FINDING USERS:');
    const user1 = await User.findOne({ email: user1Email }).populate('clubs.club');
    const user2 = await User.findOne({ email: user2Email }).populate('clubs.club');

    if (!user1) {
      console.log(`❌ User not found: ${user1Email}`);
    } else {
      console.log(`✅ Found ${user1Email}:`);
      console.log(`   - ID: ${user1._id}`);
      console.log(`   - Name: ${user1.firstName} ${user1.lastName}`);
      console.log(`   - Clubs: ${user1.clubs.length}`);
      user1.clubs.forEach(club => {
        console.log(`     * ${club.club.name} (${club.role}) - ID: ${club.club._id}`);
      });
    }

    if (!user2) {
      console.log(`❌ User not found: ${user2Email}`);
    } else {
      console.log(`✅ Found ${user2Email}:`);
      console.log(`   - ID: ${user2._id}`);
      console.log(`   - Name: ${user2.firstName} ${user2.lastName}`);
      console.log(`   - Clubs: ${user2.clubs.length}`);
      user2.clubs.forEach(club => {
        console.log(`     * ${club.club.name} (${club.role}) - ID: ${club.club._id}`);
      });
    }

    if (!user1 || !user2) {
      console.log('❌ Cannot proceed without both users');
      process.exit(1);
    }

    // Find common clubs
    console.log('\n🏢 CHECKING COMMON CLUBS:');
    const user1ClubIds = user1.clubs.map(c => c.club._id.toString());
    const user2ClubIds = user2.clubs.map(c => c.club._id.toString());
    const commonClubIds = user1ClubIds.filter(id => user2ClubIds.includes(id));

    console.log(`Common clubs: ${commonClubIds.length}`);
    
    if (commonClubIds.length === 0) {
      console.log('❌ Users are not in any common clubs!');
      process.exit(1);
    }

    // Check messages for each common club
    for (const clubId of commonClubIds) {
      console.log(`\n💬 CHECKING MESSAGES IN CLUB ${clubId}:`);
      
      const club = await Club.findById(clubId);
      console.log(`   Club name: ${club.name}`);

      // Get all messages in this club (including soft-deleted)
      const allMessages = await Message.find({ club: clubId })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });

      console.log(`   Total messages (including deleted): ${allMessages.length}`);

      // Get messages from user2 specifically
      const user2Messages = allMessages.filter(msg => 
        msg.user._id.toString() === user2._id.toString()
      );

      console.log(`   Messages from ${user2Email}: ${user2Messages.length}`);

      if (user2Messages.length > 0) {
        console.log(`   Recent messages from ${user2Email}:`);
        user2Messages.slice(0, 5).forEach((msg, idx) => {
          console.log(`     ${idx + 1}. "${msg.content}" (${msg.createdAt.toISOString()}) - Deleted: ${msg.isDeleted}`);
        });
      }

      // Get messages that user1 should see (non-deleted)
      const visibleMessages = await Message.find({ 
        club: clubId,
        isDeleted: { $ne: true }
      })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });

      console.log(`   Visible messages: ${visibleMessages.length}`);

      const visibleUser2Messages = visibleMessages.filter(msg => 
        msg.user._id.toString() === user2._id.toString()
      );

      console.log(`   Visible messages from ${user2Email}: ${visibleUser2Messages.length}`);

      // Test the API query that user1 would make
      console.log(`\n🔍 TESTING API QUERY FOR ${user1Email}:`);
      
      // Simulate the query from the messages API
      let query = { club: clubId };
      
      const apiMessages = await Message.find(query)
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      console.log(`   API query returned: ${apiMessages.length} messages`);
      
      const apiUser2Messages = apiMessages.filter(msg => 
        msg.user._id.toString() === user2._id.toString()
      );

      console.log(`   Messages from ${user2Email} in API result: ${apiUser2Messages.length}`);

      if (apiUser2Messages.length > 0) {
        console.log(`   API messages from ${user2Email}:`);
        apiUser2Messages.forEach((msg, idx) => {
          console.log(`     ${idx + 1}. "${msg.content}" (${msg.createdAt.toISOString()})`);
        });
      }
    }

    console.log('\n✅ Debug analysis complete');

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

debugChatVisibility();