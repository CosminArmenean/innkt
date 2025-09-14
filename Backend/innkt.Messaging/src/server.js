const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const redis = require('redis');
require('dotenv').config();

const { setupSocketHandlers } = require('./socket/socketHandlers');
const { setupRoutes } = require('./routes');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { setupMiddleware } = require('./middleware');
const { PresenceService } = require('./services/presenceService');
const { NotificationService } = require('./services/notificationService');
const { MediaService } = require('./services/mediaService');
const { EncryptionService } = require('./services/encryptionService');
const { KeyManagementService } = require('./services/keyManagementService');
const { AnalyticsService } = require('./services/analyticsService');
const { BackupService } = require('./services/backupService');
// const KafkaService = require('./services/kafkaService'); // Temporarily disabled
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/innkt_messaging?authSource=admin';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Global variables
global.io = io;
global.redisClient = null;
global.kafkaService = null;
global.presenceService = null;
global.notificationService = null;
global.mediaService = null;
global.encryptionService = null;
global.keyManagementService = null;
global.analyticsService = null;
global.backupService = null;

async function startServer() {
  try {
    // Setup middleware
    setupMiddleware(app);

    // Connect to databases
    await connectDatabase(MONGODB_URI);
    global.redisClient = await connectRedis(REDIS_URL);

    // Initialize Kafka service (temporarily disabled)
    logger.info('⚠️ Kafka service temporarily disabled for debugging');
    global.kafkaService = null;

    // Initialize services
    global.presenceService = new PresenceService(global.redisClient);
    global.notificationService = new NotificationService(global.redisClient, global.kafkaService);
    global.mediaService = new MediaService();
    global.encryptionService = new EncryptionService();
    global.keyManagementService = new KeyManagementService(global.redisClient);
    global.analyticsService = new AnalyticsService(global.redisClient);
    global.backupService = new BackupService(global.redisClient, mongoose.connection);

    // Setup routes
    setupRoutes(app);

    // Setup Socket.IO handlers
    setupSocketHandlers(io);

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Messaging Service running on port ${PORT}`);
      logger.info(`📡 Socket.IO server ready for connections`);
      logger.info(`🔗 MongoDB connected: ${MONGODB_URI}`);
      logger.info(`🔴 Redis connected: ${REDIS_URL}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close Socket.IO server
    io.close(() => {
      logger.info('Socket.IO server closed');
    });

    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close database connections
    if (global.redisClient) {
      await global.redisClient.quit();
      logger.info('Redis connection closed');
    }

    // Close Kafka service
    if (global.kafkaService) {
      await global.kafkaService.disconnect();
      logger.info('Kafka service disconnected');
    }

    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
