const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Check if merchant is approved and active
const merchantApproved = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    const merchantProfile = await prisma.merchantProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!merchantProfile) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_MERCHANT',
          message: 'Merchant profile not found'
        }
      });
    }

    if (merchantProfile.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MERCHANT_NOT_APPROVED',
          message: `Merchant application is ${merchantProfile.status.toLowerCase()}`,
          status: merchantProfile.status
        }
      });
    }

    if (!merchantProfile.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MERCHANT_INACTIVE',
          message: 'Merchant account is inactive'
        }
      });
    }

    // Attach merchant profile to request
    req.merchantProfile = merchantProfile;
    next();
  } catch (error) {
    console.error('Merchant approval check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'APPROVAL_CHECK_ERROR',
        message: 'Failed to verify merchant status'
      }
    });
  }
};

// Check if rider is approved and active
const riderApproved = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    const riderProfile = await prisma.riderProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!riderProfile) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_RIDER',
          message: 'Rider profile not found'
        }
      });
    }

    if (riderProfile.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'RIDER_NOT_APPROVED',
          message: `Rider application is ${riderProfile.status.toLowerCase()}`,
          status: riderProfile.status
        }
      });
    }

    // Attach rider profile to request
    req.riderProfile = riderProfile;
    next();
  } catch (error) {
    console.error('Rider approval check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'APPROVAL_CHECK_ERROR',
        message: 'Failed to verify rider status'
      }
    });
  }
};

module.exports = {
  merchantApproved,
  riderApproved
};
