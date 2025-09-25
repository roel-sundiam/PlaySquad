const mongoose = require('mongoose');
require('dotenv').config();

// Import analytics models
const PageView = require('../models/PageView');
const VisitorSession = require('../models/VisitorSession');
const VisitorAnalytics = require('../models/VisitorAnalytics');

async function clearAllAnalytics() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Starting analytics data cleanup...');

    // Get counts before deletion
    const pageViewCount = await PageView.countDocuments();
    const visitorSessionCount = await VisitorSession.countDocuments();
    const visitorAnalyticsCount = await VisitorAnalytics.countDocuments();

    console.log(`\n📈 Current Analytics Data:`);
    console.log(`   • Page Views: ${pageViewCount}`);
    console.log(`   • Visitor Sessions: ${visitorSessionCount}`);
    console.log(`   • Visitor Analytics: ${visitorAnalyticsCount}`);

    if (pageViewCount === 0 && visitorSessionCount === 0 && visitorAnalyticsCount === 0) {
      console.log('\n✨ No analytics data found to delete.');
      return;
    }

    console.log('\n🗑️  Deleting analytics data...');

    // Delete all analytics data
    const [pageViewResult, sessionResult, analyticsResult] = await Promise.all([
      PageView.deleteMany({}),
      VisitorSession.deleteMany({}),
      VisitorAnalytics.deleteMany({})
    ]);

    console.log('\n✅ Analytics data cleared successfully!');
    console.log(`   • Page Views deleted: ${pageViewResult.deletedCount}`);
    console.log(`   • Visitor Sessions deleted: ${sessionResult.deletedCount}`);
    console.log(`   • Visitor Analytics deleted: ${analyticsResult.deletedCount}`);

    // Verify deletion
    const remainingPageViews = await PageView.countDocuments();
    const remainingSessions = await VisitorSession.countDocuments();
    const remainingAnalytics = await VisitorAnalytics.countDocuments();

    console.log('\n🔍 Verification:');
    console.log(`   • Remaining Page Views: ${remainingPageViews}`);
    console.log(`   • Remaining Visitor Sessions: ${remainingSessions}`);
    console.log(`   • Remaining Visitor Analytics: ${remainingAnalytics}`);

    if (remainingPageViews === 0 && remainingSessions === 0 && remainingAnalytics === 0) {
      console.log('\n🎉 All analytics data successfully cleared!');
    } else {
      console.log('\n⚠️  Some data may still remain in the database.');
    }

  } catch (error) {
    console.error('❌ Error clearing analytics data:', error.message);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔒 Database connection closed');
    } catch (closeError) {
      console.error('Error closing database connection:', closeError.message);
    }
  }
}

// Check if running directly
if (require.main === module) {
  console.log('🧹 PlaySquad Analytics Data Cleanup');
  console.log('=====================================');
  console.log('This script will delete ALL analytics data including:');
  console.log('• Page Views');  
  console.log('• Visitor Sessions');
  console.log('• Visitor Analytics');
  console.log('=====================================\n');

  // Run the cleanup
  clearAllAnalytics().then(() => {
    console.log('\n✨ Cleanup completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  });
}

module.exports = clearAllAnalytics;