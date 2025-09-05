const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

const router = express.Router();

// Get messages for a conversation
router.get('/', async (req, res) => {
  try {
    const { conversationId, page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    const messages = await Message.getConversationMessages(conversationId, page, limit);
    const totalCount = await Message.countDocuments({ conversationId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: (page * limit) < totalCount
    });

  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get specific message
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: 'Not authorized to access this message' });
    }

    res.json({ message });

  } catch (error) {
    logger.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Edit message
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - message.timestamp.getTime() > editTimeLimit) {
      return res.status(400).json({ error: 'Message is too old to edit' });
    }

    message.content = content;
    await message.save();

    res.json({ message });

  } catch (error) {
    logger.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender or admin
    const conversation = await Conversation.findById(message.conversationId);
    const userParticipant = conversation.participants.find(p => p.userId === userId);
    
    if (message.senderId !== userId && (!userParticipant || userParticipant.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(id);

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only mark as read if user is not the sender
    if (message.senderId !== userId) {
      await message.markAsRead();
    }

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    logger.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Add reaction to message
router.post('/:id/reactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await message.addReaction(userId, emoji);

    res.json({ message: 'Reaction added successfully' });

  } catch (error) {
    logger.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/:id/reactions/:reactionId', async (req, res) => {
  try {
    const { id, reactionId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Find and remove the reaction
    const reaction = message.reactions.id(reactionId);
    if (!reaction || reaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to remove this reaction' });
    }

    reaction.remove();
    await message.save();

    res.json({ message: 'Reaction removed successfully' });

  } catch (error) {
    logger.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { query, conversationId, page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let searchFilter = {
      content: { $regex: query, $options: 'i' }
    };

    if (conversationId) {
      // Verify user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
        return res.status(403).json({ error: 'Not authorized to search this conversation' });
      }
      searchFilter.conversationId = conversationId;
    } else {
      // Search across all user's conversations
      const userConversations = await Conversation.find({
        'participants.userId': userId,
        isActive: true
      }).select('_id');
      
      searchFilter.conversationId = { $in: userConversations.map(c => c._id) };
    }

    const skip = (page - 1) * limit;
    const messages = await Message.find(searchFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('replyTo', 'content senderId')
      .lean();

    const totalCount = await Message.countDocuments(searchFilter);

    res.json({
      messages,
      totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: (page * limit) < totalCount
    });

  } catch (error) {
    logger.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

module.exports = router;

