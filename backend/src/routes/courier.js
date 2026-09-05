const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCourier } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// All routes require courier/rider role
router.use(requireCourier);

// Helper to get rider profile ID from user
const getRiderId = async (userId) => {
  const rider = await prisma.riderProfile.findFirst({
    where: { userId }
  });
  return rider?.id;
};

// GET /api/courier/profile - Get courier profile
router.get('/profile', async (req, res) => {
  try {
    const rider = await prisma.riderProfile.findFirst({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        }
      }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    res.json({
      success: true,
      data: rider
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PROFILE_ERROR',
        message: 'Server error'
      }
    });
  }
});

// GET /api/courier/orders - Get courier orders (available + assigned)
router.get('/orders', async (req, res) => {
  try {
    const riderId = await getRiderId(req.user.id);
    if (!riderId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'READY_FOR_PICKUP', riderId: null },
          { riderId: riderId }
        ]
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        orderItems: true,
        customer: {
          select: {
            fullName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ORDERS_ERROR',
        message: 'Server error'
      }
    });
  }
});

// POST /api/courier/status - Update courier online/offline status
router.post('/status', async (req, res) => {
  try {
    const riderId = await getRiderId(req.user.id);
    if (!riderId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const { isOnline, currentLat, currentLng } = req.body;

    const rider = await prisma.riderProfile.update({
      where: { id: riderId },
      data: {
        isOnline: isOnline !== undefined ? isOnline : false,
        currentLat: currentLat ? parseFloat(currentLat) : null,
        currentLng: currentLng ? parseFloat(currentLng) : null
      }
    });

    res.json({
      success: true,
      data: rider
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STATUS_ERROR',
        message: 'Server error'
      }
    });
  }
});

// GET /api/courier/orders/available - Get available orders for pickup
router.get('/orders/available', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'READY_FOR_PICKUP',
        riderId: null
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        orderItems: true,
        customer: {
          select: {
            fullName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ORDERS_ERROR',
        message: 'Server error'
      }
    });
  }
});

// POST /api/courier/orders/:id/accept - Accept order
router.post('/orders/:id/accept', async (req, res) => {
  try {
    const riderId = await getRiderId(req.user.id);
    if (!riderId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, status: 'READY_FOR_PICKUP', riderId: null }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not available'
        }
      });
    }

    // Create rider assignment
    const assignment = await prisma.riderAssignment.create({
      data: {
        orderId: req.params.id,
        riderId: req.user.id,
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        riderId: req.user.id,
        status: 'RIDER_ASSIGNED'
      }
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'RIDER_ASSIGNED',
        changedBy: req.user.id,
        note: 'Rider accepted order'
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order.id}`).emit('order:statusChanged', {
        orderId: order.id,
        status: 'RIDER_ASSIGNED'
      });
    }

    res.json({
      success: true,
      data: {
        order: updatedOrder,
        assignment
      }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACCEPT_ORDER_ERROR',
        message: 'Server error'
      }
    });
  }
});

// POST /api/courier/orders/:id/pickup - Confirm pickup
router.post('/orders/:id/pickup', async (req, res) => {
  try {
    const riderId = await getRiderId(req.user.id);
    if (!riderId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, riderId: req.user.id, status: 'RIDER_ASSIGNED' }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'PICKED_UP' }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PICKED_UP',
        changedBy: req.user.id,
        note: 'Rider picked up order'
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order.id}`).emit('order:statusChanged', {
        orderId: order.id,
        status: 'PICKED_UP'
      });
    }

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Pickup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PICKUP_ERROR',
        message: 'Server error'
      }
    });
  }
});

// POST /api/courier/orders/:id/deliver - Complete delivery
router.post('/orders/:id/deliver', async (req, res) => {
  try {
    const riderId = await getRiderId(req.user.id);
    if (!riderId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, riderId: req.user.id, status: 'PICKED_UP' }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'DELIVERED' }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'DELIVERED',
        changedBy: req.user.id,
        note: 'Order delivered'
      }
    });

    // Create rider payout
    const payoutAmount = 150;
    await prisma.walletEntry.create({
      data: {
        userId: req.user.id,
        category: 'RIDER_PAYOUT',
        amount: payoutAmount,
        reference: order.id,
        metadata: JSON.stringify({ orderId: order.id })
      }
    });

    // Update rider stats
    await prisma.riderProfile.update({
      where: { id: riderId },
      data: {
        totalDeliveries: { increment: 1 }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order.id}`).emit('order:statusChanged', {
        orderId: order.id,
        status: 'DELIVERED'
      });
    }

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Deliver error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELIVER_ERROR',
        message: 'Server error'
      }
    });
  }
});

// GET /api/courier/earnings - Get courier earnings
router.get('/earnings', async (req, res) => {
  try {
    const riderId = await getRiderId(req.user.id);
    if (!riderId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const walletEntries = await prisma.walletEntry.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const balance = walletEntries.reduce((sum, entry) => {
      return entry.amount > 0 ? sum + Number(entry.amount) : sum - Number(entry.amount);
    }, 0);

    res.json({
      success: true,
      data: {
        balance,
        entries: walletEntries.slice(0, 50)
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_EARNINGS_ERROR',
        message: 'Server error'
      }
    });
  }
});

// POST /api/courier/sos - Send SOS emergency alert
router.post('/sos', async (req, res) => {
  try {
    const { location, message } = req.body;

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('sos:alert', {
        userId: req.user.id,
        userName: req.user.fullName,
        location,
        message,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'SOS alert sent'
    });
  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SOS_ERROR',
        message: 'Server error'
      }
    });
  }
});

// PUT /api/courier/vehicle - Update vehicle info
router.put('/vehicle', async (req, res) => {
  try {
    const riderId = await getRiderId(req.user.id);
    if (!riderId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const { vehicleMake, vehicleModel, vehiclePlate } = req.body;

    const rider = await prisma.riderProfile.update({
      where: { id: riderId },
      data: {
        vehicleMake,
        vehicleModel,
        vehiclePlate
      }
    });

    res.json({
      success: true,
      data: rider
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_VEHICLE_ERROR',
        message: 'Server error'
      }
    });
  }
});

module.exports = router;
