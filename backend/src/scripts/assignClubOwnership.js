const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Club = require('../models/Club');

async function assignOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'sundiamr@aol.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', user.firstName, user.lastName);
    
    // Get the first club
    const club = await Club.findOne().sort({ _id: 1 });
    if (!club) {
      console.log('No clubs found');
      return;
    }
    
    console.log('Assigning ownership of club:', club.name);
    
    // Set user as owner
    club.owner = user._id;
    
    // Add user to members if not already there
    const existingMember = club.members.find(m => m.user.toString() === user._id.toString());
    if (!existingMember) {
      club.members.push({
        user: user._id,
        role: 'admin',
        joinedAt: new Date()
      });
      console.log('Added user as admin member');
    } else {
      existingMember.role = 'admin';
      console.log('Updated existing member to admin');
    }
    
    await club.save();
    
    // Add club to user's clubs if not already there
    const existingClub = user.clubs.find(c => c.club.toString() === club._id.toString());
    if (!existingClub) {
      user.clubs.push({
        club: club._id,
        role: 'admin',
        joinedAt: new Date()
      });
      console.log('Added club to user');
    } else {
      existingClub.role = 'admin';
      console.log('Updated user club role');
    }
    
    await user.save();
    
    console.log('Success! User', user.email, 'now owns club:', club.name);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignOwnership();