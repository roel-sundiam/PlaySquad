const express = require('express');
const cors = require('cors');
const analyticsRoutes = require('./src/routes/analytics');

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server working' });
});

// Mock protect middleware for testing
app.use('/api/analytics', (req, res, next) => {
  // Mock user for admin routes
  req.user = { email: 'admin@test.com', id: 'test-user-id' };
  next();
}, analyticsRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});