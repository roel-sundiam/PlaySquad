const mongoose = require('mongoose');
require('dotenv').config();

const Message = require('../models/Message');
const Club = require('../models/Club');
const User = require('../models/User');

async function addTestMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first club and its members
    const club = await Club.findOne().populate('members.user');
    if (!club) {
      console.log('No clubs found');
      return;
    }

    console.log(`Adding messages to club: ${club.name}`);
    
    // Get some club members
    const members = club.members.slice(0, 3); // Take first 3 members
    
    if (members.length === 0) {
      console.log('No members found in club');
      return;
    }

    const testMessages = [
      {
        user: members[0].user._id,
        content: "Hey everyone! Looking forward to our next game!",
        type: "text"
      },
      {
        user: members[1].user._id,
        content: "Same here! What time are we meeting this weekend?",
        type: "text"
      },
      {
        user: members[2].user._id,
        content: "I think it's at 10 AM on Saturday. Can't wait!",
        type: "text"
      },
      {
        user: members[0].user._id,
        content: "Perfect! See you all there. Don't forget to bring water!",
        type: "text"
      },
      {
        user: members[1].user._id,
        content: "Will do! Thanks for organizing this.",
        type: "text"
      }
    ];

    // Clear existing messages for this club
    await Message.deleteMany({ club: club._id });
    console.log('Cleared existing messages');

    // Add new test messages
    for (const messageData of testMessages) {
      const message = new Message({
        club: club._id,
        user: messageData.user,
        content: messageData.content,
        type: messageData.type
      });
      await message.save();
    }

    console.log(`✅ Added ${testMessages.length} test messages to ${club.name}`);
    console.log('Members who sent messages:');
    members.forEach(member => {
      console.log(`- ${member.user.firstName} ${member.user.lastName} (${member.user.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTestMessages();