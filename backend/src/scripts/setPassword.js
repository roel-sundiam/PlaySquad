const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function setPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'sundiamr@aol.com' });
    if (user) {
      console.log('User found:', user.email);
      console.log('Current password exists:', !!user.password);
      
      // Set new password
      console.log('Setting password to: password123');
      const newHash = await bcrypt.hash('password123', 12);
      user.password = newHash;
      await user.save();
      console.log('Password set successfully');
      
      // Test the password
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
      
      if (isMatch) {
        console.log('\n✅ Login credentials:');
        console.log('Email: sundiamr@aol.com');
        console.log('Password: password123');
      }
    } else {
      console.log('User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

setPassword();