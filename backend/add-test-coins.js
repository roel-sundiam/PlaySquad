const mongoose = require('mongoose');
const Club = require('./src/models/Club');
require('dotenv').config();

async function addTestCoins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find clubs with low balance
    const clubs = await Club.find({ 'coinWallet.balance': { $lt: 50 } });
    
    console.log(`Found ${clubs.length} clubs with low balance`);
    
    for (const club of clubs) {
      if (!club.coinWallet) {
        club.coinWallet = {
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
          lastTransactionAt: new Date()
        };
      }
      
      const coinsToAdd = 100;
      club.coinWallet.balance += coinsToAdd;
      club.coinWallet.totalEarned += coinsToAdd;
      club.coinWallet.lastTransactionAt = new Date();
      
      await club.save();
      console.log(`💰 Added ${coinsToAdd} coins to "${club.name}" (New balance: ${club.coinWallet.balance})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addTestCoins();