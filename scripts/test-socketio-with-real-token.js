const axios = require('axios');
const { io } = require('socket.io-client');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5001',
  messagingUrl: 'http://localhost:5004'
};

// Test user credentials
const testUser = {
  email: 'testuser1@innkt.com',
  password: 'TestPassword123!'
};

async function testSocketIOWithRealToken() {
  console.log('🔌 Testing Socket.IO with Real Authentication Token');
  console.log('==================================================');
  console.log('');

  try {
    // Step 1: Login to get a real token
    console.log('1️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post(`${CONFIG.baseUrl}/api/auth/login`, testUser);
    
    if (!loginResponse.data.accessToken) {
      console.log('❌ Login failed: No access token received');
      return;
    }
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('');

    // Step 2: Test Socket.IO connection with real token
    console.log('2️⃣ Testing Socket.IO connection with real token...');
    
    const socket = io(CONFIG.messagingUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server!');
      console.log('Socket ID:', socket.id);
      
      // Test sending a message
      socket.emit('test-message', { 
        text: 'Hello from authenticated client!',
        timestamp: new Date().toISOString()
      });
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

    // Listen for any incoming messages
    socket.onAny((event, ...args) => {
      console.log('📥 Received event:', event, args);
    });

    // Keep connection alive for testing
    console.log('⏳ Keeping connection alive for 15 seconds...');
    setTimeout(() => {
      console.log('');
      console.log('🧹 Cleaning up...');
      socket.disconnect();
      process.exit(0);
    }, 15000);

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testSocketIOWithRealToken();
