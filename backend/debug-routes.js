require('dotenv').config();

console.log('Testing route imports...');

try {
  console.log('1. Loading database config...');
  const connectDB = require('./src/config/database');

  console.log('2. Loading auth routes...');
  const authRoutes = require('./src/routes/auth');

  console.log('3. Loading club routes...');
  const clubRoutes = require('./src/routes/clubs');

  console.log('4. Loading event routes...');
  const eventRoutes = require('./src/routes/events');

  console.log('5. Loading user routes...');
  const userRoutes = require('./src/routes/users');

  console.log('6. Loading message routes...');
  const messageRoutes = require('./src/routes/messages');

  console.log('7. Loading coin routes...');
  const coinRoutes = require('./src/routes/coins');

  console.log('8. Loading admin routes...');
  const adminRoutes = require('./src/routes/admin');

  console.log('9. Loading analytics routes...');
  const analyticsRoutes = require('./src/routes/analytics');

  console.log('10. Loading notification routes...');
  const notificationRoutes = require('./src/routes/notifications');

  console.log('11. Loading middleware...');
  const { updateLastActive } = require('./src/middleware/analytics');

  console.log('12. Loading socket service...');
  const socketService = require('./src/services/socketService');

  console.log('✅ All imports successful!');

} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
}