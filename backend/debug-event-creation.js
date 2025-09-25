const mongoose = require('mongoose');
const Club = require('./src/models/Club');
const Event = require('./src/models/Event');
const User = require('./src/models/User');
require('dotenv').config();

async function debugEventCreation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find a test club with some coins
    const club = await Club.findOne({ isActive: true });
    if (!club) {
      console.log('❌ No active clubs found');
      return;
    }
    
    console.log(`📊 Found club: ${club.name}`);
    console.log(`💰 Club balance: ${club.coinWallet?.balance || 'undefined'} coins`);
    
    // Test canAfford method
    console.log(`🤔 Can afford 10 coins? ${club.canAfford(10)}`);
    console.log(`🤔 Can afford 5 coins? ${club.canAfford(5)}`);
    
    // Check if coinWallet exists
    if (!club.coinWallet) {
      console.log('⚠️  Club coinWallet not initialized, adding default wallet...');
      club.coinWallet = {
        balance: 100, // Give it some test coins
        totalEarned: 100,
        totalSpent: 0,
        transactions: [],
        lastTransactionAt: new Date()
      };
      await club.save();
      console.log('✅ CoinWallet initialized with 100 coins');
    }
    
    // Test the spendCoins method directly
    console.log('\n🧪 Testing spendCoins method...');
    try {
      await club.spendCoins(10, 'event_creation', 'Test event creation', {
        eventTitle: 'Test Event',
        performedBy: club.owner
      });
      console.log('✅ spendCoins method works correctly');
    } catch (error) {
      console.log('❌ spendCoins method failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugEventCreation();