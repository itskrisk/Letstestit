const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { initiateSTKPush, formatPhoneNumber } = require('../services/mpesaService');

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/payments/initiate - Initiate M-Pesa STK Push
router.post('/initiate', async (req, res) => {
  try {
    const { orderId, phoneNumber, provider = 'MPESA' } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ORDER_ID',
          message: 'Order ID is required'
        }
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PHONE_NUMBER',
          message: 'Phone number is required'
        }
      });
    }

    // Get order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
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

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { orderId }
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_ALREADY_COMPLETED',
          message: 'Payment already completed for this order'
        }
      });
    }

    // Format phone number for M-Pesa
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PHONE_NUMBER',
          message: 'Invalid phone number format'
        }
      });
    }

    // Create or update payment record
    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: 'PENDING', amount: order.total }
        })
      : await prisma.payment.create({
          data: {
            orderId,
            customerId: req.user.id,
            provider,
            amount: order.total,
            status: 'PENDING'
          }
        });

    // Initiate M-Pesa STK Push
    const stkResult = await initiateSTKPush(
      formattedPhone,
      order.total,
      orderId,
      `Muncheez Order ${orderId}`
    );

    if (!stkResult.success) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      // Create transaction record
      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          type: 'FAILURE',
          providerRef: `STK-${Date.now()}`,
          response: JSON.stringify({ error: stkResult.error })
        }
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'STK_PUSH_FAILED',
          message: stkResult.error || 'Failed to initiate M-Pesa payment'
        }
      });
    }

    // Create transaction record
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'INITIATE',
        providerRef: stkResult.data.checkoutRequestId,
        response: JSON.stringify(stkResult.data)
      }
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        provider: payment.provider,
        status: payment.status,
        checkoutRequestId: stkResult.data.checkoutRequestId,
        merchantRequestID: stkResult.data.merchantRequestID,
        customerMessage: stkResult.data.customerMessage
      }
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INITIATE_PAYMENT_ERROR',
        message: 'Failed to initiate payment'
      }
    });
  }
});

// POST /api/payments/callback - M-Pesa callback/webhook
router.post('/callback', async (req, res) => {
  try {
    const { Body, Header } = req.body;

    // M-Pesa callback format
    const checkoutRequestId = Body?.checkoutRequestID;
    const resultCode = Body?.resultCode;
    const resultDesc = Body?.resultDesc;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CHECKOUT_ID',
          message: 'Checkout request ID is required'
        }
      });
    }

    // Find payment by checkout request ID (stored in transaction)
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        type: 'INITIATE',
        providerRef: checkoutRequestId
      },
      include: {
        payment: {
          include: {
            order: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    const payment = transaction.payment;
    const order = payment.order;
    const isSuccess = resultCode === 0;

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        providerPayload: JSON.stringify(req.body),
        completedAt: isSuccess ? new Date() : null
      }
    });

    // Create transaction record
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: isSuccess ? 'SUCCESS' : 'FAILURE',
        providerRef: checkoutRequestId,
        response: JSON.stringify(req.body)
      }
    });

    if (isSuccess) {
      // Update order status using state machine
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PAID',
          paymentStatus: 'PAID',
          mpesaCode: Body?.mpesaReceiptNumber
        }
      });

      // Add status history
      await prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: 'PAID',
          note: 'M-Pesa payment successful',
          metadata: JSON.stringify({
            paymentId: payment.id,
            mpesaReceipt: Body?.mpesaReceiptNumber
          })
        }
      });

      // Create wallet entry
      await prisma.walletEntry.create({
        data: {
          userId: payment.customerId,
          category: 'ORDER_PAYMENT',
          amount: -payment.amount,
          reference: payment.orderId,
          metadata: JSON.stringify({
            paymentId: payment.id,
            mpesaReceipt: Body?.mpesaReceiptNumber
          })
        }
      });
    } else {
      // Payment failed - update order status
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'FAILED',
          paymentStatus: 'FAILED'
        }
      });

      // Add status history
      await prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: 'FAILED',
          note: `Payment failed: ${resultDesc || 'Unknown error'}`
        }
      });
    }

    res.json({
      success: true,
      message: 'Callback processed'
    });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALLBACK_ERROR',
        message: 'Failed to process callback'
      }
    });
  }
});

// GET /api/payments/:id/status - Get payment status
router.get('/:id/status', async (req, {
  params
}) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        customerId: req.user.id
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PAYMENT_ERROR',
        message: 'Failed to fetch payment status'
      }
    });
  }
});

module.exports = router;
