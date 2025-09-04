const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { authenticateSocket } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { PresenceService } = require('../services/presenceService');
const { NotificationService } = require('../services/notificationService');
const logger = require('../utils/logger');

// Store active connections
const activeConnections = new Map();
const userRooms = new Map();

function setupSocketHandlers(io) {
  // Authentication middleware for Socket.IO
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const userInfo = socket.userInfo;
    
    logger.info(`User ${userId} connected with socket ${socket.id}`);

    // Store connection
    activeConnections.set(socket.id, {
      userId,
      userInfo,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);
    userRooms.set(userId, socket.id);

    // Set user online in presence service
    if (global.presenceService) {
      await global.presenceService.setUserOnline(userId, socket.id, userInfo);
      await global.presenceService.publishPresenceChange(userId, 'online', userInfo);
    }

    // Emit connection status to user's contacts
    emitUserStatus(io, userId, 'online');

    // Handle joining conversation rooms
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user is participant in conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        // Join conversation room
        socket.join(`conversation:${conversationId}`);
        
        // Update last seen
        await conversation.updateLastSeen(userId);
        
        // Mark messages as read
        await Message.updateMany(
          { 
            conversationId, 
            senderId: { $ne: userId },
            status: { $in: ['sent', 'delivered'] }
          },
          { status: 'read' }
        );

        // Update unread count
        conversation.unreadCount = 0;
        await conversation.save();

        socket.emit('joined_conversation', { conversationId });
        logger.info(`User ${userId} joined conversation ${conversationId}`);

      } catch (error) {
        logger.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left_conversation', { conversationId });
      logger.info(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', rateLimiter('message', 10, 60000), async (data) => {
      try {
        const { conversationId, content, type = 'text', replyTo, isEncrypted = false } = data;

        // Validate input
        if (!conversationId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
          socket.emit('error', { message: 'Not authorized to send messages to this conversation' });
          return;
        }

        // Create message
        const message = new Message({
          senderId: userId,
          conversationId,
          content,
          type,
          replyTo,
          isEncrypted,
          status: 'sent'
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Emit to conversation room
        const messageData = {
          id: message._id,
          senderId: message.senderId,
          senderProfile: {
            id: userId,
            username: userInfo.username,
            displayName: userInfo.displayName,
            avatar: userInfo.avatar
          },
          content: message.content,
          type: message.type,
          timestamp: message.timestamp,
          status: message.status,
          isEncrypted: message.isEncrypted,
          replyTo: message.replyTo,
          reactions: message.reactions
        };

        io.to(`conversation:${conversationId}`).emit('new_message', messageData);

        // Send notifications to offline participants
        if (global.notificationService) {
          await global.notificationService.sendMessageNotification(message, conversation, userInfo);
        }

        // Update unread count for other participants
        const otherParticipants = conversation.participants
          .filter(p => p.userId !== userId)
          .map(p => p.userId);

        for (const participantId of otherParticipants) {
          const participantSocket = userRooms.get(participantId);
          if (participantSocket) {
            io.to(`user:${participantId}`).emit('conversation_updated', {
              conversationId,
              lastMessage: messageData,
              unreadCount: conversation.unreadCount + 1
            });
          }
        }

        logger.info(`Message sent by ${userId} to conversation ${conversationId}`);

      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Verify user is participant in conversation
        const conversation = await Conversation.findById(message.conversationId);
        if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        await message.addReaction(userId, emoji);

        // Emit to conversation room
        io.to(`conversation:${message.conversationId}`).emit('reaction_added', {
          messageId,
          reaction: { userId, emoji, timestamp: new Date() }
        });

      } catch (error) {
        logger.error('Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        userInfo: { username: userInfo.username, displayName: userInfo.displayName }
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { userId });
    });

    // Handle presence updates
    socket.on('update_presence', (data) => {
      const { status } = data;
      emitUserStatus(io, userId, status);
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      logger.info(`User ${userId} disconnected: ${reason}`);
      
      // Remove from active connections
      activeConnections.delete(socket.id);
      userRooms.delete(userId);
      
      // Set user offline in presence service
      if (global.presenceService) {
        await global.presenceService.setUserOffline(userId, socket.id);
        await global.presenceService.publishPresenceChange(userId, 'offline', userInfo);
      }
      
      // Emit offline status
      emitUserStatus(io, userId, 'offline');
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [socketId, connection] of activeConnections.entries()) {
      if (now - connection.lastActivity > timeout) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
        activeConnections.delete(socketId);
        userRooms.delete(connection.userId);
        emitUserStatus(io, connection.userId, 'offline');
      }
    }
  }, 60000); // Check every minute
}

function emitUserStatus(io, userId, status) {
  // Emit to user's contacts (this would need to be implemented based on your user relationships)
  io.emit('user_status_changed', {
    userId,
    status,
    timestamp: new Date()
  });
}

module.exports = { setupSocketHandlers };
