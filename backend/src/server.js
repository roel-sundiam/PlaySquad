const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const coinRoutes = require('./routes/coins');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
// const pushSubscriptionRoutes = require('./routes/pushSubscriptions');
const { updateLastActive } = require('./middleware/analytics');
const socketService = require('./services/socketService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL || "https://play-squad.netlify.app",
          "https://tennisclubrt2-v2.netlify.app"  // Tennis Club production URL
        ]
      : ["http://localhost:4200", "http://localhost:4201", "http://localhost:4203"],
    methods: ["GET", "POST"]
  }
});

// Initialize socket service
socketService.init(io);

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 1000, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL || "https://play-squad.netlify.app",
        "https://tennisclubrt2-v2.netlify.app"  // Tennis Club production URL
      ]
    : ["http://localhost:4200", "http://localhost:4201", "http://localhost:4203"],
  credentials: true
}));
app.use(morgan('combined'));
// Only apply rate limiting in production
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
  console.log('Rate limiting enabled for production');
} else {
  console.log('Rate limiting disabled for development');
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and tracking
let recentRequests = [];
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${req.method} ${req.url}`;
  console.log(logEntry);
  
  // Track recent requests for health endpoint
  recentRequests.push({
    timestamp,
    method: req.method,
    url: req.url,
    body: req.method === 'POST' ? Object.keys(req.body || {}) : undefined
  });
  
  // Keep only last 10 requests
  if (recentRequests.length > 10) {
    recentRequests = recentRequests.slice(-10);
  }
  
  if (req.method === 'POST' && req.url === '/api/events') {
    console.log('EVENT CREATION REQUEST RECEIVED');
    console.log('Headers:', req.headers['content-type']);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Body club:', req.body?.club);
  }
  next();
});

app.set('io', io);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PlaySquad API is running',
    timestamp: new Date().toISOString(),
    recentRequests: recentRequests.slice(-5), // Show last 5 requests
    serverVersion: 'v2.0-debug-enabled', // Version indicator
    debugEnabled: true
  });
});

// Direct test route in server.js to bypass routing issues
app.post('/api/test-direct', (req, res) => {
  console.log('=== DIRECT SERVER TEST ROUTE REACHED ===');
  console.log('req.method:', req.method);
  console.log('req.url:', req.url);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('req.body exists:', !!req.body);
  console.log('req.body keys:', Object.keys(req.body || {}));
  console.log('req.body.club:', req.body?.club);
  console.log('req.body full:', JSON.stringify(req.body, null, 2));
  
  res.json({
    success: true,
    message: 'Direct server route reached',
    receivedClubId: req.body?.club || 'MISSING',
    bodyKeys: Object.keys(req.body || {}),
    fullBody: req.body,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clubs', updateLastActive, clubRoutes);
app.use('/api/events', updateLastActive, eventRoutes);
app.use('/api/users', updateLastActive, userRoutes);
app.use('/api/messages', updateLastActive, messageRoutes);
app.use('/api/coins', updateLastActive, coinRoutes);
app.use('/api/admin', updateLastActive, adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', updateLastActive, notificationRoutes);
// app.use('/api/push-subscriptions', updateLastActive, pushSubscriptionRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-club', (clubId) => {
    socket.join(`club-${clubId}`);
    console.log(`User ${socket.id} joined club ${clubId}`);

    socket.to(`club-${clubId}`).emit('user-joined-chat', {
      socketId: socket.id,
      clubId,
      timestamp: new Date()
    });
  });

  socket.on('leave-club', (clubId) => {
    socket.leave(`club-${clubId}`);
    console.log(`User ${socket.id} left club ${clubId}`);

    socket.to(`club-${clubId}`).emit('user-left-chat', {
      socketId: socket.id,
      clubId,
      timestamp: new Date()
    });
  });

  socket.on('typing-start', (data) => {
    socket.to(`club-${data.clubId}`).emit('user-typing', {
      socketId: socket.id,
      clubId: data.clubId,
      isTyping: true,
      timestamp: new Date()
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`club-${data.clubId}`).emit('user-typing', {
      socketId: socket.id,
      clubId: data.clubId,
      isTyping: false,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔧 DEBUG: Server restarted with latest changes at ${new Date().toISOString()}`);
});