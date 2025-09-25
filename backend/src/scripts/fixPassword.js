const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function fixPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'sundiamr@aol.com' });
    if (user) {
      console.log('User found:', user.email);
      console.log('Password hash exists:', !!user.password);
      console.log('Hash length:', user.password ? user.password.length : 0);
      
      // Test if password matches
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password matches:', isMatch);
      
      if (!isMatch) {
        console.log('Updating password...');
        const newHash = await bcrypt.hash('password123', 12);
        user.password = newHash;
        await user.save();
        console.log('Password updated successfully');
        
        // Test again
        const newMatch = await bcrypt.compare('password123', user.password);
        console.log('New password matches:', newMatch);
      }
    } else {
      console.log('User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixPassword();