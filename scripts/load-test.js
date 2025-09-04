const axios = require('axios');
const { io } = require('socket.io-client');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5001',
  messagingUrl: 'http://localhost:5003',
  wsUrl: 'ws://localhost:5003',
  concurrentUsers: 10,
  messagesPerUser: 5,
  testDuration: 30000 // 30 seconds
};

// Test results
const results = {
  totalUsers: 0,
  successfulLogins: 0,
  failedLogins: 0,
  messagesSent: 0,
  messagesReceived: 0,
  errors: [],
  responseTimes: [],
  startTime: Date.now()
};

// Generate test user data
function generateTestUser(index) {
  return {
    email: `testuser${index}@innkt.com`,
    firstName: `Test`,
    lastName: `User${index}`,
    password: 'TestPassword123!',
    acceptTerms: true,
    acceptPrivacyPolicy: true,
    language: 'en',
    theme: 'light'
  };
}

// Simulate user registration
async function registerUser(userData) {
  try {
    const response = await axios.post(`${CONFIG.baseUrl}/api/auth/register`, userData, {
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

// Simulate user login
async function loginUser(userData) {
  try {
    const startTime = Date.now();
    const response = await axios.post(`${CONFIG.baseUrl}/api/auth/login`, {
      email: userData.email,
      password: userData.password
    }, {
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    results.responseTimes.push(responseTime);
    
    if (response.data.accessToken) {
      results.successfulLogins++;
      return { success: true, token: response.data.accessToken, responseTime };
    } else {
      results.failedLogins++;
      return { success: false, error: 'No token received' };
    }
  } catch (error) {
    results.failedLogins++;
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

// Simulate messaging
async function testMessaging(token, userId) {
  return new Promise((resolve) => {
    const socket = io(CONFIG.messagingUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    let messagesSent = 0;
    let messagesReceived = 0;
    
    socket.on('connect', () => {
      console.log(`User ${userId}: Connected to messaging service`);
      
      // Send test messages
      const sendMessage = () => {
        if (messagesSent < CONFIG.messagesPerUser) {
          const message = {
            content: `Test message ${messagesSent + 1} from user ${userId}`,
            conversationId: 'test-conversation',
            timestamp: new Date().toISOString()
          };
          
          socket.emit('send_message', message);
          messagesSent++;
          results.messagesSent++;
          
          setTimeout(sendMessage, 1000); // Send message every second
        } else {
          setTimeout(() => {
            socket.disconnect();
            resolve({ messagesSent, messagesReceived });
          }, 2000);
        }
      };
      
      sendMessage();
    });
    
    socket.on('new_message', (message) => {
      messagesReceived++;
      results.messagesReceived++;
    });
    
    socket.on('connect_error', (error) => {
      console.error(`User ${userId}: Socket.IO connection error:`, error);
      results.errors.push(`User ${userId}: ${error.message}`);
      resolve({ messagesSent, messagesReceived, error: error.message });
    });
    
    socket.on('disconnect', () => {
      console.log(`User ${userId}: Disconnected from messaging service`);
    });
  });
}

// Simulate API calls
async function testApiCalls(token) {
  const apiTests = [
    { url: '/api/users/profile', method: 'GET' },
    { url: '/api/conversations', method: 'GET' },
    { url: '/api/messages', method: 'GET' }
  ];
  
  const results = [];
  
  for (const test of apiTests) {
    try {
      const startTime = Date.now();
      const response = await axios({
        method: test.method,
        url: `${CONFIG.messagingUrl}${test.url}`,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      results.push({ 
        endpoint: test.url, 
        success: true, 
        status: response.status, 
        responseTime 
      });
    } catch (error) {
      results.push({ 
        endpoint: test.url, 
        success: false, 
        error: error.response?.status || error.message 
      });
    }
  }
  
  return results;
}

// Simulate a single user session
async function simulateUser(userIndex) {
  const userData = generateTestUser(userIndex);
  console.log(`Starting simulation for user ${userIndex}: ${userData.email}`);
  
  try {
    // Register user (might fail if already exists)
    const registration = await registerUser(userData);
    if (!registration.success && !String(registration.error).includes('already exists')) {
      console.log(`User ${userIndex}: Registration failed:`, registration.error);
    }
    
    // Login user
    const login = await loginUser(userData);
    if (!login.success) {
      console.log(`User ${userIndex}: Login failed:`, login.error);
      return;
    }
    
    console.log(`User ${userIndex}: Successfully logged in`);
    
    // Test API calls
    const apiResults = await testApiCalls(login.token);
    console.log(`User ${userIndex}: API tests completed`);
    
    // Test messaging
    const messagingResults = await testMessaging(login.token, userIndex);
    console.log(`User ${userIndex}: Messaging test completed - Sent: ${messagingResults.messagesSent}, Received: ${messagingResults.messagesReceived}`);
    
  } catch (error) {
    console.error(`User ${userIndex}: Simulation error:`, error);
    results.errors.push(`User ${userIndex}: ${error.message}`);
  }
}

// Main load test function
async function runLoadTest() {
  console.log('🚀 Starting INNKT Platform Load Test');
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent Users: ${CONFIG.concurrentUsers}`);
  console.log(`   - Messages per User: ${CONFIG.messagesPerUser}`);
  console.log(`   - Test Duration: ${CONFIG.testDuration / 1000} seconds`);
  console.log(`   - Officer API: ${CONFIG.baseUrl}`);
  console.log(`   - Messaging API: ${CONFIG.messagingUrl}`);
  console.log('');
  
  results.startTime = Date.now();
  results.totalUsers = CONFIG.concurrentUsers;
  
  // Create concurrent user simulations
  const userPromises = [];
  for (let i = 1; i <= CONFIG.concurrentUsers; i++) {
    userPromises.push(simulateUser(i));
  }
  
  // Wait for all users to complete or timeout
  const timeoutPromise = new Promise(resolve => 
    setTimeout(resolve, CONFIG.testDuration)
  );
  
  await Promise.race([
    Promise.all(userPromises),
    timeoutPromise
  ]);
  
  // Calculate final results
  const endTime = Date.now();
  const totalTime = endTime - results.startTime;
  const avgResponseTime = results.responseTimes.length > 0 
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
    : 0;
  
  console.log('\n📈 LOAD TEST RESULTS:');
  console.log('='.repeat(50));
  console.log(`⏱️  Total Test Duration: ${(totalTime / 1000).toFixed(2)} seconds`);
  console.log(`👥 Total Users: ${results.totalUsers}`);
  console.log(`✅ Successful Logins: ${results.successfulLogins}`);
  console.log(`❌ Failed Logins: ${results.failedLogins}`);
  console.log(`📤 Messages Sent: ${results.messagesSent}`);
  console.log(`📥 Messages Received: ${results.messagesReceived}`);
  console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`🚨 Total Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  // Performance metrics
  const successRate = (results.successfulLogins / results.totalUsers) * 100;
  const messageDeliveryRate = results.messagesReceived > 0 
    ? (results.messagesReceived / results.messagesSent) * 100 
    : 0;
  
  console.log('\n📊 Performance Metrics:');
  console.log(`   - Login Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`   - Message Delivery Rate: ${messageDeliveryRate.toFixed(2)}%`);
  console.log(`   - Users per Second: ${(results.totalUsers / (totalTime / 1000)).toFixed(2)}`);
  console.log(`   - Messages per Second: ${(results.messagesSent / (totalTime / 1000)).toFixed(2)}`);
  
  // Performance assessment
  console.log('\n🎯 Performance Assessment:');
  if (successRate >= 95 && avgResponseTime < 1000) {
    console.log('   ✅ EXCELLENT: System performing optimally');
  } else if (successRate >= 90 && avgResponseTime < 2000) {
    console.log('   ✅ GOOD: System performing well');
  } else if (successRate >= 80 && avgResponseTime < 5000) {
    console.log('   ⚠️  FAIR: System needs optimization');
  } else {
    console.log('   ❌ POOR: System requires immediate attention');
  }
  
  console.log('\n🏁 Load test completed!');
}

// Run the load test
if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, CONFIG };
