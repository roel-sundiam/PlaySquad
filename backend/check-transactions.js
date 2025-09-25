const mongoose = require('mongoose');
const Club = require('./src/models/Club');
const CoinTransaction = require('./src/models/CoinTransaction');
require('dotenv').config();

async function checkTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Check both RT2 clubs
    const clubs = await Club.find({ 
      $or: [
        { name: /RT2.*Tennis/i },
        { name: /Rich Town.*Tennis/i }
      ]
    });
    
    for (const club of clubs) {
      console.log(`\n📊 Club: ${club.name} (${club._id})`);
      console.log(`💰 Current balance: ${club.coinWallet?.balance}`);
      
      // Find recent transactions for this club
      const transactions = await CoinTransaction.find({ club: club._id })
        .sort({ createdAt: -1 })
        .limit(10);
      
      console.log(`📝 Recent transactions (${transactions.length}):`);
      transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.createdAt.toISOString()}: ${tx.amount > 0 ? '+' : ''}${tx.amount} coins - ${tx.description}`);
      });
      
      // Check coinWallet transactions array if it exists
      if (club.coinWallet && club.coinWallet.transactions) {
        console.log(`📝 CoinWallet transactions (${club.coinWallet.transactions.length}):`);
        club.coinWallet.transactions.slice(-5).forEach((tx, i) => {
          console.log(`  ${i + 1}. ${tx.createdAt || 'no date'}: ${tx.amount > 0 ? '+' : ''}${tx.amount} coins - ${tx.description || 'no desc'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkTransactions();