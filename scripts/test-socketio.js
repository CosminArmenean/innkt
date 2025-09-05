const { io } = require('socket.io-client');

// Test Socket.IO connection
const CONFIG = {
  messagingUrl: 'http://localhost:5004'
};

console.log('🔌 Testing Socket.IO Connection');
console.log('URL:', CONFIG.messagingUrl);
console.log('');

// Test with a valid JWT token
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiVGVzdFVzZXIxIiwiZW1haWwiOiJ0ZXN0dXNlcjFAaW5ua3QuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsImV4cCI6MTcyNTU0MjQwMCwiaXNzIjoiaW5ua3QtT2ZmaWNlciIsImF1ZCI6Imlubmt0LUFwcCJ9.test';

console.log('1️⃣ Testing Socket.IO connection with token...');

const socket = io(CONFIG.messagingUrl, {
  auth: {
    token: testToken
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server!');
  console.log('Socket ID:', socket.id);
  
  // Test sending a message
  socket.emit('test-message', { text: 'Hello from test client!' });
  console.log('📤 Sent test message');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('Error details:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

// Test without token
console.log('');
console.log('2️⃣ Testing Socket.IO connection without token...');

const socketNoAuth = io(CONFIG.messagingUrl, {
  transports: ['websocket', 'polling']
});

socketNoAuth.on('connect', () => {
  console.log('✅ Connected without authentication!');
  console.log('Socket ID:', socketNoAuth.id);
});

socketNoAuth.on('connect_error', (error) => {
  console.log('❌ Connection error (no auth):', error.message);
});

// Clean up after 10 seconds
setTimeout(() => {
  console.log('');
  console.log('🧹 Cleaning up...');
  socket.disconnect();
  socketNoAuth.disconnect();
  process.exit(0);
}, 10000);
