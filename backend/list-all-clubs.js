const mongoose = require('mongoose');
const Club = require('./src/models/Club');
require('dotenv').config();

async function listAllClubs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    const clubs = await Club.find({}).select('name coinWallet isActive');
    
    console.log(`📊 Found ${clubs.length} clubs:\n`);
    
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name} (ID: ${club._id})`);
      console.log(`   💰 Balance: ${club.coinWallet?.balance || 'undefined'} coins`);
      console.log(`   🔄 Active: ${club.isActive}`);
      console.log(`   📅 Last transaction: ${club.coinWallet?.lastTransactionAt || 'never'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

listAllClubs();