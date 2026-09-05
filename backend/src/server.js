const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const { errorHandler, notFound } = require('./middleware/error');
const { authenticate, optionalAuth } = require('./middleware/auth');
const { requireRole } = require('./middleware/roles');
const { merchantApproved, riderApproved } = require('./middleware/approval');
const { validateSession } = require('./middleware/session');
const requireMerchantApproval = merchantApproved;
const requireRiderApproval = riderApproved;

// Route imports
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const merchantRoutes = require('./routes/merchant');
const courierRoutes = require('./routes/courier');
const riderRoutes = require('./routes/rider');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use('/api/', limiter);

// Strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('src/uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Muncheez API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
app.use('/api/public', publicRoutes);

// ============================================
// AUTH ROUTES (With strict rate limiting)
// ============================================
app.use('/api/auth', authLimiter, authRoutes);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Customer routes
app.use('/api/customer', authenticate, validateSession, customerRoutes);

// Merchant routes (require auth + merchant role + approval)
app.use('/api/merchant', authenticate, validateSession, requireRole('MERCHANT'), requireMerchantApproval, merchantRoutes);

// Courier routes (require auth + courier role + approval)
app.use('/api/courier', authenticate, validateSession, requireRole('RIDER'), requireRiderApproval, courierRoutes);

// Rider routes (require auth + rider role + approval)
app.use('/api/rider', authenticate, validateSession, requireRole('RIDER'), requireRiderApproval, riderRoutes);

// Admin routes (require auth + admin role)
app.use('/api/admin', authenticate, validateSession, requireRole('ADMIN'), adminRoutes);

// Payment routes (require auth)
app.use('/api/payments', authenticate, validateSession, paymentRoutes);

// Upload routes (require auth)
app.use('/api/upload', authenticate, validateSession, uploadRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  // Join order room for updates
  socket.on('join-order', (orderId) => {
    socket.join(`order:${orderId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Muncheez API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = { app, server, io };
