const mongoose = require('mongoose');
const Club = require('./src/models/Club');
const { COIN_COSTS } = require('./src/middleware/coinAuth');
require('dotenv').config();

async function debugBalanceIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find RT2 Tennis Club specifically
    const club = await Club.findOne({ name: /RT2.*Tennis/i }) || await Club.findOne({ name: /Rich Town.*Tennis/i });
    
    if (!club) {
      console.log('❌ RT2 Tennis Club not found');
      return;
    }
    
    console.log(`📊 Found club: ${club.name}`);
    console.log(`🆔 Club ID: ${club._id}`);
    console.log(`💰 Raw coinWallet:`, JSON.stringify(club.coinWallet, null, 2));
    console.log(`💰 Balance: ${club.coinWallet?.balance}`);
    console.log(`💰 Balance type: ${typeof club.coinWallet?.balance}`);
    
    console.log(`\n🔍 Testing canAfford method:`);
    console.log(`🤔 Can afford ${COIN_COSTS.EVENT_CREATION} coins? ${club.canAfford(COIN_COSTS.EVENT_CREATION)}`);
    console.log(`🤔 canAfford(10)? ${club.canAfford(10)}`);
    console.log(`🤔 canAfford(50)? ${club.canAfford(50)}`);
    console.log(`🤔 canAfford(100)? ${club.canAfford(100)}`);
    
    // Check the comparison logic manually
    const balance = club.coinWallet?.balance || 0;
    const required = COIN_COSTS.EVENT_CREATION;
    console.log(`\n🔍 Manual comparison:`);
    console.log(`Balance: ${balance} (${typeof balance})`);
    console.log(`Required: ${required} (${typeof required})`);
    console.log(`Balance >= Required: ${balance >= required}`);
    console.log(`!club.canAfford(${required}): ${!club.canAfford(required)}`);
    
    // Check if there's a data type issue
    console.log(`\n🔍 Data type checks:`);
    console.log(`balance === 50: ${balance === 50}`);
    console.log(`balance == 50: ${balance == 50}`);
    console.log(`balance === '50': ${balance === '50'}`);
    console.log(`Number(balance): ${Number(balance)}`);
    console.log(`parseInt(balance): ${parseInt(balance)}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugBalanceIssue();