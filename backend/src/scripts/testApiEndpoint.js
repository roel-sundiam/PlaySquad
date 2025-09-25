require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');

const MONGODB_URI = process.env.MONGODB_URI;

async function testApiEndpoint() {
  try {
    console.log('🧪 Testing API endpoint for message visibility...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find Helen
    const helen = await User.findOne({ email: 'sundiamhelen@yahoo.com' }).populate('clubs.club');
    
    if (!helen) {
      console.log('❌ Helen not found');
      process.exit(1);
    }

    console.log(`✅ Found Helen: ${helen.firstName} ${helen.lastName}`);
    console.log(`   - User ID: ${helen._id}`);
    console.log(`   - Clubs: ${helen.clubs.length}`);
    
    helen.clubs.forEach(club => {
      console.log(`     * ${club.club.name} (${club.role}) - ID: ${club.club._id}`);
    });

    // Create a mock request object like the middleware would see
    const clubId = helen.clubs[0].club._id.toString();
    console.log(`\n🔍 Testing club membership for club: ${clubId}`);

    // Test the clubMember middleware logic
    const isMember = helen.clubs.some(
      club => club.club._id.toString() === clubId.toString()
    );

    console.log(`   Club membership check: ${isMember ? 'PASS ✅' : 'FAIL ❌'}`);

    // Generate mock JWT token payload (what would be in req.user)
    console.log('\n📋 Mock JWT token payload for Helen:');
    console.log({
      id: helen._id.toString(),
      email: helen.email,
      firstName: helen.firstName,
      lastName: helen.lastName,
      clubs: helen.clubs.map(c => ({
        club: c.club._id.toString(),
        role: c.role
      }))
    });

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Test the API endpoint directly with Helen\'s JWT token');
    console.log(`2. Make a GET request to: /api/messages/club/${clubId}`);
    console.log('3. Include Authorization: Bearer <jwt_token> header');
    console.log('4. Check if the response includes messages from sundiamr@aol.com');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

testApiEndpoint();