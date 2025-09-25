const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Club = require('../models/Club');
const CoinTransaction = require('../models/CoinTransaction');
const CoinPurchaseRequest = require('../models/CoinPurchaseRequest');

async function clearAllCoinData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('🧹 Starting coin data cleanup...\n');

    // 1. Delete all coin transactions
    console.log('1. Deleting all coin transactions...');
    const transactionResult = await CoinTransaction.deleteMany({});
    console.log(`   ✅ Deleted ${transactionResult.deletedCount} coin transactions`);

    // 2. Delete all coin purchase requests
    console.log('2. Deleting all coin purchase requests...');
    const purchaseRequestResult = await CoinPurchaseRequest.deleteMany({});
    console.log(`   ✅ Deleted ${purchaseRequestResult.deletedCount} coin purchase requests`);

    // 3. Reset all user coin wallets
    console.log('3. Resetting all user coin wallets...');
    const userUpdateResult = await User.updateMany(
      {},
      {
        $set: {
          'coinWallet.balance': 0,
          'coinWallet.totalEarned': 0,
          'coinWallet.totalSpent': 0,
          'coinWallet.lastTransactionAt': null
        }
      }
    );
    console.log(`   ✅ Reset coin wallets for ${userUpdateResult.modifiedCount} users`);

    // 4. Reset all club coin wallets
    console.log('4. Resetting all club coin wallets...');
    const clubUpdateResult = await Club.updateMany(
      {},
      {
        $set: {
          'coinWallet.balance': 0,
          'coinWallet.totalEarned': 0,
          'coinWallet.totalSpent': 0,
          'coinWallet.lastTransactionAt': null
        }
      }
    );
    console.log(`   ✅ Reset coin wallets for ${clubUpdateResult.modifiedCount} clubs`);

    // 5. Show summary
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log('┌─────────────────────────────────────┬───────────┐');
    console.log('│ Item                                │ Count     │');
    console.log('├─────────────────────────────────────┼───────────┤');
    console.log(`│ Coin Transactions Deleted           │ ${transactionResult.deletedCount.toString().padStart(9)} │`);
    console.log(`│ Purchase Requests Deleted           │ ${purchaseRequestResult.deletedCount.toString().padStart(9)} │`);
    console.log(`│ User Wallets Reset                  │ ${userUpdateResult.modifiedCount.toString().padStart(9)} │`);
    console.log(`│ Club Wallets Reset                  │ ${clubUpdateResult.modifiedCount.toString().padStart(9)} │`);
    console.log('└─────────────────────────────────────┴───────────┘');

    console.log('\n✅ All coin data has been cleared successfully!');
    console.log('💰 All balances reset to 0');
    console.log('🗑️  All transactions and purchase requests deleted');
    console.log('\nUsers can now start fresh with coin purchases requiring admin approval.');

  } catch (error) {
    console.error('❌ Error clearing coin data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Also create a function to verify the cleanup
async function verifyClearance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const transactionCount = await CoinTransaction.countDocuments();
    const purchaseRequestCount = await CoinPurchaseRequest.countDocuments();
    
    const usersWithCoins = await User.countDocuments({
      'coinWallet.balance': { $gt: 0 }
    });
    
    const clubsWithCoins = await Club.countDocuments({
      'coinWallet.balance': { $gt: 0 }
    });
    
    console.log('\n🔍 VERIFICATION RESULTS:');
    console.log(`• Coin Transactions: ${transactionCount}`);
    console.log(`• Purchase Requests: ${purchaseRequestCount}`);
    console.log(`• Users with coin balance > 0: ${usersWithCoins}`);
    console.log(`• Clubs with coin balance > 0: ${clubsWithCoins}`);
    
    if (transactionCount === 0 && purchaseRequestCount === 0 && usersWithCoins === 0 && clubsWithCoins === 0) {
      console.log('✅ Cleanup verified successfully - all coin data cleared!');
    } else {
      console.log('⚠️  Some data may not have been cleared completely');
    }
    
  } catch (error) {
    console.error('❌ Error verifying cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    await verifyClearance();
  } else {
    await clearAllCoinData();
    
    // Auto-verify after cleanup
    console.log('\n🔍 Verifying cleanup...');
    await verifyClearance();
  }
}

if (require.main === module) {
  main();
}

module.exports = { clearAllCoinData, verifyClearance };