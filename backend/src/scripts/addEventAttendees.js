const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('../models/Event');
const User = require('../models/User');

async function addAttendees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the first event
    const event = await Event.findOne().sort({ _id: 1 });
    console.log('Working with event ID:', event._id);
    
    // Get 7 users to add as attendees
    const users = await User.find().limit(7);
    console.log('Found', users.length, 'users to add');
    
    // Add each user as attending
    for (const user of users) {
      // Check if user already has RSVP
      const existingRsvp = event.rsvps.find(r => r.user.toString() === user._id.toString());
      if (!existingRsvp) {
        event.rsvps.push({
          user: user._id,
          status: 'attending',
          skillLevel: user.skillLevel,
          preferredFormat: user.preferredFormat,
          rsvpedAt: new Date()
        });
        console.log('Added', user.firstName, user.lastName, '(skill level:', user.skillLevel + ') as attending');
      } else {
        console.log(user.firstName, user.lastName, 'already has RSVP, updating to attending');
        existingRsvp.status = 'attending';
        existingRsvp.skillLevel = user.skillLevel;
      }
    }
    
    await event.save();
    console.log('Event updated with', event.rsvps.filter(r => r.status === 'attending').length, 'attendees');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addAttendees();