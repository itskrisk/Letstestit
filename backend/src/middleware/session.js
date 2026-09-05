const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create a new session for the user
const createSession = async (userId, primaryRole, allRoles, ipAddress, userAgent) => {
  // Invalidate all existing sessions for this user (single session policy)
  await prisma.session.deleteMany({
    where: { userId }
  });

  // Create new session
  const session = await prisma.session.create({
    data: {
      userId,
      primaryRole,
      allRoles,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  return session;
};

// Validate session and check for concurrent logins
const validateSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Let authenticate middleware handle this
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_INVALID',
          message: 'Session expired or invalid. Please log in again.'
        }
      });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { lastLoginAt: new Date() }
    });

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    // Don't block the request, let authenticate handle auth errors
    next();
  }
};

// Clean up expired sessions (run periodically)
const cleanupExpiredSessions = async () => {
  try {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
    console.log(`Cleaned up ${result.count} expired sessions`);
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  createSession,
  validateSession,
  cleanupExpiredSessions
};
