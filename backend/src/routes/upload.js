const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = path.join(uploadsDir, file.fieldname);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// POST /api/upload - Upload a document
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded'
        }
      });
    }

    const { type, category } = req.body;
    const fileUrl = `/uploads/${req.file.fieldname}/${req.file.filename}`;

    // If type is merchant or rider, update the profile with document info
    if (type === 'merchant' && req.user.merchantProfile) {
      const documents = JSON.parse(req.user.merchantProfile.documents || '{}');
      documents[category] = {
        url: fileUrl,
        filename: req.file.originalname,
        uploadedAt: new Date().toISOString()
      };

      await prisma.merchantProfile.update({
        where: { id: req.user.merchantProfile.id },
        data: { documents: JSON.stringify(documents) }
      });
    } else if (type === 'rider' && req.user.riderProfile) {
      const documents = JSON.parse(req.user.riderProfile.documents || '{}');
      documents[category] = {
        url: fileUrl,
        filename: req.file.originalname,
        uploadedAt: new Date().toISOString()
      };

      await prisma.riderProfile.update({
        where: { id: req.user.riderProfile.id },
        data: { documents: JSON.stringify(documents) }
      });
    }

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.originalname,
        category: category || 'general'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload file'
      }
    });
  }
});

// GET /api/upload/:type/:id - Get documents for a merchant or rider
router.get('/:type/:id', authenticate, async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'merchant') {
      const merchant = await prisma.merchantProfile.findFirst({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MERCHANT_NOT_FOUND',
            message: 'Merchant not found'
          }
        });
      }

      const documents = JSON.parse(merchant.documents || '{}');

      res.json({
        success: true,
        data: {
          merchant: {
            id: merchant.id,
            businessName: merchant.businessName,
            user: merchant.user
          },
          documents
        }
      });
    } else if (type === 'rider') {
      const rider = await prisma.riderProfile.findFirst({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      });

      if (!rider) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RIDER_NOT_FOUND',
            message: 'Rider not found'
          }
        });
      }

      const documents = JSON.parse(rider.documents || '{}');

      res.json({
        success: true,
        data: {
          rider: {
            id: rider.id,
            user: rider.user,
            vehicleType: rider.vehicleType
          },
          documents
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be merchant or rider'
        }
      });
    }
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_DOCUMENTS_ERROR',
        message: 'Failed to fetch documents'
      }
    });
  }
});

// Serve uploaded files statically
router.use('/', express.static(uploadsDir));

module.exports = router;
