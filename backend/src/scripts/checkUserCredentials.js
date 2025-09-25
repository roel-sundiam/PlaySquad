const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkUserCredentials() {
  try {
    console.log('🔍 Checking user credentials...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'sundiamhelen@yahoo.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('🔒 Password hash:', user.password.substring(0, 20) + '...');

    // Test common passwords
    const testPasswords = ['password123', 'password', '123456', 'test123'];
    
    for (const password of testPasswords) {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`🔑 Testing "${password}": ${isMatch ? '✅ MATCH' : '❌ NO'}`);
      if (isMatch) {
        console.log(`✅ Correct password found: "${password}"`);
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUserCredentials();