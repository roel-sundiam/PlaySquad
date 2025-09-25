const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function simplePasswordFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Hash the password
    const hash = await bcrypt.hash('password123', 12);
    console.log('Generated hash for password123');
    
    // Update directly using updateOne
    const result = await User.updateOne(
      { email: 'sundiamr@aol.com' },
      { $set: { password: hash } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const user = await User.findOne({ email: 'sundiamr@aol.com' });
    if (user && user.password) {
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password verification:', isMatch ? 'SUCCESS ✅' : 'FAILED ❌');
      
      if (isMatch) {
        console.log('');
        console.log('✅ User can now log in with:');
        console.log('Email: sundiamr@aol.com');
        console.log('Password: password123');
      }
    } else {
      console.log('Password not set properly');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

simplePasswordFix();