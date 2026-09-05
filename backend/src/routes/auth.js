const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { createSession } = require('../middleware/session');

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

// Register customer
router.post('/register/customer', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, and full name are required'
        }
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with customer profile
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        emailVerified: false,
        status: 'ACTIVE',
        profile: {
          create: {
            roles: 'CUSTOMER',
            status: 'ACTIVE'
          }
        },
        customerProfile: {
          create: {
            loyaltyTier: 'Standard',
            totalOrders: 0,
            totalSpent: 0
          }
        }
      },
      include: {
        profile: true,
        customerProfile: true
      }
    });

    // Generate token
    const token = generateToken(user);

    // Create session (invalidates any existing sessions)
    await createSession(
      user.id,
      'CUSTOMER',
      'CUSTOMER',
      req.ip,
      req.get('user-agent')
    );

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        roles: ['CUSTOMER']
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register user'
      }
    });
  }
});

// Register merchant
router.post('/register/merchant', async (req, res) => {
  try {
    const { email, password, fullName, phone, businessName, type, address, mpesaTill, documents } = req.body;

    // Validation
    if (!email || !password || !fullName || !businessName || !type || !address) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'All required fields must be provided'
        }
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with merchant profile and application
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        emailVerified: false,
        status: 'ACTIVE',
        profile: {
          create: {
            roles: 'CUSTOMER,MERCHANT',
            status: 'ACTIVE'
          }
        },
        merchantProfile: {
          create: {
            businessName,
            type,
            address,
            mpesaTill,
            status: 'PENDING',
            isActive: false,
            documents: documents || '{}'
          }
        }
      },
      include: {
        profile: true,
        merchantProfile: true
      }
    });

    // Create merchant application linked to merchant profile
    if (user.merchantProfile) {
      await prisma.merchantApplication.create({
        data: {
          merchantId: user.merchantProfile.id,
          businessName,
          type,
          address,
          mpesaTill,
          documents: documents || '{}',
          status: 'PENDING'
        }
      });
    }

    // Generate token
    const token = generateToken(user);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: token,
        primaryRole: 'MERCHANT',
        allRoles: 'CUSTOMER,MERCHANT',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        roles: ['CUSTOMER', 'MERCHANT'],
        merchantStatus: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Merchant registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register merchant'
      }
    });
  }
});

// Register rider
router.post('/register/rider', async (req, res) => {
  try {
    const { email, password, fullName, phone, vehicleType, vehicleMake, vehicleModel, vehiclePlate, documents } = req.body;

    // Validation
    if (!email || !password || !fullName || !vehicleType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'All required fields must be provided'
        }
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with rider profile and application
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        emailVerified: false,
        status: 'ACTIVE',
        profile: {
          create: {
            roles: 'CUSTOMER,RIDER',
            status: 'ACTIVE'
          }
        },
        riderProfile: {
          create: {
            vehicleType,
            vehicleMake,
            vehicleModel,
            vehiclePlate,
            status: 'PENDING',
            isOnline: false,
            documents: documents || '{}'
          }
        }
      },
      include: {
        profile: true,
        riderProfile: true
      }
    });

    // Create rider application linked to rider profile
    if (user.riderProfile) {
      await prisma.riderApplication.create({
        data: {
          riderId: user.riderProfile.id,
          vehicleType,
          vehicleMake,
          vehicleModel,
          vehiclePlate,
          documents: documents || '{}',
          status: 'PENDING'
        }
      });
    }

    // Generate token
    const token = generateToken(user);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: token,
        primaryRole: 'RIDER',
        allRoles: 'CUSTOMER,RIDER',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        roles: ['CUSTOMER', 'RIDER'],
        riderStatus: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Rider registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register rider'
      }
    });
  }
});

// Register admin (for demo/testing purposes)
router.post('/register/admin', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, and full name are required'
        }
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with admin profile
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        emailVerified: true,
        status: 'ACTIVE',
        profile: {
          create: {
            roles: 'ADMIN',
            status: 'ACTIVE'
          }
        },
        adminProfile: {
          create: {
            role: 'ADMIN',
            permissions: '{"all": true}'
          }
        }
      },
      include: {
        profile: true,
        adminProfile: true
      }
    });

    // Generate token
    const token = generateToken(user);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: token,
        primaryRole: 'ADMIN',
        allRoles: 'ADMIN',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        roles: ['ADMIN']
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register admin'
      }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email },
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
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended'
        }
      });
    }

    if (user.status === 'DELETED') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_DELETED',
          message: 'Your account has been deleted'
        }
      });
    }

    // Parse roles
    const roles = user.profile?.roles ? user.profile.roles.split(',') : ['CUSTOMER'];
    const primaryRole = roles[0];

    // Generate token
    const token = generateToken(user);

    // Create session (invalidates any existing sessions)
    await createSession(
      user.id,
      primaryRole,
      user.profile?.roles || 'CUSTOMER',
      req.ip,
      req.get('user-agent')
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    // Build response data based on roles
    const responseData = {
      user: userWithoutPassword,
      token,
      roles
    };

    // Add role-specific data
    if (roles.includes('MERCHANT') && user.merchantProfile) {
      responseData.merchantStatus = user.merchantProfile.status;
    }
    if (roles.includes('RIDER') && user.riderProfile) {
      responseData.riderStatus = user.riderProfile.status;
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Login failed'
      }
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Delete session
      await prisma.session.deleteMany({
        where: { refreshToken: token }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Logout failed'
      }
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Find session
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Invalid or expired session'
        }
      });
    }

    // Generate new token
    const newToken = generateToken(session.user);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const roles = session.user.profile?.roles ? session.user.profile.roles.split(',') : ['CUSTOMER'];

    res.json({
      success: true,
      data: {
        token: newToken,
        roles
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh token'
      }
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
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
    const decoded = jwt.verify(token, JWT_SECRET);

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
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ME_ERROR',
        message: 'Failed to get user'
      }
    });
  }
});

module.exports = router;
