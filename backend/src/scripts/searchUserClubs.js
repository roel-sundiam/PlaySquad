const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');

async function searchUserAndClubs(email) {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`❌ User with email "${email}" not found.`);
      
      // Show similar emails if any
      const similarUsers = await User.find({ 
        email: { $regex: email.split('@')[0], $options: 'i' } 
      }).select('firstName lastName email');
      
      if (similarUsers.length > 0) {
        console.log('\n🔍 Found similar users:');
        similarUsers.forEach(u => {
          console.log(`  - ${u.firstName} ${u.lastName} (${u.email})`);
        });
      }
      
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   Skill Level: ${user.skillLevel}/10`);
    console.log(`   Preferred Format: ${user.preferredFormat}`);
    console.log(`   Member since: ${user.createdAt.toDateString()}`);

    // Find clubs owned by this user
    const ownedClubs = await Club.find({ owner: user._id }).populate('members.user', 'firstName lastName email');
    
    if (ownedClubs.length === 0) {
      console.log(`\nℹ️  User "${email}" doesn't own any clubs.`);
    } else {
      console.log(`\n🏆 Clubs owned by ${user.email}:`);
      ownedClubs.forEach((club, index) => {
        console.log(`\n  ${index + 1}. ${club.name}`);
        console.log(`     Sport: ${club.sport}`);
        console.log(`     Location: ${club.location.name}, ${club.location.address}`);
        console.log(`     Members: ${club.memberCount}`);
        console.log(`     Private: ${club.isPrivate ? 'Yes' : 'No'}`);
        console.log(`     Created: ${club.createdAt.toDateString()}`);
        
        if (club.members.length > 0) {
          console.log(`     Club Members:`);
          club.members.forEach(member => {
            if (member.user) {
              console.log(`       - ${member.user.firstName} ${member.user.lastName} (${member.role}) - ${member.user.email}`);
            }
          });
        }
      });
    }

    // Find clubs where user is a member
    const memberClubs = await Club.find({ 
      'members.user': user._id,
      owner: { $ne: user._id }
    }).select('name sport owner');

    if (memberClubs.length > 0) {
      console.log(`\n👥 Clubs where ${user.email} is a member:`);
      memberClubs.forEach((club, index) => {
        console.log(`  ${index + 1}. ${club.name} (${club.sport})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error searching:', error);
    process.exit(1);
  }
}

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('firstName lastName email').sort({ email: 1 });
    console.log(`\n📋 All users in database (${users.length} total):`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} - ${user.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  }
}

// Check command line arguments
const command = process.argv[2];
const email = process.argv[3];

if (command === 'list') {
  listAllUsers();
} else if (command === 'search' && email) {
  console.log(`🔍 Searching for user: ${email}`);
  searchUserAndClubs(email);
} else {
  console.log('Usage:');
  console.log('  node searchUserClubs.js list                    # List all users');
  console.log('  node searchUserClubs.js search <email>         # Search specific user');
  console.log('');
  console.log('Examples:');
  console.log('  node searchUserClubs.js list');
  console.log('  node searchUserClubs.js search sundiamhelen@yahoo.com');
  process.exit(1);
}

module.exports = { searchUserAndClubs, listAllUsers };