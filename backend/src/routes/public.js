const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Haversine formula for distance calculation
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// GET /api/public/stores - List publicly available stores
router.get('/stores', async (req, res) => {
  try {
    const { lat, lng, radius = 10, category, search, featured } = req.query;

    // Build where clause for public stores
    const where = {
      isActive: true,
      isPublic: true,
      merchant: {
        status: 'APPROVED',
        isActive: true
      }
    };

    // Get all matching stores
    let stores = await prisma.store.findMany({
      where,
      include: {
        merchant: {
          select: {
            businessName: true,
            type: true,
            rating: true
          }
        },
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Filter by geolocation if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      stores = stores.filter(store => {
        if (!store.lat || !store.lng) return false;
        const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
        return distance <= radiusKm;
      }).map(store => {
        const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
        return {
          ...store,
          distance: Math.round(distance * 100) / 100
        };
      });
    }

    // Filter by category
    if (category) {
      stores = stores.filter(store =>
        store.categories.some(cat => cat.id === category || cat.name.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // Search by name or description
    if (search) {
      const searchLower = search.toLowerCase();
      stores = stores.filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter featured
    if (featured === 'true') {
      stores = stores.filter(store => store.isFeatured);
    }

    // Calculate average rating
    stores = stores.map(store => {
      const ratings = store.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : store.rating;
      return {
        ...store,
        rating: avgRating,
        reviewCount: ratings.length,
        reviews: undefined
      };
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

// GET /api/public/stores/:id - Get single store
router.get('/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findFirst({
      where: {
        id,
        isActive: true,
        isPublic: true,
        merchant: {
          status: 'APPROVED',
          isActive: true
        }
      },
      include: {
        merchant: {
          select: {
            businessName: true,
            type: true,
            address: true
          }
        },
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: {
                isAvailable: true,
                stockLevel: { not: 0 }
              },
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
                isFeatured: true
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
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

    // Calculate average rating
    const ratings = store.reviews.map(r => r.rating);
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : store.rating;

    res.json({
      success: true,
      data: {
        ...store,
        rating: avgRating,
        reviewCount: ratings.length
      }
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_STORE_ERROR',
        message: 'Failed to fetch store'
      }
    });
  }
});

// GET /api/public/stores/:id/products - Get products for a store
router.get('/stores/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, search, featured } = req.query;

    // Verify store is public and active
    const store = await prisma.store.findFirst({
      where: {
        id,
        isActive: true,
        isPublic: true,
        merchant: {
          status: 'APPROVED',
          isActive: true
        }
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

    // Build product query
    const where = {
      storeId: id,
      isAvailable: true,
      stockLevel: { not: 0 }
    };

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // Search
    if (search) {
      where.name = { contains: search.toLowerCase() };
    }

    // Filter featured
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
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
      data: products
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

// GET /api/public/categories - List all categories
router.get('/categories', async (req, res) => {
  try {
    const { storeId } = req.query;

    const where = { isActive: true };
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

// GET /api/public/search - Search across stores and products
router.get('/search', async (req, res) => {
  try {
    const { q, lat, lng, radius = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query is required'
        }
      });
    }

    const searchLower = q.toLowerCase();

    // Search stores
    const storesWhere = {
      isActive: true,
      isPublic: true,
      merchant: {
        status: 'APPROVED',
        isActive: true
      },
      OR: [
        { name: { contains: searchLower } },
        { description: { contains: searchLower } }
      ]
    };

    let stores = await prisma.store.findMany({
      where: storesWhere,
      include: {
        merchant: {
          select: {
            businessName: true,
            type: true
          }
        }
      }
    });

    // Filter by geolocation if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      stores = stores.filter(store => {
        if (!store.lat || !store.lng) return false;
        const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
        return distance <= radiusKm;
      }).map(store => {
        const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
        return {
          ...store,
          distance: Math.round(distance * 100) / 100
        };
      });
    }

    // Search products
    const productsWhere = {
      isAvailable: true,
      stockLevel: { not: 0 },
      store: {
        isActive: true,
        isPublic: true,
        merchant: {
          status: 'APPROVED',
          isActive: true
        }
      },
      OR: [
        { name: { contains: searchLower } },
        { description: { contains: searchLower } }
      ]
    };

    const products = await prisma.product.findMany({
      where: productsWhere,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true
          }
        }
      }
    });

    // Filter products by geolocation if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      products.forEach(product => {
        if (product.store.lat && product.store.lng) {
          const distance = calculateDistance(userLat, userLng, product.store.lat, product.store.lng);
          product.distance = Math.round(distance * 100) / 100;
        }
      });

      products.filter(product => product.distance <= radiusKm);
    }

    res.json({
      success: true,
      data: {
        stores,
        products
      }
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Search failed'
      }
    });
  }
});

module.exports = router;
