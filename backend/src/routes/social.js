const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/social/friends
// @desc    Get user's friends
// @access  Private
router.get('/friends', async (req, res) => {
  try {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: req.user.id, status: 'accepted' },
          { friendId: req.user.id, status: 'accepted' }
        ]
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, loyaltyTier: true }
        },
        friend: {
          select: { id: true, fullName: true, avatarUrl: true, loyaltyTier: true }
        }
      }
    });

    const formattedFriends = friends.map(f => {
      const friend = f.userId === req.user.id ? f.friend : f.user;
      return {
        id: friend.id,
        name: friend.fullName,
        avatar: friend.avatarUrl,
        username: friend.fullName.toLowerCase().replace(/\s/g, '_'),
        status: f.status,
        allowGifting: f.allowGifting,
        allowOrderVisibility: f.allowOrderVisibility,
        maskedAddress: f.maskedAddress,
        lastActive: f.lastActive
      };
    });

    res.json({ friends: formattedFriends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/social/friends/request
// @desc    Send friend request
// @access  Private
router.post('/friends/request', async (req, res) => {
  try {
    const { toId } = req.body;

    if (toId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId: toId },
          { userId: toId, friendId: req.user.id }
        ]
      }
    });

    if (existingFriend) {
      return res.status(400).json({ error: 'Friend relationship already exists' });
    }

    // Check for existing request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromId: req.user.id, toId },
          { fromId: toId, toId: req.user.id }
        ]
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        fromId: req.user.id,
        toId
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: toId,
        type: 'friend_request',
        fromId: req.user.id,
        message: `${req.user.fullName} sent you a friend request!`
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(toId).emit('notification:new', {
        userId: toId,
        type: 'friend_request',
        message: `${req.user.fullName} sent you a friend request!`
      });
    }

    res.status(201).json({ friendRequest });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/social/friends/accept
// @desc    Accept friend request
// @access  Private
router.post('/friends/accept', async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, toId: req.user.id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Create friendship (both directions)
    await prisma.friend.create({
      data: {
        userId: req.user.id,
        friendId: request.fromId,
        status: 'accepted'
      }
    });

    // Update request status
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: request.fromId,
        type: 'friend_request',
        fromId: req.user.id,
        message: `${req.user.fullName} accepted your friend request!`
      }
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/social/orders
// @desc    Get shared orders from friends
// @access  Private
router.get('/orders', async (req, res) => {
  try {
    // Get user's friends
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: req.user.id, status: 'accepted' },
          { friendId: req.user.id, status: 'accepted' }
        ]
      }
    });

    const friendIds = friends.map(f => f.userId === req.user.id ? f.friendId : f.userId);

    // Get shared orders from friends
    const sharedOrders = await prisma.sharedOrder.findMany({
      where: { userId: { in: friendIds } },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true }
        },
        reactions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders: sharedOrders });
  } catch (error) {
    console.error('Get shared orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/social/orders/share
// @desc    Share an order
// @access  Private (Customer)
router.post('/orders/share', async (req, res) => {
  try {
    const { orderId, items, total, image } = req.body;

    const sharedOrder = await prisma.sharedOrder.create({
      data: {
        userId: req.user.id,
        orderId,
        items,
        total: parseFloat(total),
        image
      }
    });

    res.status(201).json({ sharedOrder });
  } catch (error) {
    console.error('Share order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/social/orders/:id/react
// @desc    Add reaction to shared order
// @access  Private
router.post('/orders/:id/react', async (req, res) => {
  try {
    const { emoji } = req.body;
    const sharedOrderId = req.params.id;

    const sharedOrder = await prisma.sharedOrder.findUnique({
      where: { id: sharedOrderId },
      include: { reactions: true }
    });

    if (!sharedOrder) {
      return res.status(404).json({ error: 'Shared order not found' });
    }

    // Find or create reaction
    let reaction = sharedOrder.reactions.find(r => r.emoji === emoji);

    if (reaction) {
      // Toggle reaction
      if (reaction.userIds.includes(req.user.id)) {
        // Remove reaction
        await prisma.reaction.update({
          where: { id: reaction.id },
          data: {
            userIds: { set: reaction.userIds.filter(id => id !== req.user.id) },
            count: { decrement: 1 }
          }
        });
      } else {
        // Add reaction
        await prisma.reaction.update({
          where: { id: reaction.id },
          data: {
            userIds: { push: req.user.id },
            count: { increment: 1 }
          }
        });
      }
    } else {
      // Create new reaction
      await prisma.reaction.create({
        data: {
          sharedOrderId,
          emoji,
          userIds: [req.user.id],
          count: 1
        }
      });
    }

    res.json({ message: 'Reaction updated' });
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/social/gifts/send
// @desc    Send gift to friend
// @access  Private (Customer)
router.post('/gifts/send', async (req, res) => {
  try {
    const { friendId, items } = req.body;

    // Check if friendship exists
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId, status: 'accepted' },
          { userId: friendId, friendId: req.user.id, status: 'accepted' }
        ]
      }
    });

    if (!friendship) {
      return res.status(400).json({ error: 'You can only send gifts to friends' });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: friendId,
        type: 'gift_sent',
        fromId: req.user.id,
        message: `${req.user.fullName} sent you a surprise gift!`
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(friendId).emit('notification:new', {
        userId: friendId,
        type: 'gift_sent',
        message: `${req.user.fullName} sent you a surprise gift!`
      });
    }

    res.json({ message: 'Gift sent successfully' });
  } catch (error) {
    console.error('Send gift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/social/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        from: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/social/notifications/read
// @desc    Mark notifications as read
// @access  Private
router.post('/notifications/read', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/social/privacy
// @desc    Update privacy settings
// @access  Private
router.put('/privacy', async (req, res) => {
  try {
    const { shareOrdersWithFriends, allowSurpriseGifts, showMaskedAddress, visibilityLevel, allowedGiftingFriends } = req.body;

    const privacySettings = await prisma.privacySettings.upsert({
      where: { userId: req.user.id },
      update: {
        shareOrdersWithFriends,
        allowSurpriseGifts,
        showMaskedAddress,
        visibilityLevel,
        allowedGiftingFriends
      },
      create: {
        userId: req.user.id,
        shareOrdersWithFriends,
        allowSurpriseGifts,
        showMaskedAddress,
        visibilityLevel,
        allowedGiftingFriends
      }
    });

    res.json({ privacySettings });
  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/social/users/search
// @desc    Search users
// @access  Private
router.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user.id } },
          {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        loyaltyTier: true
      },
      take: 20
    });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
