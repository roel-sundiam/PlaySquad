require('dotenv').config();
console.log('1. Environment loaded');

const express = require('express');
console.log('2. Express loaded');

const cors = require('cors');
console.log('3. CORS loaded');

const helmet = require('helmet');
console.log('4. Helmet loaded');

const morgan = require('morgan');
console.log('5. Morgan loaded');

const rateLimit = require('express-rate-limit');
console.log('6. Rate limit loaded');

const { createServer } = require('http');
console.log('7. HTTP server loaded');

const { Server } = require('socket.io');
console.log('8. Socket.IO loaded');

const connectDB = require('./src/config/database');
console.log('9. Database config loaded');

console.log('10. Starting database connection...');
connectDB().then(() => {
  console.log('11. Database connected successfully');
  startServer();
}).catch(err => {
  console.error('11. Database connection failed:', err);
  process.exit(1);
});

function startServer() {
  console.log('12. Initializing Express app...');
  const app = express();

  console.log('13. Creating HTTP server...');
  const server = createServer(app);

  console.log('14. Setting up Socket.IO...');
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:4200", "http://localhost:4203"],
      methods: ["GET", "POST"]
    }
  });

  console.log('15. Setting up middleware...');
  app.use(helmet());
  app.use(cors({
    origin: ["http://localhost:4200", "http://localhost:4203"],
    credentials: true
  }));

  console.log('16. Setting up routes...');
  app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is healthy!' });
  });

  console.log('17. Starting server...');
  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`🚀 Debug server running on port ${PORT}`);
  });
}