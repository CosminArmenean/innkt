const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const redis = require('redis');
require('dotenv').config();

const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'innkt-messaging',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', (req, res) => {
  res.json({ 
    status: 'ready', 
    service: 'innkt-messaging',
    timestamp: new Date().toISOString()
  });
});

// Basic socket connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
  
  // Echo test
  socket.on('test', (data) => {
    socket.emit('test-response', { message: 'Echo: ' + data.message });
  });
});

// Database connection
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/innkt_messaging';
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Redis connection
async function connectRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = new redis.createClient({ url: redisUrl });
    
    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });
    
    client.on('connect', () => {
      logger.info('✅ Redis client connected');
    });
    
    client.on('ready', () => {
      logger.info('✅ Redis client ready');
    });
    
    await client.connect();
    return client;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    logger.info('🚀 Starting INNKT Messaging Service...');
    
    // Connect to databases
    await connectDatabase();
    const redisClient = await connectRedis();
    
    // Store redis client in app for potential future use
    app.locals.redis = redisClient;
    
    const PORT = process.env.PORT || 5003;
    server.listen(PORT, () => {
      logger.info(`✅ INNKT Messaging Service running on port ${PORT}`);
      logger.info(`✅ Health check available at http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start the server
startServer();
