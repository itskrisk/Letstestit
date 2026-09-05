const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/merchant/dashboard - Get merchant dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const merchantProfile = req.merchantProfile;

    // Get stores
    const stores = await prisma.store.findMany({
      where: { merchantId: merchantProfile.id },
      include: {
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    });

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.count({
      where: {
        merchantId: req.user.id,
        createdAt: { gte: today }
      }
    });

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        merchantId: req.user.id,
        status: { in: ['PAID', 'PLACED', 'MERCHANT_ACCEPTED', 'PREPARING'] }
      }
    });

    // Get today's revenue
    const todayRevenue = await prisma.order.aggregate({
      where: {
        merchantId: req.user.id,
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
        stores,
        stats: {
          todayOrders,
          pendingOrders,
          todayRevenue: todayRevenue._sum.total || 0
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

// GET /api/merchant/stores - Get merchant stores
router.get('/stores', async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      where: { merchantId: req.merchantProfile.id },
      include: {
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_STORES_ERROR',
        message: 'Failed to fetch stores'
      }
    });
  }
});

// POST /api/merchant/stores - Create store
router.post('/stores', async (req, res) => {
  try {
    const { name, description, address, lat, lng, deliveryRadiusKm, openingHours, preparationTimeMin, deliveryFee } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Name and address are required'
        }
      });
    }

    const store = await prisma.store.create({
      data: {
        merchantId: req.merchantProfile.id,
        name,
        description,
        address,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        deliveryRadiusKm: deliveryRadiusKm ? parseFloat(deliveryRadiusKm) : 5.0,
        openingHours: openingHours || '{}',
        preparationTimeMin: preparationTimeMin || 30,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : 150
      }
    });

    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_STORE_ERROR',
        message: 'Failed to create store'
      }
    });
  }
});

// PUT /api/merchant/stores/:id - Update store
router.put('/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, lat, lng, deliveryRadiusKm, openingHours, preparationTimeMin, deliveryFee, isActive, isPublic } = req.body;

    // Verify ownership
    const store = await prisma.store.findFirst({
      where: {
        id,
        merchantId: req.merchantProfile.id
      }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORE_NOT_FOUND',
          message: 'Store not found'
        }
      });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: name || store.name,
        description: description !== undefined ? description : store.description,
        address: address || store.address,
        lat: lat ? parseFloat(lat) : store.lat,
        lng: lng ? parseFloat(lng) : store.lng,
        deliveryRadiusKm: deliveryRadiusKm ? parseFloat(deliveryRadiusKm) : store.deliveryRadiusKm,
        openingHours: openingHours || store.openingHours,
        preparationTimeMin: preparationTimeMin || store.preparationTimeMin,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : store.deliveryFee,
        isActive: isActive !== undefined ? isActive : store.isActive,
        isPublic: isPublic !== undefined ? isPublic : store.isPublic
      }
    });

    res.json({
      success: true,
      data: updatedStore
    });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STORE_ERROR',
        message: 'Failed to update store'
      }
    });
  }
});

// GET /api/merchant/products - Get merchant products
router.get('/products', async (req, res) => {
  try {
    const { storeId, category, search, page = 1, limit = 20 } = req.query;

    const where = {
      merchantId: req.merchantProfile.id
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.name = { contains: search.toLowerCase() };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PRODUCTS_ERROR',
        message: 'Failed to fetch products'
      }
    });
  }
});

// POST /api/merchant/products - Create product
router.post('/products', async (req, res) => {
  try {
    const { storeId, categoryId, name, description, price, image, isAvailable, stockLevel, metadata } = req.body;

    if (!storeId || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Store ID, name, and price are required'
        }
      });
    }

    // Verify store ownership
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId: req.merchantProfile.id
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

    const product = await prisma.product.create({
      data: {
        storeId,
        merchantId: req.merchantProfile.id,
        categoryId,
        name,
        description,
        price: parseFloat(price),
        image,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        stockLevel: stockLevel !== undefined ? parseInt(stockLevel) : -1,
        metadata: metadata || '{}'
      }
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PRODUCT_ERROR',
        message: 'Failed to create product'
      }
    });
  }
});

// PUT /api/merchant/products/:id - Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, isAvailable, stockLevel, metadata } = req.body;

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: {
        id,
        merchantId: req.merchantProfile.id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? parseFloat(price) : product.price,
        image: image !== undefined ? image : product.image,
        isAvailable: isAvailable !== undefined ? isAvailable : product.isAvailable,
        stockLevel: stockLevel !== undefined ? parseInt(stockLevel) : product.stockLevel,
        metadata: metadata || product.metadata
      }
    });

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PRODUCT_ERROR',
        message: 'Failed to update product'
      }
    });
  }
});

// GET /api/merchant/orders - Get merchant orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = { merchantId: req.user.id };
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
            phone: true
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
            fullName: true,
            phone: true
          }
        },
        orderItems: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5
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

// POST /api/merchant/orders/:id/accept - Accept order and start preparing
router.post('/orders/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        merchantId: req.user.id
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

    // Check valid transition
    if (order.status !== 'PAID' && order.status !== 'PLACED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot accept order in ${order.status} status`
        }
      });
    }

    // Update order to preparing
    await prisma.order.update({
      where: { id },
      data: { status: 'PREPARING' }
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'PREPARING',
        note: 'Order accepted and being prepared',
        metadata: JSON.stringify({ acceptedBy: req.user.id })
      }
    });

    res.json({
      success: true,
      message: 'Order accepted and being prepared'
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACCEPT_ORDER_ERROR',
        message: 'Failed to accept order'
      }
    });
  }
});

// POST /api/merchant/orders/:id/reject - Reject order
router.post('/orders/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id,
        merchantId: req.user.id
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

    // Check valid transition
    if (order.status !== 'PAID' && order.status !== 'PLACED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot reject order in ${order.status} status`
        }
      });
    }

    // Update order
    await prisma.order.update({
      where: { id },
      data: { status: 'MERCHANT_REJECTED' }
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'MERCHANT_REJECTED',
        note: reason || 'Order rejected by merchant',
        metadata: JSON.stringify({ rejectedBy: req.user.id, reason })
      }
    });

    res.json({
      success: true,
      message: 'Order rejected'
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_ORDER_ERROR',
        message: 'Failed to reject order'
      }
    });
  }
});

// POST /api/merchant/orders/:id/ready - Mark order as ready
router.post('/orders/:id/ready', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        merchantId: req.user.id
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

    // Check valid transition
    if (order.status !== 'PREPARING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot mark order as ready in ${order.status} status`
        }
      });
    }

    // Update order
    await prisma.order.update({
      where: { id },
      data: { status: 'READY_FOR_PICKUP' }
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'READY_FOR_PICKUP',
        note: 'Order is ready for pickup',
        metadata: JSON.stringify({ updatedBy: req.user.id })
      }
    });

    res.json({
      success: true,
      message: 'Order marked as ready'
    });
  } catch (error) {
    console.error('Error marking order as ready:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'READY_ORDER_ERROR',
        message: 'Failed to mark order as ready'
      }
    });
  }
});

// GET /api/merchant/categories - Get merchant categories
router.get('/categories', async (req, res) => {
  try {
    const { storeId } = req.query;

    const where = { merchantId: req.merchantProfile.id };
    if (storeId) {
      where.storeId = storeId;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CATEGORIES_ERROR',
        message: 'Failed to fetch categories'
      }
    });
  }
});

// POST /api/merchant/categories - Create category
router.post('/categories', async (req, res) => {
  try {
    const { storeId, name, sortOrder } = req.body;

    if (!storeId || !name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Store ID and name are required'
        }
      });
    }

    // Verify store ownership
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId: req.merchantProfile.id
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

    const category = await prisma.category.create({
      data: {
        storeId,
        merchantId: req.merchantProfile.id,
        name,
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CATEGORY_ERROR',
        message: 'Failed to create category'
      }
    });
  }
});

module.exports = router;
