const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Event = require('../models/Event');
const Club = require('../models/Club');

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check user
    const user = await User.findOne({ email: 'sundiamr@aol.com' });
    console.log('User exists:', !!user);
    if (user) console.log('User ID:', user._id);
    
    // Check events
    const events = await Event.find({}).populate('club', 'name');
    console.log('Total events:', events.length);
    events.forEach(event => {
      const attendees = event.rsvps.filter(r => r.status === 'attending').length;
      console.log('- Event:', event.title || 'Untitled', '- Club:', event.club.name, '- Attendees:', attendees);
    });
    
    // Check clubs
    const clubs = await Club.find({});
    console.log('Total clubs:', clubs.length);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStatus();