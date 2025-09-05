const { io } = require('socket.io-client');

console.log('🔍 Debugging Socket.IO Connection');
console.log('==================================');

// Test 1: Basic connection without auth
console.log('1️⃣ Testing basic connection without authentication...');
const socket1 = io('http://localhost:5004', {
  transports: ['polling']
});

socket1.on('connect', () => {
  console.log('✅ Basic connection successful!');
  socket1.disconnect();
});

socket1.on('connect_error', (error) => {
  console.log('❌ Basic connection failed:', error.message);
});

// Test 2: Connection with invalid token
setTimeout(() => {
  console.log('\n2️⃣ Testing connection with invalid token...');
  const socket2 = io('http://localhost:5004', {
    auth: {
      token: 'invalid-token'
    },
    transports: ['polling']
  });

  socket2.on('connect', () => {
    console.log('✅ Invalid token connection successful (unexpected)!');
    socket2.disconnect();
  });

  socket2.on('connect_error', (error) => {
    console.log('❌ Invalid token connection failed (expected):', error.message);
  });

  // Test 3: Connection with real token
  setTimeout(async () => {
    console.log('\n3️⃣ Testing connection with real token...');
    
    try {
      const axios = require('axios');
      const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
        email: 'testuser1@innkt.com',
        password: 'TestPassword123!'
      });
      
      const token = loginResponse.data.accessToken;
      console.log('✅ Got real token:', token.substring(0, 50) + '...');
      
      const socket3 = io('http://localhost:5004', {
        auth: {
          token: token
        },
        transports: ['polling']
      });

      socket3.on('connect', () => {
        console.log('✅ Real token connection successful!');
        console.log('Socket ID:', socket3.id);
        socket3.disconnect();
      });

      socket3.on('connect_error', (error) => {
        console.log('❌ Real token connection failed:', error.message);
        console.log('Error details:', error);
      });

    } catch (error) {
      console.log('❌ Failed to get real token:', error.message);
    }
    
  }, 2000);
  
}, 2000);

// Clean up after 10 seconds
setTimeout(() => {
  console.log('\n🧹 Cleaning up...');
  process.exit(0);
}, 10000);
