require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting minimal server test...');

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}/test`);
});