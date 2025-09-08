const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const OFFICER_URL = 'http://localhost:5001';
const MESSAGING_URL = 'http://localhost:5003';

async function testCompleteMessaging() {
  console.log('🚀 Starting complete messaging test...');
  
  try {
    // Step 1: Login to get token
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${OFFICER_URL}/api/auth/login`, {
      Email: 'testuser@innkt.com',
      Password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, token obtained');
    
    // Step 2: Test messaging API
    console.log('📡 Step 2: Testing messaging API...');
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get conversations
    const conversationsResponse = await axios.get(`${MESSAGING_URL}/api/conversations`, { headers });
    console.log('✅ Conversations API working:', conversationsResponse.data);
    
    // Step 3: Test Socket.IO connection
    console.log('🔌 Step 3: Testing Socket.IO connection...');
    const socket = io(MESSAGING_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('✅ Socket.IO connected successfully!');
        console.log('🆔 Socket ID:', socket.id);
        
        // Step 4: Test sending a message (this will fail without a conversation, but we can see the error)
        console.log('📤 Step 4: Testing message send...');
        socket.emit('send_message', {
          conversationId: 'test-conversation-id',
          content: 'Hello from complete test!',
          type: 'text'
        });
        
        // Wait a bit then disconnect
        setTimeout(() => {
          console.log('🏁 Test completed successfully!');
          socket.disconnect();
          resolve();
        }, 3000);
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection failed:', error.message);
        reject(error);
      });
      
      socket.on('error', (error) => {
        console.log('⚠️ Socket error (expected without conversation):', error);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
      });
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testCompleteMessaging()
  .then(() => {
    console.log('🎉 All messaging tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
