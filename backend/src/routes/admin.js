const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/admin/dashboard - Get admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalUsers = await prisma.user.count();
    const totalMerchants = await prisma.merchantProfile.count();
    const totalRiders = await prisma.riderProfile.count();
    const totalOrders = await prisma.order.count();
    const pendingMerchants = await prisma.merchantProfile.count({
      where: { status: 'PENDING' }
    });
    const pendingRiders = await prisma.riderProfile.count({
      where: { status: 'PENDING' }
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.count({
      where: { createdAt: { gte: today } }
    });

    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: { notIn: ['CUSTOMER_CANCELLED', 'MERCHANT_REJECTED', 'CANCELLED'] }
      },
      _sum: {
        total: true
      }
    });

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalMerchants,
          totalRiders,
          totalOrders,
          pendingMerchants,
          pendingRiders
        },
        today: {
          orders: todayOrders,
          revenue: todayRevenue._sum.total || 0
        }
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

// GET /api/admin/merchant-applications - Get pending merchant applications
router.get('/merchant-applications', async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const applications = await prisma.merchantApplication.findMany({
      where,
      include: {
        merchant: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.merchantApplication.count({ where });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching merchant applications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_APPLICATIONS_ERROR',
        message: 'Failed to fetch merchant applications'
      }
    });
  }
});

// POST /api/admin/merchants/:id/approve - Approve merchant
router.post('/merchants/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const merchantProfile = await prisma.merchantProfile.findFirst({
      where: { id }
    });

    if (!merchantProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MERCHANT_NOT_FOUND',
          message: 'Merchant not found'
        }
      });
    }

    // Update merchant profile
    await prisma.merchantProfile.update({
      where: { id },
      data: {
        status: 'APPROVED',
        isActive: true
      }
    });

    // Update application
    await prisma.merchantApplication.updateMany({
      where: { merchantId: id, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        reviewedBy: req.user.id,
        reviewNote: note,
        reviewedAt: new Date()
      }
    });

    // Update profile roles
    const profile = await prisma.profile.findFirst({
      where: { userId: merchantProfile.userId }
    });

    if (profile) {
      const roles = profile.roles.split(',');
      if (!roles.includes('MERCHANT')) {
        roles.push('MERCHANT');
        await prisma.profile.update({
          where: { id: profile.id },
          data: { roles: roles.join(',') }
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorRole: 'ADMIN',
        action: 'APPROVE',
        entityType: 'MerchantProfile',
        entityId: id,
        metadata: JSON.stringify({ note }),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Merchant approved successfully'
    });
  } catch (error) {
    console.error('Error approving merchant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_MERCHANT_ERROR',
        message: 'Failed to approve merchant'
      }
    });
  }
});

// POST /api/admin/merchants/:id/reject - Reject merchant
router.post('/merchants/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const merchantProfile = await prisma.merchantProfile.findFirst({
      where: { id }
    });

    if (!merchantProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MERCHANT_NOT_FOUND',
          message: 'Merchant not found'
        }
      });
    }

    // Update merchant profile
    await prisma.merchantProfile.update({
      where: { id },
      data: {
        status: 'REJECTED',
        isActive: false
      }
    });

    // Update application
    await prisma.merchantApplication.updateMany({
      where: { merchantId: id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        reviewedBy: req.user.id,
        reviewNote: note,
        reviewedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorRole: 'ADMIN',
        action: 'REJECT',
        entityType: 'MerchantProfile',
        entityId: id,
        metadata: JSON.stringify({ note }),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Merchant rejected'
    });
  } catch (error) {
    console.error('Error rejecting merchant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_MERCHANT_ERROR',
        message: 'Failed to reject merchant'
      }
    });
  }
});

// POST /api/admin/merchants/:id/suspend - Suspend merchant
router.post('/merchants/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const merchantProfile = await prisma.merchantProfile.findFirst({
      where: { id }
    });

    if (!merchantProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MERCHANT_NOT_FOUND',
          message: 'Merchant not found'
        }
      });
    }

    await prisma.merchantProfile.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        isActive: false
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorRole: 'ADMIN',
        action: 'SUSPEND',
        entityType: 'MerchantProfile',
        entityId: id,
        metadata: JSON.stringify({ reason }),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Merchant suspended'
    });
  } catch (error) {
    console.error('Error suspending merchant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUSPEND_MERCHANT_ERROR',
        message: 'Failed to suspend merchant'
      }
    });
  }
});

// GET /api/admin/rider-applications - Get pending rider applications
router.get('/rider-applications', async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const applications = await prisma.riderApplication.findMany({
      where,
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.riderApplication.count({ where });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching rider applications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_APPLICATIONS_ERROR',
        message: 'Failed to fetch rider applications'
      }
    });
  }
});

// POST /api/admin/riders/:id/approve - Approve rider
router.post('/riders/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const riderProfile = await prisma.riderProfile.findFirst({
      where: { id }
    });

    if (!riderProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RIDER_NOT_FOUND',
          message: 'Rider not found'
        }
      });
    }

    // Update rider profile
    await prisma.riderProfile.update({
      where: { id },
      data: {
        status: 'APPROVED'
      }
    });

    // Update application
    await prisma.riderApplication.updateMany({
      where: { riderId: id, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        reviewedBy: req.user.id,
        reviewNote: note,
        reviewedAt: new Date()
      }
    });

    // Update profile roles
    const profile = await prisma.profile.findFirst({
      where: { userId: riderProfile.userId }
    });

    if (profile) {
      const roles = profile.roles.split(',');
      if (!roles.includes('RIDER')) {
        roles.push('RIDER');
        await prisma.profile.update({
          where: { id: profile.id },
          data: { roles: roles.join(',') }
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorRole: 'ADMIN',
        action: 'APPROVE',
        entityType: 'RiderProfile',
        entityId: id,
        metadata: JSON.stringify({ note }),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Rider approved successfully'
    });
  } catch (error) {
    console.error('Error approving rider:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_RIDER_ERROR',
        message: 'Failed to approve rider'
      }
    });
  }
});

// POST /api/admin/riders/:id/reject - Reject rider
router.post('/riders/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const riderProfile = await prisma.riderProfile.findFirst({
      where: { id }
    });

    if (!riderProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RIDER_NOT_FOUND',
          message: 'Rider not found'
        }
      });
    }

    // Update rider profile
    await prisma.riderProfile.update({
      where: { id },
      data: {
        status: 'REJECTED'
      }
    });

    // Update application
    await prisma.riderApplication.updateMany({
      where: { riderId: id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        reviewedBy: req.user.id,
        reviewNote: note,
        reviewedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorRole: 'ADMIN',
        action: 'REJECT',
        entityType: 'RiderProfile',
        entityId: id,
        metadata: JSON.stringify({ note }),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Rider rejected'
    });
  } catch (error) {
    console.error('Error rejecting rider:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_RIDER_ERROR',
        message: 'Failed to reject rider'
      }
    });
  }
});

// GET /api/admin/orders - Get all orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        merchant: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        rider: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.order.count({ where });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ORDERS_ERROR',
        message: 'Failed to fetch orders'
      }
    });
  }
});

// GET /api/admin/audit-logs - Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, entityType, page = 1, limit = 20 } = req.query;

    const where = {};
    if (action) {
      where.action = action;
    }
    if (entityType) {
      where.entityType = entityType;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.auditLog.count({ where });

    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_AUDIT_LOGS_ERROR',
        message: 'Failed to fetch audit logs'
      }
    });
  }
});

module.exports = router;
