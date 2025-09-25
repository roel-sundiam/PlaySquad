const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('../models/Event');
const User = require('../models/User');
const Club = require('../models/Club');

async function checkEventData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the event with populated data like the API does
    const event = await Event.findOne({ title: 'Weekly Tennis Doubles Tournament' })
      .populate('club', 'name avatar location sport settings')
      .populate('organizer', 'firstName lastName avatar')
      .populate('rsvps.user', 'firstName lastName avatar skillLevel preferredFormat');
    
    if (!event) {
      console.log('Event not found');
      return;
    }
    
    console.log('Event:', event.title);
    console.log('Total RSVPs:', event.rsvps.length);
    console.log('');
    
    console.log('RSVP Details:');
    event.rsvps.forEach((rsvp, index) => {
      console.log(`${index + 1}. Status: ${rsvp.status}`);
      console.log(`   User ID: ${rsvp.user._id || rsvp.user}`);
      console.log(`   User populated: ${!!rsvp.user.firstName}`);
      if (rsvp.user.firstName) {
        console.log(`   Name: ${rsvp.user.firstName} ${rsvp.user.lastName}`);
        console.log(`   Skill: ${rsvp.skillLevel}`);
        console.log(`   Format: ${rsvp.preferredFormat}`);
      } else {
        console.log(`   Raw user data: ${JSON.stringify(rsvp.user)}`);
      }
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEventData();