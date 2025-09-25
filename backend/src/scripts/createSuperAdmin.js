const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: 'superadmin@playsquad.com' });
    if (existingAdmin) {
      console.log('Super admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.firstName, existingAdmin.lastName);
      await mongoose.connection.close();
      return;
    }

    // Create super admin user
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@playsquad.com',
      password: 'SuperAdmin123!', // This will be hashed by the pre-save middleware
      gender: 'other',
      skillLevel: 10,
      preferredFormat: 'any',
      isEmailVerified: true,
      coinWallet: {
        balance: 10000, // Give admin some coins for testing
        totalEarned: 10000,
        totalSpent: 0,
        lastTransactionAt: new Date()
      }
    });

    await superAdmin.save();

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email: superadmin@playsquad.com');
    console.log('🔒 Password: SuperAdmin123!');
    console.log('💰 Starting balance: 10,000 coins');
    console.log('');
    console.log('You can now login and access the admin interface at:');
    console.log('http://localhost:4200/admin/coin-requests');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Also create a regular admin user for testing
async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const existingTestAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingTestAdmin) {
      console.log('Test admin already exists!');
      return;
    }

    const testAdmin = new User({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      password: 'TestAdmin123!',
      gender: 'other',
      skillLevel: 8,
      preferredFormat: 'any',
      isEmailVerified: true,
      coinWallet: {
        balance: 5000,
        totalEarned: 5000,
        totalSpent: 0,
        lastTransactionAt: new Date()
      }
    });

    await testAdmin.save();
    console.log('✅ Test Admin created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔒 Password: TestAdmin123!');
    
  } catch (error) {
    console.error('Error creating test admin:', error);
  }
}

async function main() {
  await createSuperAdmin();
  await createTestAdmin();
}

if (require.main === module) {
  main();
}

module.exports = { createSuperAdmin, createTestAdmin };