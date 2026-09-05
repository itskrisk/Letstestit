const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify merchant owns the store
const merchantOwnsStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const merchantProfile = req.merchantProfile;

    if (!merchantProfile) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_MERCHANT',
          message: 'Merchant profile not found'
        }
      });
    }

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId: merchantProfile.id
      }
    });

    if (!store) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not own this store'
        }
      });
    }

    req.store = store;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to verify store ownership'
      }
    });
  }
};

// Verify merchant owns the product
const merchantOwnsProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const merchantProfile = req.merchantProfile;

    if (!merchantProfile) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_MERCHANT',
          message: 'Merchant profile not found'
        }
      });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        merchantId: merchantProfile.id
      },
      include: {
        store: true
      }
    });

    if (!product) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not own this product'
        }
      });
    }

    req.product = product;
    req.store = product.store;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to verify product ownership'
      }
    });
  }
};

// Verify merchant owns the order
const merchantOwnsOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const merchantProfile = req.merchantProfile;

    if (!merchantProfile) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_MERCHANT',
          message: 'Merchant profile not found'
        }
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        merchantId: req.user.id
      }
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not own this order'
        }
      });
    }

    req.order = order;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to verify order ownership'
      }
    });
  }
};

// Verify customer owns the order
const customerOwnsOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: req.user.id
      }
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not own this order'
        }
      });
    }

    req.order = order;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to verify order ownership'
      }
    });
  }
};

// Verify rider owns the assignment
const riderOwnsAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const riderProfile = req.riderProfile;

    if (!riderProfile) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_RIDER',
          message: 'Rider profile not found'
        }
      });
    }

    const assignment = await prisma.riderAssignment.findFirst({
      where: {
        id: assignmentId,
        riderId: req.user.id
      },
      include: {
        order: true
      }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not own this assignment'
        }
      });
    }

    req.assignment = assignment;
    req.order = assignment.order;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to verify assignment ownership'
      }
    });
  }
};

module.exports = {
  merchantOwnsStore,
  merchantOwnsProduct,
  merchantOwnsOrder,
  customerOwnsOrder,
  riderOwnsAssignment
};
