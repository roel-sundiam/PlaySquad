const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function finalPasswordFix() {
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
    
    console.log('Update result - modified:', result.modifiedCount);
    
    // Verify the update - EXPLICITLY SELECT PASSWORD
    const user = await User.findOne({ email: 'sundiamr@aol.com' }).select('+password');
    if (user && user.password) {
      console.log('Password field found, length:', user.password.length);
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password verification:', isMatch ? 'SUCCESS ✅' : 'FAILED ❌');
      
      if (isMatch) {
        console.log('');
        console.log('🎉 Login is now working!');
        console.log('✅ Credentials:');
        console.log('   Email: sundiamr@aol.com');
        console.log('   Password: password123');
      }
    } else {
      console.log('❌ Password field still not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

finalPasswordFix();