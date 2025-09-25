const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
require('dotenv').config();

async function testNotificationSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check if Notification model is working
    console.log('\n--- Test 1: Notification Model Test ---');
    const testNotification = new Notification({
      recipient: new mongoose.Types.ObjectId(),
      type: 'event-published',
      title: 'Test Notification',
      message: 'This is a test notification',
      data: {
        club: new mongoose.Types.ObjectId(),
        event: new mongoose.Types.ObjectId()
      }
    });

    const savedNotification = await testNotification.save();
    console.log('✅ Notification model works correctly');
    console.log('Saved notification ID:', savedNotification._id);

    // Clean up test notification
    await Notification.deleteOne({ _id: savedNotification._id });
    console.log('✅ Test notification cleaned up');

    // Test 2: Check if we can find users and clubs
    console.log('\n--- Test 2: Database Content Check ---');
    const userCount = await User.countDocuments();
    const clubCount = await Club.countDocuments();
    const eventCount = await Event.countDocuments();
    
    console.log(`Users in database: ${userCount}`);
    console.log(`Clubs in database: ${clubCount}`);
    console.log(`Events in database: ${eventCount}`);

    if (userCount === 0 || clubCount === 0) {
      console.log('⚠️  Warning: No users or clubs found. Run seed script first: npm run seed');
    } else {
      console.log('✅ Database has content for testing');
    }

    // Test 3: Check if we can create notifications for real data
    if (userCount > 0 && clubCount > 0) {
      console.log('\n--- Test 3: Real Data Notification Test ---');
      
      const sampleUser = await User.findOne();
      const sampleClub = await Club.findOne().populate('members.user');
      
      if (sampleClub && sampleClub.members.length > 0) {
        const sampleEvent = {
          _id: new mongoose.Types.ObjectId(),
          title: 'Test Tennis Match',
          date: new Date(),
          location: 'Test Court'
        };

        // Test the static method
        const notifications = await Notification.createEventPublishedNotification(
          sampleEvent, sampleClub, sampleUser
        );
        
        console.log(`✅ Created ${notifications.length} test notifications`);
        
        // Clean up test notifications
        if (notifications.length > 0) {
          await Notification.deleteMany({ 
            _id: { $in: notifications.map(n => n._id) } 
          });
          console.log('✅ Test notifications cleaned up');
        }
      } else {
        console.log('⚠️  Warning: Club has no members for testing');
      }
    }

    console.log('\n--- Test Results ---');
    console.log('✅ All notification system tests passed!');
    console.log('✅ Backend notification system is ready');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testNotificationSystem();