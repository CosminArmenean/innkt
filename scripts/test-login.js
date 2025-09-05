const axios = require('axios');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5001',
  messagingUrl: 'http://localhost:5004'
};

// Test users (these should exist from previous tests)
const testUsers = [
  {
    email: 'testuser1@innkt.com',
    password: 'TestPassword123!'
  },
  {
    email: 'testuser2@innkt.com', 
    password: 'TestPassword123!'
  },
  {
    email: 'testuser3@innkt.com',
    password: 'TestPassword123!'
  }
];

async function testLogin(user) {
  try {
    console.log(`🔐 Testing login for: ${user.email}`);
    const response = await axios.post(`${CONFIG.baseUrl}/api/auth/login`, user);
    
    if (response.data.accessToken) {
      console.log(`✅ Login successful for ${user.email}`);
      console.log(`   Token: ${response.data.accessToken.substring(0, 50)}...`);
      return { success: true, token: response.data.accessToken, user: user.email };
    } else {
      console.log(`❌ Login failed for ${user.email}: No token received`);
      return { success: false, user: user.email };
    }
  } catch (error) {
    console.log(`❌ Login failed for ${user.email}: ${error.response?.data?.error || error.message}`);
    return { success: false, user: user.email, error: error.response?.data?.error || error.message };
  }
}

async function testAllLogins() {
  console.log('🚀 Testing User Logins');
  console.log('========================');
  console.log('');

  const results = [];
  
  for (const user of testUsers) {
    const result = await testLogin(user);
    results.push(result);
    console.log('');
  }

  console.log('📊 LOGIN RESULTS:');
  console.log('==================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful logins: ${successful.length}`);
  console.log(`❌ Failed logins: ${failed.length}`);
  console.log('');

  if (successful.length > 0) {
    console.log('🎉 WORKING USER CREDENTIALS:');
    console.log('============================');
    successful.forEach(result => {
      console.log(`📧 Email: ${result.user}`);
      console.log(`🔑 Password: TestPassword123!`);
      console.log('');
    });
    
    console.log('🌐 Access the frontend at: http://localhost:8080');
    console.log('   Use any of the above credentials to log in!');
  } else {
    console.log('❌ No working credentials found. You may need to register users first.');
  }
}

// Run the test
testAllLogins();
