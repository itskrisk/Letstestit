const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/customer/profile - Get customer profile
router.get('/profile', async (req, res) => {
  try {
    const customerProfile = await prisma.customerProfile.findFirst({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            emailVerified: true,
            createdAt: true
          }
        }
      }
    });

    if (!customerProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Customer profile not found'
        }
      });
    }

    res.json({
      success: true,
      data: customerProfile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PROFILE_ERROR',
        message: 'Failed to fetch profile'
      }
    });
  }
});

// GET /api/customer/addresses - Get customer addresses
router.get('/addresses', async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' }
    });

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ADDRESSES_ERROR',
        message: 'Failed to fetch addresses'
      }
    });
  }
});

// POST /api/customer/addresses - Create address
router.post('/addresses', async (req, res) => {
  try {
    const { label, addressLine1, addressLine2, city, lat, lng, isDefault } = req.body;

    if (!addressLine1 || !city) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Address line 1 and city are required'
        }
      });
    }

    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        label: label || 'Home',
        addressLine1,
        addressLine2,
        city,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        isDefault: isDefault || false
      }
    });

    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ADDRESS_ERROR',
        message: 'Failed to create address'
      }
    });
  }
});

// GET /api/customer/orders - Get customer orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = { customerId: req.user.id };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        rider: {
          select: {
            id: true,
            fullName: true,
            phone: true
          }
        },
        payment: {
          select: {
            status: true,
            provider: true
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

// GET /api/customer/orders/:id - Get single order
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: req.user.id
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            image: true,
            address: true,
            phone: true
          }
        },
        rider: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleType: true,
            vehiclePlate: true
          }
        },
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        orderItems: true
      }
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

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ORDER_ERROR',
        message: 'Failed to fetch order'
      }
    });
  }
});

// POST /api/customer/orders/:id/cancel - Cancel order
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: req.user.id
      }
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

    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING_PAYMENT', 'PAID', 'PLACED', 'PREPARING'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_CANCELLABLE',
          message: 'Order cannot be cancelled at this stage'
        }
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id },
      data: {
        status: 'CUSTOMER_CANCELLED'
      }
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'CUSTOMER_CANCELLED',
        note: reason || 'Cancelled by customer',
        metadata: JSON.stringify({ cancelledBy: req.user.id })
      }
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ORDER_ERROR',
        message: 'Failed to cancel order'
      }
    });
  }
});

// POST /api/customer/orders - Create order
router.post('/orders', async (req, res) => {
  try {
    const { merchantId, storeId, items, deliveryAddress, notes, paymentMethod } = req.body;

    if (!merchantId || !storeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Merchant ID, store ID, and items are required'
        }
      });
    }

    // Verify store exists and belongs to merchant
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId: merchantId,
        isActive: true,
        isPublic: true
      }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORE_NOT_FOUND',
          message: 'Store not found or not available'
        }
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = store.deliveryFee || 150;
    const serviceFee = subtotal * 0.05;
    const total = subtotal + deliveryFee + serviceFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: req.user.id,
        merchantId,
        storeId,
        deliveryAddress: deliveryAddress || '{}',
        status: 'PLACED',
        subtotal,
        deliveryFee,
        serviceFee,
        total,
        items: JSON.stringify(items),
        notes
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create order items
    const orderItems = await Promise.all(
      items.map(item =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName || 'Unknown Product',
            price: item.price,
            quantity: item.quantity,
            options: JSON.stringify(item.options || {})
          }
        })
      )
    );

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: req.user.id,
        provider: paymentMethod || 'MPESA',
        amount: total,
        status: 'PENDING'
      }
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PLACED',
        note: 'Order placed by customer'
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...order,
        orderItems
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ORDER_ERROR',
        message: 'Failed to create order'
      }
    });
  }
});

// GET /api/customer/reviews - Get customer reviews
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_REVIEWS_ERROR',
        message: 'Failed to fetch reviews'
      }
    });
  }
});

module.exports = router;
