const mongoose = require('mongoose');
const Club = require('./src/models/Club');
require('dotenv').config();

async function addCoinsToSpecificClub() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find the specific club that's being used
    const clubId = '68d33d11bc3be79d7bebd468';
    const club = await Club.findById(clubId);
    
    if (!club) {
      console.log(`❌ Club ${clubId} not found`);
      return;
    }
    
    console.log(`📊 Club: ${club.name}`);
    console.log(`💰 Current balance: ${club.coinWallet?.balance || 0}`);
    
    if (!club.coinWallet) {
      club.coinWallet = {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        transactions: [],
        lastTransactionAt: null
      };
    }
    
    // Add enough coins for several event creations
    const coinsToAdd = 100;
    club.coinWallet.balance += coinsToAdd;
    club.coinWallet.totalEarned += coinsToAdd;
    club.coinWallet.lastTransactionAt = new Date();
    
    await club.save();
    console.log(`💰 Added ${coinsToAdd} coins (New balance: ${club.coinWallet.balance})`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addCoinsToSpecificClub();