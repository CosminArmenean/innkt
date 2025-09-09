const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

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
    timestamp: new Date().toISOString(),
    version: 'ultra-minimal'
  });
});

app.get('/health/ready', (req, res) => {
  res.json({ 
    status: 'ready', 
    service: 'innkt-messaging',
    timestamp: new Date().toISOString(),
    version: 'ultra-minimal'
  });
});

// Basic socket connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  
  // Echo test
  socket.on('test', (data) => {
    socket.emit('test-response', { message: 'Echo: ' + data.message });
  });
});

// Start server
const PORT = process.env.PORT || 5003;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ INNKT Messaging Service (Ultra-Minimal) running on port ${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
