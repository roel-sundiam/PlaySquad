require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const Club = require('../models/Club');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;

async function testMessageAPI() {
  try {
    console.log('🧪 Testing Message API Flow...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find Helen
    const helen = await User.findOne({ email: 'sundiamhelen@yahoo.com' });
    const roel = await User.findOne({ email: 'sundiamr@aol.com' });
    
    if (!helen) {
      console.log('❌ Helen not found');
      process.exit(1);
    }

    if (!roel) {
      console.log('❌ Roel not found');
      process.exit(1);
    }

    console.log(`✅ Found Helen: ${helen.firstName} ${helen.lastName} (ID: ${helen._id})`);
    console.log(`✅ Found Roel: ${roel.firstName} ${roel.lastName} (ID: ${roel._id})`);

    // Get the club ID
    const clubId = '68d1eeffaca38ed66a44d774'; // Rich Town 2 Tennis Club

    console.log(`\n🏢 Testing for club: ${clubId}`);

    // Test 1: Check if Helen is a member of the club
    console.log('\n📋 Test 1: Helen\'s Club Membership');
    const helenIsMember = helen.clubs.some(
      club => club.club.toString() === clubId.toString()
    );
    console.log(`   Helen is member: ${helenIsMember ? 'YES ✅' : 'NO ❌'}`);

    // Test 2: Get all messages in the club (raw database query)
    console.log('\n📋 Test 2: Raw Database Messages');
    const allMessages = await Message.find({ club: clubId })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`   Total messages in club: ${allMessages.length}`);
    allMessages.forEach((msg, idx) => {
      console.log(`     ${idx + 1}. From: ${msg.user.email} - "${msg.content}" (Deleted: ${msg.isDeleted})`);
    });

    // Test 3: Simulate the exact API query (with pre-filter applied by Mongoose)
    console.log('\n📋 Test 3: API-style Query (with soft-delete filter)');
    let query = { club: clubId };
    
    const apiMessages = await Message.find(query)
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`   API-style query returned: ${apiMessages.length} messages`);
    apiMessages.forEach((msg, idx) => {
      console.log(`     ${idx + 1}. From: ${msg.user.firstName} ${msg.user.lastName} - "${msg.content}"`);
    });

    // Test 4: Check messages from Roel specifically
    console.log('\n📋 Test 4: Messages from Roel');
    const roelMessages = apiMessages.filter(msg => 
      msg.user._id.toString() === roel._id.toString()
    );
    console.log(`   Messages from Roel visible to Helen: ${roelMessages.length}`);
    roelMessages.forEach((msg, idx) => {
      console.log(`     ${idx + 1}. "${msg.content}" (${msg.createdAt})`);
    });

    // Test 5: Generate a JWT token for Helen (what frontend would use)
    console.log('\n📋 Test 5: JWT Token Test');
    const token = jwt.sign(
      { 
        id: helen._id,
        email: helen.email,
        firstName: helen.firstName,
        lastName: helen.lastName
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log(`   Generated JWT token: ${token.substring(0, 50)}...`);

    // Test 6: Simulate the clubMember middleware check
    console.log('\n📋 Test 6: Club Member Middleware Simulation');
    // Refresh Helen's data to get latest clubs array
    const helenFresh = await User.findById(helen._id);
    const middlewareCheck = helenFresh.clubs.some(
      club => club.club.toString() === clubId.toString()
    );
    console.log(`   Middleware would allow access: ${middlewareCheck ? 'YES ✅' : 'NO ❌'}`);

    // Test 7: Check if there are any issues with the Message model pre-hooks
    console.log('\n📋 Test 7: Message Model Pre-hooks Test');
    const directQuery = await mongoose.connection.db.collection('messages').find({ club: new mongoose.Types.ObjectId(clubId) }).toArray();
    console.log(`   Raw MongoDB query (bypassing Mongoose): ${directQuery.length} messages`);
    
    const nonDeletedRaw = directQuery.filter(msg => !msg.isDeleted);
    console.log(`   Non-deleted messages (raw): ${nonDeletedRaw.length}`);

    // Final test: Check if the issue is with the populate
    console.log('\n📋 Test 8: Population Test');
    const messagesWithoutPopulate = await Message.find({ club: clubId }).sort({ createdAt: -1 });
    console.log(`   Messages without populate: ${messagesWithoutPopulate.length}`);

    console.log('\n🎯 SUMMARY:');
    console.log(`   - Helen is a club member: ${helenIsMember}`);
    console.log(`   - Raw database has ${allMessages.length} messages`);
    console.log(`   - API query returns ${apiMessages.length} messages`);
    console.log(`   - Messages from Roel: ${roelMessages.length}`);
    console.log(`   - JWT token generated successfully`);
    console.log(`   - Middleware check passes: ${middlewareCheck}`);

    if (roelMessages.length === 0 && allMessages.length > 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED: Messages exist but not appearing in API results');
      console.log('   This suggests a problem with the Message model or query logic');
    } else if (roelMessages.length > 0) {
      console.log('\n✅ API should be working correctly - the issue might be in the frontend');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

testMessageAPI();