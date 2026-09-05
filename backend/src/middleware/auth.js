const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        customerProfile: true,
        merchantProfile: true,
        riderProfile: true,
        adminProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account has been suspended'
        }
      });
    }

    // Attach user to request
    req.user = user;
    req.roles = user.profile?.roles ? user.profile.roles.split(',') : [];
    req.primaryRole = user.profile?.roles ? user.profile.roles.split(',')[0] : 'CUSTOMER';

    next();
  } catch (error) {
    console.error('Auth error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

// Optional auth - doesn't fail if no token, but attaches user if present
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true
      }
    });

    if (user && user.status !== 'SUSPENDED' && user.status !== 'DELETED') {
      req.user = user;
      req.roles = user.profile?.roles ? user.profile.roles.split(',') : [];
      req.primaryRole = user.profile?.roles ? user.profile.roles.split(',')[0] : 'CUSTOMER';
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
};

// Require courier/rider role
const requireCourier = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required'
      }
    });
  }

  if (!req.roles.includes('RIDER')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Rider access required'
      }
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireCourier
};
