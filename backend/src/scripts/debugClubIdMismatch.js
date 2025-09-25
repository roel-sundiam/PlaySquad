require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');

const MONGODB_URI = process.env.MONGODB_URI;

async function debugClubIdMismatch() {
  try {
    console.log('🔍 Debugging Club ID Mismatch Issue...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test what the /auth/me endpoint returns for Helen
    console.log('\n📋 Simulating /auth/me endpoint for Helen:');
    
    const helen = await User.findOne({ email: 'sundiamhelen@yahoo.com' }).populate('clubs.club');
    
    if (!helen) {
      console.log('❌ Helen not found');
      process.exit(1);
    }

    console.log(`✅ Found Helen: ${helen.firstName} ${helen.lastName}`);
    console.log(`   - User ID: ${helen._id}`);
    console.log(`   - Raw _id type: ${typeof helen._id}`);
    console.log(`   - _id toString(): ${helen._id.toString()}`);

    console.log('\n🏢 Helen\'s Clubs Array (what frontend receives):');
    helen.clubs.forEach((userClub, idx) => {
      console.log(`   Club ${idx + 1}:`);
      console.log(`     - userClub.club._id: ${userClub.club._id}`);
      console.log(`     - userClub.club.id: ${userClub.club.id}`);
      console.log(`     - userClub.club._id type: ${typeof userClub.club._id}`);
      console.log(`     - userClub.club.id type: ${typeof userClub.club.id}`);
      console.log(`     - userClub.club._id toString(): ${userClub.club._id.toString()}`);
      console.log(`     - userClub.club.id toString(): ${userClub.club.id.toString()}`);
      console.log(`     - userClub.club.name: ${userClub.club.name}`);
      console.log(`     - userClub.role: ${userClub.role}`);
    });

    // Test the exact club we're looking for
    const targetClubId = '68d1eeffaca38ed66a44d774';
    console.log(`\n🎯 Testing against target club ID: ${targetClubId}`);
    console.log(`   - Target club ID type: ${typeof targetClubId}`);

    // Test all possible comparison methods
    console.log('\n🔬 Testing Comparison Methods:');
    helen.clubs.forEach((userClub, idx) => {
      console.log(`   Club ${idx + 1} comparisons:`);
      
      // Method 1: Direct _id comparison
      const method1 = userClub.club._id === targetClubId;
      console.log(`     - userClub.club._id === targetClubId: ${method1}`);
      
      // Method 2: Direct id comparison  
      const method2 = userClub.club.id === targetClubId;
      console.log(`     - userClub.club.id === targetClubId: ${method2}`);
      
      // Method 3: toString() _id comparison
      const method3 = userClub.club._id.toString() === targetClubId;
      console.log(`     - userClub.club._id.toString() === targetClubId: ${method3}`);
      
      // Method 4: toString() id comparison
      const method4 = userClub.club.id.toString() === targetClubId;
      console.log(`     - userClub.club.id.toString() === targetClubId: ${method4}`);
      
      // Method 5: Frontend logic simulation (what's in the component)
      const clubId = typeof userClub.club === 'string' ? userClub.club : userClub.club?._id || userClub.club?.id;
      const method5 = clubId === targetClubId;
      console.log(`     - Frontend logic result: ${method5}`);
      console.log(`     - Frontend clubId value: ${clubId}`);
      console.log(`     - Frontend clubId type: ${typeof clubId}`);
    });

    // Test what the club detail component receives
    console.log('\n🏗️ Testing Club Detail Component Logic:');
    
    // Simulate what happens when club detail loads
    const clubFromAPI = await Club.findById(targetClubId);
    if (clubFromAPI) {
      console.log(`   - Club from API: ${clubFromAPI.name}`);
      console.log(`   - Club API _id: ${clubFromAPI._id}`);
      console.log(`   - Club API id: ${clubFromAPI.id}`);
      console.log(`   - Club API _id type: ${typeof clubFromAPI._id}`);
      console.log(`   - Club API id type: ${typeof clubFromAPI.id}`);
      
      // Test the exact isMember logic from the component
      console.log('\n🧪 Simulating isMember() Logic:');
      console.log('   Frontend receives club object with this.club.id = ' + clubFromAPI.id);
      console.log('   Frontend receives currentUser with clubs array...');
      
      const isMemberResult = helen.clubs.some(userClub => {
        // Handle both populated and non-populated club references
        const clubId = typeof userClub.club === 'string' ? userClub.club : userClub.club?._id || userClub.club?.id;
        const comparison = clubId === clubFromAPI.id;
        console.log(`     - Comparing ${clubId} === ${clubFromAPI.id}: ${comparison}`);
        return comparison;
      });
      
      console.log(`   - Final isMember result: ${isMemberResult}`);
      
      if (!isMemberResult) {
        console.log('\n❌ ISSUE FOUND: isMember() returns false!');
        console.log('   This explains why loadMessages() is not being called');
        console.log('   The club ID comparison logic has a mismatch');
      } else {
        console.log('\n✅ isMember() logic works correctly');
      }
    }

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

debugClubIdMismatch();