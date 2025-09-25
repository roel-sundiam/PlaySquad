const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first user from the database
    const user = await User.findOne().select('+password');
    if (!user) {
      console.log('No users found in database');
      return;
    }

    console.log(`\nTesting login for user: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    
    // Test password comparison with the seeded password
    const testPassword = 'password123';
    console.log(`Testing password: ${testPassword}`);
    
    const isMatch = await user.comparePassword(testPassword);
    console.log(`Password match: ${isMatch}`);
    
    if (!isMatch) {
      console.log('\n❌ Password does not match!');
      console.log('This means the seeded passwords are not being hashed properly.');
    } else {
      console.log('\n✅ Password matches!');
      console.log('Login should work with these credentials:');
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${testPassword}`);
    }

    // Check if the user has the required gender field
    console.log(`\nUser gender: ${user.gender}`);
    
    // List all users and their emails for testing
    console.log('\n--- All seeded users ---');
    const allUsers = await User.find().select('firstName lastName email gender');
    allUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.firstName} ${u.lastName} (${u.email}) - ${u.gender}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();