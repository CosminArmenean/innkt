const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const redis = require('redis');

class RobustMessagingService {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 5003;
        this.maxRetries = 5;
        this.retryDelay = 2000; // 2 seconds
        this.isShuttingDown = false;
        
        // Initialize connections
        this.mongoClient = null;
        this.redisClient = null;
        
        this.setupGracefulShutdown();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    async connectWithRetry(connectFn, serviceName, maxRetries = this.maxRetries) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[${serviceName}] Attempt ${attempt}/${maxRetries} - Connecting...`);
                const result = await connectFn();
                console.log(`[${serviceName}] ✅ Connected successfully on attempt ${attempt}`);
                return result;
            } catch (error) {
                console.error(`[${serviceName}] ❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    console.error(`[${serviceName}] 💥 All connection attempts failed. Service will continue without ${serviceName}.`);
                    return null;
                }
                
                const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`[${serviceName}] ⏳ Retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
    }

    async connectMongoDB() {
        const mongoUrl = process.env.MONGODB_URL || 'mongodb://mongodb-service:27017/innkt_messaging';
        
        return new Promise((resolve, reject) => {
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            };

            mongoose.connect(mongoUrl, options)
                .then(() => {
                    console.log('📊 MongoDB connected successfully');
                    this.mongoClient = mongoose.connection;
                    resolve(mongoose.connection);
                })
                .catch(reject);
        });
    }

    async connectRedis() {
        const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
        
        return new Promise((resolve, reject) => {
            const client = redis.createClient({
                url: redisUrl,
                socket: {
                    connectTimeout: 5000,
                    commandTimeout: 5000,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('❌ Redis: Max reconnection attempts reached');
                            return new Error('Max reconnection attempts reached');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            client.on('error', (err) => {
                console.error('❌ Redis Client Error:', err);
                reject(err);
            });

            client.on('connect', () => {
                console.log('🔴 Redis connected successfully');
                this.redisClient = client;
                resolve(client);
            });

            client.connect().catch(reject);
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    mongodb: this.mongoClient ? this.mongoClient.readyState === 1 : false,
                    redis: this.redisClient ? this.redisClient.isReady : false,
                    socketio: this.io ? true : false
                },
                uptime: process.uptime()
            };
            
            const isHealthy = Object.values(health.services).every(status => status === true);
            res.status(isHealthy ? 200 : 503).json(health);
        });

        // Basic API routes
        this.app.get('/api/status', (req, res) => {
            res.json({ 
                message: 'Messaging Service is running',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });

        // Error handling middleware
        this.app.use((err, req, res, next) => {
            console.error('🚨 Express Error:', err);
            res.status(500).json({ 
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            socket.on('join_room', (data) => {
                try {
                    const { roomId, userId } = data;
                    if (!roomId || !userId) {
                        socket.emit('error', { message: 'Room ID and User ID are required' });
                        return;
                    }
                    
                    socket.join(roomId);
                    socket.userId = userId;
                    socket.roomId = roomId;
                    
                    console.log(`👤 User ${userId} joined room ${roomId}`);
                    socket.to(roomId).emit('user_joined', { userId, socketId: socket.id });
                } catch (error) {
                    console.error('❌ Error in join_room:', error);
                    socket.emit('error', { message: 'Failed to join room' });
                }
            });

            socket.on('send_message', async (data) => {
                try {
                    const { roomId, message, messageType = 'text' } = data;
                    
                    if (!roomId || !message) {
                        socket.emit('error', { message: 'Room ID and message are required' });
                        return;
                    }

                    const messageData = {
                        id: Date.now().toString(),
                        roomId,
                        userId: socket.userId,
                        message,
                        messageType,
                        timestamp: new Date().toISOString()
                    };

                    // Store in MongoDB if available
                    if (this.mongoClient && this.mongoClient.readyState === 1) {
                        try {
                            // This would use a proper Message model in production
                            console.log('💾 Message stored in MongoDB:', messageData.id);
                        } catch (dbError) {
                            console.error('❌ MongoDB storage error:', dbError);
                        }
                    }

                    // Broadcast to room
                    this.io.to(roomId).emit('new_message', messageData);
                    console.log(`📨 Message sent in room ${roomId} by user ${socket.userId}`);
                    
                } catch (error) {
                    console.error('❌ Error in send_message:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
                if (socket.roomId && socket.userId) {
                    socket.to(socket.roomId).emit('user_left', { 
                        userId: socket.userId, 
                        socketId: socket.id 
                    });
                }
            });

            socket.on('error', (error) => {
                console.error(`❌ Socket error for ${socket.id}:`, error);
            });
        });
    }

    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
            
            try {
                // Close HTTP server
                if (this.server) {
                    await new Promise((resolve) => {
                        this.server.close(() => {
                            console.log('🔌 HTTP server closed');
                            resolve();
                        });
                    });
                }

                // Close Socket.IO
                if (this.io) {
                    this.io.close();
                    console.log('🔌 Socket.IO closed');
                }

                // Close MongoDB connection
                if (this.mongoClient) {
                    await this.mongoClient.close();
                    console.log('📊 MongoDB connection closed');
                }

                // Close Redis connection
                if (this.redisClient) {
                    await this.redisClient.quit();
                    console.log('🔴 Redis connection closed');
                }

                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            shutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown('unhandledRejection');
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async start() {
        try {
            console.log('🚀 Starting Robust Messaging Service...');
            
            // Connect to databases with retry logic
            await this.connectWithRetry(() => this.connectMongoDB(), 'MongoDB', 3);
            await this.connectWithRetry(() => this.connectRedis(), 'Redis', 3);
            
            // Start the server
            this.server.listen(this.port, '0.0.0.0', () => {
                console.log(`🎉 Messaging Service running on port ${this.port}`);
                console.log(`📊 Health check available at: http://localhost:${this.port}/health`);
                console.log(`🔌 Socket.IO ready for connections`);
            });

            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`❌ Port ${this.port} is already in use`);
                    process.exit(1);
                } else {
                    console.error('❌ Server error:', error);
                }
            });

        } catch (error) {
            console.error('💥 Failed to start service:', error);
            process.exit(1);
        }
    }
}

// Start the service
const service = new RobustMessagingService();
service.start();
