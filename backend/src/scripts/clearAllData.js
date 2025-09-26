const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Message = require('../models/Message');
const CoinTransaction = require('../models/CoinTransaction');
const CoinPurchaseRequest = require('../models/CoinPurchaseRequest');
const PageView = require('../models/PageView');
const VisitorSession = require('../models/VisitorSession');
const VisitorAnalytics = require('../models/VisitorAnalytics');
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');

async function clearAllData() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🧹 PlaySquad Complete Database Cleanup');
    console.log('=======================================');
    console.log('This will delete ALL data from the following collections:');
    console.log('• Clubs & Events');
    console.log('• Messages');
    console.log('• Site Analytics (PageViews, Sessions, Visitor Analytics)');
    console.log('• Coin Purchases & Transactions');
    console.log('• Notifications & Push Subscriptions');
    console.log('• Reset all user club memberships and coin wallets');
    console.log('⚠️  NOTE: User accounts will be preserved');
    console.log('=======================================\n');

    // Phase 1: Get current data counts
    console.log('📊 Gathering current data statistics...');
    const [
      clubCount,
      eventCount,
      messageCount,
      coinTransactionCount,
      coinPurchaseCount,
      pageViewCount,
      sessionCount,
      analyticsCount,
      notificationCount,
      pushSubscriptionCount,
      userCount
    ] = await Promise.all([
      Club.countDocuments(),
      Event.countDocuments(),
      Message.countDocuments(),
      CoinTransaction.countDocuments(),
      CoinPurchaseRequest.countDocuments(),
      PageView.countDocuments(),
      VisitorSession.countDocuments(),
      VisitorAnalytics.countDocuments(),
      Notification.countDocuments(),
      PushSubscription.countDocuments(),
      User.countDocuments()
    ]);

    console.log('\n📈 Current Data Summary:');
    console.log('┌─────────────────────────────────────┬───────────┐');
    console.log('│ Collection                          │ Count     │');
    console.log('├─────────────────────────────────────┼───────────┤');
    console.log(`│ Users                               │ ${userCount.toString().padStart(9)} │`);
    console.log(`│ Clubs                               │ ${clubCount.toString().padStart(9)} │`);
    console.log(`│ Events                              │ ${eventCount.toString().padStart(9)} │`);
    console.log(`│ Messages                            │ ${messageCount.toString().padStart(9)} │`);
    console.log(`│ Coin Transactions                   │ ${coinTransactionCount.toString().padStart(9)} │`);
    console.log(`│ Coin Purchase Requests              │ ${coinPurchaseCount.toString().padStart(9)} │`);
    console.log(`│ Page Views                          │ ${pageViewCount.toString().padStart(9)} │`);
    console.log(`│ Visitor Sessions                    │ ${sessionCount.toString().padStart(9)} │`);
    console.log(`│ Visitor Analytics                   │ ${analyticsCount.toString().padStart(9)} │`);
    console.log(`│ Notifications                       │ ${notificationCount.toString().padStart(9)} │`);
    console.log(`│ Push Subscriptions                  │ ${pushSubscriptionCount.toString().padStart(9)} │`);
    console.log('└─────────────────────────────────────┴───────────┘\n');

    const totalRecords = clubCount + eventCount + messageCount + coinTransactionCount +
                        coinPurchaseCount + pageViewCount + sessionCount + analyticsCount +
                        notificationCount + pushSubscriptionCount;

    if (totalRecords === 0) {
      console.log('✨ No data found to delete - database is already clean!');
      return;
    }

    console.log(`🗑️  Preparing to delete ${totalRecords} records across ${10} collections...\n`);

    // Phase 2: Delete all data in parallel
    console.log('🚀 Starting parallel data deletion...');

    const deletionStart = Date.now();

    const [
      clubResult,
      eventResult,
      messageResult,
      coinTransactionResult,
      coinPurchaseResult,
      pageViewResult,
      sessionResult,
      analyticsResult,
      notificationResult,
      pushSubscriptionResult
    ] = await Promise.all([
      Club.deleteMany({}),
      Event.deleteMany({}),
      Message.deleteMany({}),
      CoinTransaction.deleteMany({}),
      CoinPurchaseRequest.deleteMany({}),
      PageView.deleteMany({}),
      VisitorSession.deleteMany({}),
      VisitorAnalytics.deleteMany({}),
      Notification.deleteMany({}),
      PushSubscription.deleteMany({})
    ]);

    const deletionTime = Date.now() - deletionStart;
    console.log(`⚡ Data deletion completed in ${deletionTime}ms\n`);

    // Phase 3: Clean up user relationships
    console.log('🔧 Cleaning up user relationships...');
    const userCleanupResult = await User.updateMany(
      {},
      {
        $set: {
          clubs: [],
          'coinWallet.balance': 0,
          'coinWallet.totalEarned': 0,
          'coinWallet.totalSpent': 0,
          'coinWallet.lastTransactionAt': null
        }
      }
    );
    console.log(`✅ Updated ${userCleanupResult.modifiedCount} user records\n`);

    // Phase 4: Verification
    console.log('🔍 Verifying data deletion...');
    const [
      remainingClubs,
      remainingEvents,
      remainingMessages,
      remainingCoinTransactions,
      remainingCoinPurchases,
      remainingPageViews,
      remainingSessions,
      remainingAnalytics,
      remainingNotifications,
      remainingPushSubscriptions,
      usersWithClubs,
      usersWithCoins
    ] = await Promise.all([
      Club.countDocuments(),
      Event.countDocuments(),
      Message.countDocuments(),
      CoinTransaction.countDocuments(),
      CoinPurchaseRequest.countDocuments(),
      PageView.countDocuments(),
      VisitorSession.countDocuments(),
      VisitorAnalytics.countDocuments(),
      Notification.countDocuments(),
      PushSubscription.countDocuments(),
      User.countDocuments({ 'clubs.0': { $exists: true } }),
      User.countDocuments({ 'coinWallet.balance': { $gt: 0 } })
    ]);

    // Phase 5: Results Summary
    console.log('📋 DELETION SUMMARY:');
    console.log('┌─────────────────────────────────────┬───────────┬───────────┐');
    console.log('│ Collection                          │ Deleted   │ Remaining │');
    console.log('├─────────────────────────────────────┼───────────┼───────────┤');
    console.log(`│ Clubs                               │ ${clubResult.deletedCount.toString().padStart(9)} │ ${remainingClubs.toString().padStart(9)} │`);
    console.log(`│ Events                              │ ${eventResult.deletedCount.toString().padStart(9)} │ ${remainingEvents.toString().padStart(9)} │`);
    console.log(`│ Messages                            │ ${messageResult.deletedCount.toString().padStart(9)} │ ${remainingMessages.toString().padStart(9)} │`);
    console.log(`│ Coin Transactions                   │ ${coinTransactionResult.deletedCount.toString().padStart(9)} │ ${remainingCoinTransactions.toString().padStart(9)} │`);
    console.log(`│ Coin Purchase Requests              │ ${coinPurchaseResult.deletedCount.toString().padStart(9)} │ ${remainingCoinPurchases.toString().padStart(9)} │`);
    console.log(`│ Page Views                          │ ${pageViewResult.deletedCount.toString().padStart(9)} │ ${remainingPageViews.toString().padStart(9)} │`);
    console.log(`│ Visitor Sessions                    │ ${sessionResult.deletedCount.toString().padStart(9)} │ ${remainingSessions.toString().padStart(9)} │`);
    console.log(`│ Visitor Analytics                   │ ${analyticsResult.deletedCount.toString().padStart(9)} │ ${remainingAnalytics.toString().padStart(9)} │`);
    console.log(`│ Notifications                       │ ${notificationResult.deletedCount.toString().padStart(9)} │ ${remainingNotifications.toString().padStart(9)} │`);
    console.log(`│ Push Subscriptions                  │ ${pushSubscriptionResult.deletedCount.toString().padStart(9)} │ ${remainingPushSubscriptions.toString().padStart(9)} │`);
    console.log('└─────────────────────────────────────┴───────────┴───────────┘');

    console.log('\n🧽 USER CLEANUP RESULTS:');
    console.log('┌─────────────────────────────────────┬───────────┐');
    console.log('│ User Cleanup                        │ Count     │');
    console.log('├─────────────────────────────────────┼───────────┤');
    console.log(`│ Users with clubs cleared            │ ${userCleanupResult.modifiedCount.toString().padStart(9)} │`);
    console.log(`│ Users still with clubs              │ ${usersWithClubs.toString().padStart(9)} │`);
    console.log(`│ Users still with coins              │ ${usersWithCoins.toString().padStart(9)} │`);
    console.log('└─────────────────────────────────────┴───────────┘');

    // Final verification
    const totalRemaining = remainingClubs + remainingEvents + remainingMessages +
                          remainingCoinTransactions + remainingCoinPurchases +
                          remainingPageViews + remainingSessions + remainingAnalytics +
                          remainingNotifications + remainingPushSubscriptions;

    const totalDeleted = clubResult.deletedCount + eventResult.deletedCount +
                        messageResult.deletedCount + coinTransactionResult.deletedCount +
                        coinPurchaseResult.deletedCount + pageViewResult.deletedCount +
                        sessionResult.deletedCount + analyticsResult.deletedCount +
                        notificationResult.deletedCount + pushSubscriptionResult.deletedCount;

    console.log('\n🎯 FINAL RESULTS:');
    console.log(`   📊 Total records deleted: ${totalDeleted}`);
    console.log(`   🗃️  Total records remaining: ${totalRemaining}`);
    console.log(`   ⚡ Cleanup completed in: ${deletionTime}ms`);

    if (totalRemaining === 0 && usersWithClubs === 0 && usersWithCoins === 0) {
      console.log('\n🎉 SUCCESS: All requested data has been completely cleared!');
      console.log('💾 Database is now ready for fresh testing data');
      console.log('🌱 You can run seeding scripts to populate with test data');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain in the database');
      console.log('   Please review the results above for details');
    }

  } catch (error) {
    console.error('\n❌ Error during database cleanup:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔒 Database connection closed');
    } catch (closeError) {
      console.error('❌ Error closing database connection:', closeError.message);
    }
  }
}

// Verification function to check current state
async function verifyDatabaseState() {
  try {
    console.log('🔍 PlaySquad Database State Verification');
    console.log('========================================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const [
      clubCount,
      eventCount,
      messageCount,
      coinTransactionCount,
      coinPurchaseCount,
      pageViewCount,
      sessionCount,
      analyticsCount,
      notificationCount,
      pushSubscriptionCount,
      userCount,
      usersWithClubs,
      usersWithCoins
    ] = await Promise.all([
      Club.countDocuments(),
      Event.countDocuments(),
      Message.countDocuments(),
      CoinTransaction.countDocuments(),
      CoinPurchaseRequest.countDocuments(),
      PageView.countDocuments(),
      VisitorSession.countDocuments(),
      VisitorAnalytics.countDocuments(),
      Notification.countDocuments(),
      PushSubscription.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ 'clubs.0': { $exists: true } }),
      User.countDocuments({ 'coinWallet.balance': { $gt: 0 } })
    ]);

    console.log('📊 Current Database State:');
    console.log('┌─────────────────────────────────────┬───────────┐');
    console.log('│ Collection                          │ Count     │');
    console.log('├─────────────────────────────────────┼───────────┤');
    console.log(`│ Users                               │ ${userCount.toString().padStart(9)} │`);
    console.log(`│ Clubs                               │ ${clubCount.toString().padStart(9)} │`);
    console.log(`│ Events                              │ ${eventCount.toString().padStart(9)} │`);
    console.log(`│ Messages                            │ ${messageCount.toString().padStart(9)} │`);
    console.log(`│ Coin Transactions                   │ ${coinTransactionCount.toString().padStart(9)} │`);
    console.log(`│ Coin Purchase Requests              │ ${coinPurchaseCount.toString().padStart(9)} │`);
    console.log(`│ Page Views                          │ ${pageViewCount.toString().padStart(9)} │`);
    console.log(`│ Visitor Sessions                    │ ${sessionCount.toString().padStart(9)} │`);
    console.log(`│ Visitor Analytics                   │ ${analyticsCount.toString().padStart(9)} │`);
    console.log(`│ Notifications                       │ ${notificationCount.toString().padStart(9)} │`);
    console.log(`│ Push Subscriptions                  │ ${pushSubscriptionCount.toString().padStart(9)} │`);
    console.log('├─────────────────────────────────────┼───────────┤');
    console.log(`│ Users with club memberships         │ ${usersWithClubs.toString().padStart(9)} │`);
    console.log(`│ Users with coin balances            │ ${usersWithCoins.toString().padStart(9)} │`);
    console.log('└─────────────────────────────────────┴───────────┘');

    const totalRecords = clubCount + eventCount + messageCount + coinTransactionCount +
                        coinPurchaseCount + pageViewCount + sessionCount + analyticsCount +
                        notificationCount + pushSubscriptionCount;

    console.log(`\n📈 Summary: ${totalRecords} total records across business collections`);
    console.log(`👥 User data: ${userCount} users (${usersWithClubs} with clubs, ${usersWithCoins} with coins)`);

    if (totalRecords === 0 && usersWithClubs === 0 && usersWithCoins === 0) {
      console.log('\n✨ Database is completely clean - ready for seeding!');
    } else {
      console.log('\n📋 Database contains data - use clearAllData() to clean');
    }

  } catch (error) {
    console.error('❌ Error verifying database state:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--verify') || args.includes('-v')) {
    await verifyDatabaseState();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🧹 PlaySquad Complete Database Cleanup Script');
    console.log('=============================================\n');
    console.log('Usage:');
    console.log('  node clearAllData.js           # Clear all data');
    console.log('  node clearAllData.js --verify  # Check current state');
    console.log('  node clearAllData.js --help    # Show this help\n');
    console.log('This script will delete ALL data from:');
    console.log('• Clubs, Events, Messages');
    console.log('• Site Analytics (PageViews, Sessions, Analytics)');
    console.log('• Coin system (Transactions, Purchase Requests)');
    console.log('• Notifications & Push Subscriptions');
    console.log('• Clear user club memberships and coin wallets');
    console.log('• User accounts will be preserved\n');
    console.log('⚠️  WARNING: This action cannot be undone!');
  } else {
    await clearAllData();

    // Auto-verify after cleanup
    console.log('\n🔍 Running verification check...');
    await verifyDatabaseState();
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('\n✨ Script execution completed!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Script execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = { clearAllData, verifyDatabaseState };