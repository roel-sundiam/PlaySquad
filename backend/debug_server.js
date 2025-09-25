// Debug server to test step by step
console.log('1. Starting debug server...');

const express = require('express');
console.log('2. Express loaded');

const cors = require('cors');
console.log('3. CORS loaded');

require('dotenv').config();
console.log('4. Env loaded');

const app = express();
console.log('5. Express app created');

// Test basic middleware
app.use(cors());
app.use(express.json());
console.log('6. Basic middleware added');

// Test database connection
console.log('7. Testing database connection...');
try {
  const connectDB = require('./src/config/database');
  console.log('8. Database module loaded');
  
  connectDB().then(() => {
    console.log('9. Database connected successfully');
    
    // Test routes loading
    console.log('10. Loading routes...');
    const coinRoutes = require('./src/routes/coins');
    console.log('11. Coin routes loaded');
    
    app.use('/api/coins', coinRoutes);
    console.log('12. Coin routes mounted');
    
    app.get('/debug', (req, res) => {
      res.json({ status: 'debug server working' });
    });
    
    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`Debug server running on port ${PORT}`);
    });
    
  }).catch(err => {
    console.error('Database connection failed:', err);
  });
  
} catch (err) {
  console.error('Error during setup:', err);
}