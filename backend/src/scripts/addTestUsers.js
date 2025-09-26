const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const testUsers = [
  // 4 Males
  {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@test.com',
    gender: 'male',
    skillLevel: 7,
    preferredFormat: 'doubles',
    phone: '+1-555-0101'
  },
  {
    firstName: 'David',
    lastName: 'Smith',
    email: 'david.smith@test.com',
    gender: 'male',
    skillLevel: 6,
    preferredFormat: 'singles',
    phone: '+1-555-0102'
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@test.com',
    gender: 'male',
    skillLevel: 8,
    preferredFormat: 'any',
    phone: '+1-555-0103'
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@test.com',
    gender: 'male',
    skillLevel: 5,
    preferredFormat: 'mixed',
    phone: '+1-555-0104'
  },
  // 4 Females
  {
    firstName: 'Sarah',
    lastName: 'Davis',
    email: 'sarah.davis@test.com',
    gender: 'female',
    skillLevel: 6,
    preferredFormat: 'doubles',
    phone: '+1-555-0201'
  },
  {
    firstName: 'Emma',
    lastName: 'Miller',
    email: 'emma.miller@test.com',
    gender: 'female',
    skillLevel: 7,
    preferredFormat: 'singles',
    phone: '+1-555-0202'
  },
  {
    firstName: 'Jessica',
    lastName: 'Garcia',
    email: 'jessica.garcia@test.com',
    gender: 'female',
    skillLevel: 8,
    preferredFormat: 'mixed',
    phone: '+1-555-0203'
  },
  {
    firstName: 'Ashley',
    lastName: 'Martinez',
    email: 'ashley.martinez@test.com',
    gender: 'female',
    skillLevel: 5,
    preferredFormat: 'any',
    phone: '+1-555-0204'
  }
];

async function addTestUsers() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('👥 PlaySquad Test User Creation');
    console.log('==============================');
    console.log('Creating 8 test users (4 male, 4 female)');
    console.log('Password for all users: password123');
    console.log('==============================\n');

    // Check if any users already exist
    console.log('🔍 Checking for existing users...');
    const existingEmails = [];
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        existingEmails.push(userData.email);
      }
    }

    if (existingEmails.length > 0) {
      console.log('⚠️  Found existing users:');
      existingEmails.forEach(email => console.log(`   • ${email}`));
      console.log('\nSkipping existing users and creating only new ones...\n');
    }

    // Hash the password once
    console.log('🔐 Hashing passwords...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    console.log('✅ Passwords hashed\n');

    // Create users
    console.log('👤 Creating users...');
    const createdUsers = [];
    let skippedCount = 0;

    for (const userData of testUsers) {
      // Skip if user already exists
      if (existingEmails.includes(userData.email)) {
        console.log(`   ⏭️  Skipped: ${userData.firstName} ${userData.lastName} (${userData.email}) - already exists`);
        skippedCount++;
        continue;
      }

      // Create new user
      const newUser = new User({
        ...userData,
        password: hashedPassword,
        isEmailVerified: true, // Set as verified for testing
        lastActive: new Date(),
        coinWallet: {
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          lastTransactionAt: null
        },
        stats: {
          gamesPlayed: 0,
          wins: 0,
          losses: 0
        },
        clubs: []
      });

      const savedUser = await newUser.save();
      createdUsers.push(savedUser);
      console.log(`   ✅ Created: ${userData.firstName} ${userData.lastName} (${userData.email}) - ${userData.gender}, skill ${userData.skillLevel}`);
    }

    // Summary
    console.log('\n📊 CREATION SUMMARY:');
    console.log('┌─────────────────────────────────────┬───────────┐');
    console.log('│ Result                              │ Count     │');
    console.log('├─────────────────────────────────────┼───────────┤');
    console.log(`│ Users created                       │ ${createdUsers.length.toString().padStart(9)} │`);
    console.log(`│ Users skipped (already exist)       │ ${skippedCount.toString().padStart(9)} │`);
    console.log(`│ Total users processed               │ ${testUsers.length.toString().padStart(9)} │`);
    console.log('└─────────────────────────────────────┴───────────┘');

    if (createdUsers.length > 0) {
      console.log('\n👥 CREATED USERS BY GENDER:');
      const maleUsers = createdUsers.filter(user => user.gender === 'male');
      const femaleUsers = createdUsers.filter(user => user.gender === 'female');

      console.log(`\n👨 Males (${maleUsers.length}):`);
      maleUsers.forEach(user => {
        console.log(`   • ${user.firstName} ${user.lastName} - ${user.email} (skill: ${user.skillLevel})`);
      });

      console.log(`\n👩 Females (${femaleUsers.length}):`);
      femaleUsers.forEach(user => {
        console.log(`   • ${user.firstName} ${user.lastName} - ${user.email} (skill: ${user.skillLevel})`);
      });

      console.log('\n🔑 LOGIN CREDENTIALS:');
      console.log('   Password for all users: password123');
      console.log('   All users are email verified and ready to use');
    }

    // Verification
    console.log('\n🔍 Final verification...');
    const totalUsers = await User.countDocuments();
    const maleCount = await User.countDocuments({ gender: 'male' });
    const femaleCount = await User.countDocuments({ gender: 'female' });

    console.log(`\n📈 Database totals after creation:`);
    console.log(`   • Total users: ${totalUsers}`);
    console.log(`   • Male users: ${maleCount}`);
    console.log(`   • Female users: ${femaleCount}`);

    if (createdUsers.length > 0) {
      console.log('\n🎉 Test users created successfully!');
      console.log('💡 You can now use these users for testing the application');
    } else {
      console.log('\n✨ All test users already exist - no new users created');
    }

  } catch (error) {
    console.error('\n❌ Error creating test users:', error.message);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      console.error('   Duplicate email detected. Some users may already exist.');
    } else {
      console.error('   Stack trace:', error.stack);
    }

    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔒 Database connection closed');
    } catch (closeError) {
      console.error('❌ Error closing database connection:', closeError.message);
    }
  }
}

// Function to list all test users
async function listTestUsers() {
  try {
    console.log('🔍 PlaySquad Test Users List');
    console.log('============================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmails = testUsers.map(u => u.email);
    const users = await User.find({ email: { $in: testEmails } })
      .select('firstName lastName email gender skillLevel preferredFormat phone createdAt')
      .sort({ gender: 1, firstName: 1 });

    if (users.length === 0) {
      console.log('❌ No test users found in database');
      console.log('   Run without --list to create them');
      return;
    }

    console.log(`📊 Found ${users.length} test users:\n`);

    const males = users.filter(u => u.gender === 'male');
    const females = users.filter(u => u.gender === 'female');

    if (males.length > 0) {
      console.log(`👨 Male Users (${males.length}):`);
      console.log('┌─────────────────────────┬─────────────────────────────┬───────┬─────────────┬─────────────────┐');
      console.log('│ Name                    │ Email                       │ Skill │ Preferred   │ Phone           │');
      console.log('├─────────────────────────┼─────────────────────────────┼───────┼─────────────┼─────────────────┤');
      males.forEach(user => {
        const name = `${user.firstName} ${user.lastName}`.padEnd(23);
        const email = user.email.padEnd(27);
        const skill = user.skillLevel.toString().padStart(5);
        const format = (user.preferredFormat || 'any').padEnd(11);
        const phone = (user.phone || 'N/A').padEnd(15);
        console.log(`│ ${name} │ ${email} │ ${skill} │ ${format} │ ${phone} │`);
      });
      console.log('└─────────────────────────┴─────────────────────────────┴───────┴─────────────┴─────────────────┘\n');
    }

    if (females.length > 0) {
      console.log(`👩 Female Users (${females.length}):`);
      console.log('┌─────────────────────────┬─────────────────────────────┬───────┬─────────────┬─────────────────┐');
      console.log('│ Name                    │ Email                       │ Skill │ Preferred   │ Phone           │');
      console.log('├─────────────────────────┼─────────────────────────────┼───────┼─────────────┼─────────────────┤');
      females.forEach(user => {
        const name = `${user.firstName} ${user.lastName}`.padEnd(23);
        const email = user.email.padEnd(27);
        const skill = user.skillLevel.toString().padStart(5);
        const format = (user.preferredFormat || 'any').padEnd(11);
        const phone = (user.phone || 'N/A').padEnd(15);
        console.log(`│ ${name} │ ${email} │ ${skill} │ ${format} │ ${phone} │`);
      });
      console.log('└─────────────────────────┴─────────────────────────────┴───────┴─────────────┴─────────────────┘\n');
    }

    console.log('🔑 All users have password: password123');
    console.log('✅ All users are email verified and ready for testing');

  } catch (error) {
    console.error('❌ Error listing test users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Function to remove all test users
async function removeTestUsers() {
  try {
    console.log('🗑️  PlaySquad Test Users Removal');
    console.log('=================================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmails = testUsers.map(u => u.email);

    // Find existing test users
    const existingUsers = await User.find({ email: { $in: testEmails } })
      .select('firstName lastName email gender');

    if (existingUsers.length === 0) {
      console.log('✨ No test users found to remove');
      return;
    }

    console.log(`⚠️  Found ${existingUsers.length} test users to remove:`);
    existingUsers.forEach(user => {
      console.log(`   • ${user.firstName} ${user.lastName} (${user.email})`);
    });

    console.log('\n🗑️  Removing test users...');
    const result = await User.deleteMany({ email: { $in: testEmails } });

    console.log(`\n✅ Removed ${result.deletedCount} test users successfully!`);

  } catch (error) {
    console.error('❌ Error removing test users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    await listTestUsers();
  } else if (args.includes('--remove') || args.includes('-r')) {
    await removeTestUsers();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('👥 PlaySquad Test Users Management Script');
    console.log('=========================================\n');
    console.log('Usage:');
    console.log('  node addTestUsers.js           # Create 8 test users');
    console.log('  node addTestUsers.js --list    # List existing test users');
    console.log('  node addTestUsers.js --remove  # Remove all test users');
    console.log('  node addTestUsers.js --help    # Show this help\n');
    console.log('Test Users:');
    console.log('• 4 Males: Alex Johnson, David Smith, Michael Brown, James Wilson');
    console.log('• 4 Females: Sarah Davis, Emma Miller, Jessica Garcia, Ashley Martinez');
    console.log('• All users have password: password123');
    console.log('• Skill levels range from 5-8');
    console.log('• Various preferred formats (singles, doubles, mixed, any)\n');
  } else {
    await addTestUsers();
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('\n✨ Script execution completed!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Script execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = { addTestUsers, listTestUsers, removeTestUsers };