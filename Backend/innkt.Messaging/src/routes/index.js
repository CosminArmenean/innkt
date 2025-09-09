const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const conversationRoutes = require('./conversations');
const messageRoutes = require('./messages');
const userRoutes = require('./users');
const fileRoutes = require('./files');
const notificationRoutes = require('./notifications');
// const pushNotificationRoutes = require('./pushNotifications'); // Temporarily disabled
const groupChatRoutes = require('./groupChat');
const fileUploadRoutes = require('./fileUpload');
const analyticsRoutes = require('./analytics');
const backupRoutes = require('./backup');

function setupRoutes(app) {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'innkt-messaging',
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  app.use('/api/conversations', authenticateToken, conversationRoutes);
  app.use('/api/messages', authenticateToken, messageRoutes);
  app.use('/api/users', authenticateToken, userRoutes);
  app.use('/api/files', authenticateToken, fileRoutes);
  app.use('/api/notifications', authenticateToken, notificationRoutes);
  // app.use('/api/push-notifications', pushNotificationRoutes); // Temporarily disabled
  app.use('/api/group-chat', authenticateToken, groupChatRoutes);
  app.use('/api/file-upload', authenticateToken, fileUploadRoutes);
  app.use('/api/analytics', authenticateToken, analyticsRoutes);
  app.use('/api/backup', authenticateToken, backupRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

module.exports = { setupRoutes };
