const mongoose = require('mongoose');
const Club = require('./src/models/Club');
require('dotenv').config();

async function resetClubBalance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find the specific club
    const clubId = '68d33d11bc3be79d7bebd468';
    const club = await Club.findById(clubId);
    
    if (!club) {
      console.log(`❌ Club ${clubId} not found`);
      return;
    }
    
    console.log(`📊 Club: ${club.name}`);
    console.log(`💰 Current balance: ${club.coinWallet?.balance || 0}`);
    
    // Reset to 50 coins (the original amount before I artificially increased it)
    club.coinWallet.balance = 50;
    club.coinWallet.totalEarned = 50;
    club.coinWallet.totalSpent = 0;
    club.coinWallet.lastTransactionAt = new Date();
    
    await club.save();
    console.log(`💰 Reset balance to 50 coins (should be sufficient for 5 events)`);
    console.log(`📊 Event creation cost: 10 coins each`);
    console.log(`🔢 Can create ${Math.floor(50 / 10)} events with current balance`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

resetClubBalance();