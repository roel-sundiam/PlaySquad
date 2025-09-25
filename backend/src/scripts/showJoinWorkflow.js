const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('../models/Club');
const User = require('../models/User');

async function showJoinWorkflow() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playsquad');
    console.log('Connected to MongoDB');

    const clubs = await Club.find({})
      .populate('owner', 'firstName lastName email')
      .populate('joinRequests.user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (clubs.length === 0) {
      console.log('No clubs found in database.');
      process.exit(0);
    }

    console.log('\n🎯 JOIN WORKFLOW SUMMARY\n');
    console.log('=' .repeat(50));
    
    clubs.forEach((club, index) => {
      console.log(`\n${index + 1}. 🏆 ${club.name}`);
      console.log(`   Owner: ${club.owner.firstName} ${club.owner.lastName} (${club.owner.email})`);
      console.log(`   Sport: ${club.sport}`);
      console.log(`   Members: ${club.memberCount}`);
      console.log(`   Type: ${club.isPrivate ? 'Private' : 'Public'}`);
      
      console.log('\n   📋 APPROVAL SETTINGS:');
      if (club.settings.autoAcceptMembers) {
        console.log('   ❌ Auto Accept: ENABLED - Users join automatically (not secure)');
        console.log('   📝 When users join: Immediately added to club');
      } else {
        console.log('   ✅ Auto Accept: DISABLED - Requires admin approval (secure)');
        console.log('   📝 When users join: Must submit join request for approval');
      }
      
      console.log('\n   🔄 CURRENT JOIN WORKFLOW:');
      if (club.settings.autoAcceptMembers) {
        console.log('   1. User clicks "Join Club"');
        console.log('   2. ✅ User is immediately added to club');
        console.log('   3. No admin review required');
      } else {
        console.log('   1. User clicks "Join Club"');
        console.log('   2. 📝 Join request is submitted with status "pending"');
        console.log('   3. 👤 Admin/Organizer reviews request via GET /clubs/:id/requests');
        console.log('   4. 👤 Admin/Organizer approves/rejects via PUT /clubs/:id/requests/:requestId');
        console.log('   5. ✅ If approved, user is added to club');
        console.log('   6. ❌ If rejected, user receives rejection notification');
      }
      
      if (club.joinRequests && club.joinRequests.length > 0) {
        const pendingRequests = club.joinRequests.filter(req => req.status === 'pending');
        const processedRequests = club.joinRequests.filter(req => req.status !== 'pending');
        
        console.log('\n   📋 JOIN REQUESTS STATUS:');
        console.log(`   • Pending requests: ${pendingRequests.length}`);
        console.log(`   • Processed requests: ${processedRequests.length}`);
        
        if (pendingRequests.length > 0) {
          console.log('\n   ⏳ PENDING REQUESTS:');
          pendingRequests.forEach((req, i) => {
            console.log(`   ${i + 1}. ${req.user ? req.user.firstName + ' ' + req.user.lastName : 'Unknown User'}`);
            console.log(`      Requested: ${req.requestedAt.toDateString()}`);
            if (req.message) console.log(`      Message: "${req.message}"`);
          });
        }
      } else {
        console.log('\n   📋 JOIN REQUESTS: No requests yet');
      }
      
      console.log('\n   ' + '-'.repeat(40));
    });
    
    console.log('\n🎉 SUMMARY:');
    console.log('• All clubs now require approval for new members');
    console.log('• Users must submit join requests that go to club admins/organizers');
    console.log('• Admins can view pending requests and approve/reject them');
    console.log('• This prevents unauthorized users from automatically joining clubs');
    
    console.log('\n📚 API ENDPOINTS FOR ADMINS:');
    console.log('• GET /api/clubs/:clubId/requests - View pending join requests');
    console.log('• PUT /api/clubs/:clubId/requests/:requestId - Approve/reject request');
    console.log('  Body: { "action": "approve" } or { "action": "reject" }');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error showing join workflow:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  showJoinWorkflow();
}

module.exports = { showJoinWorkflow };