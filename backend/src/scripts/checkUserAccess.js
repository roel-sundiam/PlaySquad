const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('../models/Event');
const User = require('../models/User');
const Club = require('../models/Club');

async function checkUserAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the user
    const user = await User.findOne({ email: 'sundiamr@aol.com' }).populate('clubs.club', 'name');
    console.log('User:', user.firstName, user.lastName);
    console.log('User clubs:');
    user.clubs.forEach(club => {
      console.log(`- ${club.club.name} (Role: ${club.role})`);
    });
    console.log('');
    
    // Get the event 
    const event = await Event.findOne({ title: 'Weekly Tennis Doubles Tournament' }).populate('club', 'name');
    console.log('Event:', event.title);
    console.log('Event club:', event.club.name);
    console.log('Event club ID:', event.club._id);
    console.log('');
    
    // Check if user is member of event's club
    const userClubIds = user.clubs.map(c => c.club._id.toString());
    const eventClubId = event.club._id.toString();
    const hasAccess = userClubIds.includes(eventClubId);
    
    console.log('User club IDs:', userClubIds);
    console.log('Event club ID:', eventClubId);
    console.log('User has access to event:', hasAccess ? 'YES ✅' : 'NO ❌');
    
    if (!hasAccess) {
      console.log('');
      console.log('🚨 ISSUE FOUND: User is not a member of the event\'s club!');
      console.log('Need to add user to the event\'s club.');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserAccess();