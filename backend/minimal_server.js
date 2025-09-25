// Minimal server without database to test routes
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ["http://localhost:4200", "http://localhost:4203"],
  credentials: true
}));
app.use(express.json());

// Mock protect middleware for testing
const mockProtect = (req, res, next) => {
  // Mock user for testing
  req.user = { id: '507f1f77bcf86cd799439011', email: 'sundiamr@aol.com' };
  next();
};

// Mock coin routes for testing
app.get('/api/coins/packages', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'starter', name: 'Starter', coins: 50, bonusCoins: 0, totalCoins: 50, price: 249, pricePerCoin: '4.980' }
    ]
  });
});

app.get('/api/coins/wallet', mockProtect, (req, res) => {
  res.json({
    success: true,
    data: {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastTransactionAt: null,
      recentTransactions: []
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal server running' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});