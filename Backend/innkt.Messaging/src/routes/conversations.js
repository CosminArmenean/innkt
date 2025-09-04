const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's conversations
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    const conversations = await Conversation.getUserConversations(userId, page, limit);
    
    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.getUnreadCount(conv._id, userId);
        return {
          ...conv,
          unreadCount
        };
      })
    );

    res.json({
      conversations: conversationsWithUnread,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get specific conversation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    res.json({ conversation });

  } catch (error) {
    logger.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create direct conversation
router.post('/direct', async (req, res) => {
  try {
    const { userId: otherUserId } = req.body;
    const userId = req.user.userId;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    if (otherUserId === userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if direct conversation already exists
    let conversation = await Conversation.findDirectConversation(userId, otherUserId);
    
    if (!conversation) {
      conversation = await Conversation.createDirectConversation(userId, otherUserId);
    }

    res.status(201).json({ conversation });

  } catch (error) {
    logger.error('Error creating direct conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Create group conversation
router.post('/group', async (req, res) => {
  try {
    const { name, description, participants } = req.body;
    const userId = req.user.userId;

    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({ 
        error: 'Group name and at least 2 participants are required' 
      });
    }

    // Add creator to participants if not already included
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    const conversation = await Conversation.createGroupConversation(name, participants, userId);
    
    if (description) {
      conversation.description = description;
      await conversation.save();
    }

    res.status(201).json({ conversation });

  } catch (error) {
    logger.error('Error creating group conversation:', error);
    res.status(500).json({ error: 'Failed to create group conversation' });
  }
});

// Add participant to conversation
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: newUserId } = req.body;
    const userId = req.user.userId;

    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is admin
    const userParticipant = conversation.participants.find(p => p.userId === userId);
    if (!userParticipant || userParticipant.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add participants' });
    }

    await conversation.addParticipant(newUserId);
    
    res.json({ message: 'Participant added successfully' });

  } catch (error) {
    logger.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// Remove participant from conversation
router.delete('/:id/participants/:userId', async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is admin or removing themselves
    const userParticipant = conversation.participants.find(p => p.userId === userId);
    if (!userParticipant || (userParticipant.role !== 'admin' && userId !== targetUserId)) {
      return res.status(403).json({ error: 'Not authorized to remove this participant' });
    }

    await conversation.removeParticipant(targetUserId);
    
    res.json({ message: 'Participant removed successfully' });

  } catch (error) {
    logger.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Update conversation settings
router.put('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    const userId = req.user.userId;

    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is admin
    const userParticipant = conversation.participants.find(p => p.userId === userId);
    if (!userParticipant || userParticipant.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update settings' });
    }

    conversation.settings = { ...conversation.settings, ...settings };
    await conversation.save();
    
    res.json({ conversation });

  } catch (error) {
    logger.error('Error updating conversation settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Mark conversation as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark all messages as read
    await Message.updateMany(
      { 
        conversationId: id, 
        senderId: { $ne: userId },
        status: { $in: ['sent', 'delivered'] }
      },
      { status: 'read' }
    );

    // Update unread count
    conversation.unreadCount = 0;
    await conversation.save();

    res.json({ message: 'Conversation marked as read' });

  } catch (error) {
    logger.error('Error marking conversation as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;
