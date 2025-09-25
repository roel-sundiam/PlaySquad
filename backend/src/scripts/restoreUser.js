const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');
const Club = require('../models/Club');

async function restoreUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create the user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const userData = {
      firstName: 'Sunday',
      lastName: 'Amr',
      email: 'sundiamr@aol.com',
      password: hashedPassword,
      skillLevel: 8,
      preferredFormat: 'doubles',
      phone: '+1234567890',
      dateOfBirth: new Date('1985-01-01'),
      clubs: []
    };
    
    const user = new User(userData);
    await user.save();
    console.log('Created user:', user.firstName, user.lastName, user.email);
    console.log('User ID:', user._id);
    
    // Now let's check if there are clubs that need an owner
    const clubs = await Club.find({});
    console.log('Found', clubs.length, 'clubs');
    
    // Make this user the owner of the first club as an example
    if (clubs.length > 0) {
      const firstClub = clubs[0];
      console.log('Making user owner of club:', firstClub.name);
      
      // Set the club owner
      firstClub.owner = user._id;
      
      // Add user to club members with admin role
      firstClub.members.push({
        user: user._id,
        role: 'admin',
        joinedAt: new Date()
      });
      
      await firstClub.save();
      
      // Add club to user's clubs
      user.clubs.push({
        club: firstClub._id,
        role: 'admin',
        joinedAt: new Date()
      });
      
      await user.save();
      
      console.log('User is now owner of:', firstClub.name);
    }
    
    await mongoose.disconnect();
    console.log('User restoration completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

restoreUser();