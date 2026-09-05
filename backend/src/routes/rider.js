const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/rider/dashboard - Get rider dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const riderProfile = req.riderProfile;

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = await prisma.riderAssignment.count({
      where: {
        riderId: req.user.id,
        deliveredAt: { gte: today }
      }
    });

    const todayEarnings = await prisma.walletEntry.aggregate({
      where: {
        userId: req.user.id,
        category: 'RIDER_PAYOUT',
        createdAt: { gte: today }
      },
      _sum: {
        amount: true
      }
    });

    // Get current assignment
    const currentAssignment = await prisma.riderAssignment.findFirst({
      where: {
        riderId: req.user.id,
        status: { in: ['ACCEPTED', 'PICKED_UP'] }
      },
      include: {
        order: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                lat: true,
                lng: true
              }
            },
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        profile: riderProfile,
        stats: {
          todayDeliveries,
          todayEarnings: todayEarnings._sum.amount || 0
        },
        currentAssignment
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_DASHBOARD_ERROR',
        message: 'Failed to fetch dashboard'
      }
    });
  }
});

// POST /api/rider/status - Update rider online status
router.post('/status', async (req, res) => {
  try {
    const { isOnline, currentLat, currentLng } = req.body;

    const riderProfile = await prisma.riderProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!riderProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Rider profile not found'
        }
      });
    }

    const updatedProfile = await prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: {
        isOnline: isOnline !== undefined ? isOnline : riderProfile.isOnline,
        currentLat: currentLat ? parseFloat(currentLat) : riderProfile.currentLat,
        currentLng: currentLng ? parseFloat(currentLng) : riderProfile.currentLng
      }
    });

    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STATUS_ERROR',
        message: 'Failed to update status'
      }
    });
  }
});

// GET /api/rider/deliveries/available - Get available deliveries
router.get('/deliveries/available', async (req, res) => {
  try {
    const riderProfile = req.riderProfile;

    // Get orders ready for pickup that don't have an assignment yet
    const availableOrders = await prisma.order.findMany({
      where: {
        status: 'READY_FOR_PICKUP',
        riderAssignment: null
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lng: true
          }
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    res.json({
      success: true,
      data: availableOrders
    });
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_DELIVERIES_ERROR',
        message: 'Failed to fetch available deliveries'
      }
    });
  }
});

// GET /api/rider/deliveries - Get rider's deliveries
router.get('/deliveries', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = { riderId: req.user.id };
    if (status) {
      where.status = status;
    }

    const assignments = await prisma.riderAssignment.findMany({
      where,
      include: {
        order: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                lat: true,
                lng: true
              }
            },
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.riderAssignment.count({ where });

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_DELIVERIES_ERROR',
        message: 'Failed to fetch deliveries'
      }
    });
  }
});

// POST /api/rider/deliveries/:id/accept - Accept delivery
router.post('/deliveries/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const riderProfile = req.riderProfile;

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        id,
        status: 'READY_FOR_PICKUP'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or not ready for pickup'
        }
      });
    }

    // Check if already assigned
    const existingAssignment = await prisma.riderAssignment.findFirst({
      where: { orderId: id }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_ASSIGNED',
          message: 'Order already has a rider assigned'
        }
      });
    }

    // Create assignment
    const assignment = await prisma.riderAssignment.create({
      data: {
        orderId: id,
        riderId: req.user.id,
        status: 'ACCEPTED',
        acceptedAt: new Date()
      },
      include: {
        order: {
          include: {
            store: true,
            customer: true
          }
        }
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id },
      data: { status: 'RIDER_ASSIGNED' }
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'RIDER_ASSIGNED',
        note: 'Rider assigned',
        metadata: JSON.stringify({ riderId: req.user.id })
      }
    });

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error accepting delivery:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACCEPT_DELIVERY_ERROR',
        message: 'Failed to accept delivery'
      }
    });
  }
});

// POST /api/rider/deliveries/:id/arrive - Mark arrived at store
router.post('/deliveries/:id/arrive', async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.riderAssignment.findFirst({
      where: {
        id,
        riderId: req.user.id
      },
      include: {
        order: true
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSIGNMENT_NOT_FOUND',
          message: 'Assignment not found'
        }
      });
    }

    if (assignment.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot arrive in ${assignment.status} status`
        }
      });
    }

    await prisma.riderAssignment.update({
      where: { id },
      data: { status: 'RIDER_ARRIVING' }
    });

    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: 'RIDER_ARRIVING' }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: assignment.orderId,
        status: 'RIDER_ARRIVING',
        note: 'Rider arrived at store',
        metadata: JSON.stringify({ riderId: req.user.id })
      }
    });

    res.json({
      success: true,
      message: 'Arrival marked'
    });
  } catch (error) {
    console.error('Error marking arrival:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ARRIVE_ERROR',
        message: 'Failed to mark arrival'
      }
    });
  }
});

// POST /api/rider/deliveries/:id/pickup - Mark picked up
router.post('/deliveries/:id/pickup', async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const assignment = await prisma.riderAssignment.findFirst({
      where: {
        id,
        riderId: req.user.id
      },
      include: {
        order: true
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSIGNMENT_NOT_FOUND',
          message: 'Assignment not found'
        }
      });
    }

    if (assignment.status !== 'RIDER_ARRIVING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot pickup in ${assignment.status} status`
        }
      });
    }

    // Verify OTP if provided
    if (otp && assignment.otp && otp !== assignment.otp) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP'
        }
      });
    }

    await prisma.riderAssignment.update({
      where: { id },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date()
      }
    });

    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: 'PICKED_UP' }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: assignment.orderId,
        status: 'PICKED_UP',
        note: 'Order picked up by rider',
        metadata: JSON.stringify({ riderId: req.user.id })
      }
    });

    res.json({
      success: true,
      message: 'Order picked up'
    });
  } catch (error) {
    console.error('Error marking pickup:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PICKUP_ERROR',
        message: 'Failed to mark pickup'
      }
    });
  }
});

// POST /api/rider/deliveries/:id/deliver - Mark delivered
router.post('/deliveries/:id/deliver', async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const assignment = await prisma.riderAssignment.findFirst({
      where: {
        id,
        riderId: req.user.id
      },
      include: {
        order: true
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSIGNMENT_NOT_FOUND',
          message: 'Assignment not found'
        }
      });
    }

    if (assignment.status !== 'PICKED_UP') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot deliver in ${assignment.status} status`
        }
      });
    }

    // Verify OTP if provided
    if (otp && assignment.otp && otp !== assignment.otp) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP'
        }
      });
    }

    await prisma.riderAssignment.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      }
    });

    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: 'DELIVERED' }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: assignment.orderId,
        status: 'DELIVERED',
        note: 'Order delivered',
        metadata: JSON.stringify({ riderId: req.user.id })
      }
    });

    // Update rider stats
    await prisma.riderProfile.update({
      where: { userId: req.user.id },
      data: {
        totalDeliveries: { increment: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Order delivered'
    });
  } catch (error) {
    console.error('Error marking delivery:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELIVER_ERROR',
        message: 'Failed to mark delivery'
      }
    });
  }
});

// GET /api/rider/earnings - Get rider earnings
router.get('/earnings', async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let startDate = new Date();
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const earnings = await prisma.walletEntry.findMany({
      where: {
        userId: req.user.id,
        category: 'RIDER_PAYOUT',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = earnings.reduce((sum, entry) => sum + entry.amount, 0);

    res.json({
      success: true,
      data: {
        earnings,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_EARNINGS_ERROR',
        message: 'Failed to fetch earnings'
      }
    });
  }
});

module.exports = router;
