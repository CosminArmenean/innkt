const axios = require('axios');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5001',
  messagingUrl: 'http://localhost:5004'
};

// Test user data
const testUser = {
  email: 'testuser1@innkt.com',
  firstName: 'Test',
  lastName: 'User1',
  password: 'TestPassword123!',
  acceptTerms: true,
  acceptPrivacyPolicy: true,
  language: 'en',
  theme: 'light'
};

async function testUserRegistration() {
  console.log('🚀 Testing User Registration and Login');
  console.log('📧 Email:', testUser.email);
  console.log('🔑 Password:', testUser.password);
  console.log('');

  try {
    // Test registration
    console.log('1️⃣ Registering user...');
    const registrationResponse = await axios.post(`${CONFIG.baseUrl}/api/auth/register`, testUser);
    console.log('✅ Registration successful!');
    console.log('Response:', registrationResponse.data);
    console.log('');

    // Test login
    console.log('2️⃣ Logging in user...');
    const loginResponse = await axios.post(`${CONFIG.baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResponse.data.accessToken) {
      console.log('✅ Login successful!');
      console.log('Access Token:', loginResponse.data.accessToken.substring(0, 50) + '...');
      console.log('');

      // Test messaging service
      console.log('3️⃣ Testing messaging service...');
      const messagingResponse = await axios.get(`${CONFIG.messagingUrl}/health`);
      console.log('✅ Messaging service accessible!');
      console.log('Response:', messagingResponse.data);
      console.log('');

      console.log('🎉 ALL TESTS PASSED!');
      console.log('');
      console.log('📋 USER CREDENTIALS FOR LOGIN:');
      console.log('   Email: testuser1@innkt.com');
      console.log('   Password: TestPassword123!');
      console.log('');
      console.log('🌐 Access the frontend at: http://localhost:8080');

    } else {
      console.log('❌ Login failed: No access token received');
      console.log('Response:', loginResponse.data);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.log('This might be because the user already exists. Try logging in instead.');
    }
  }
}

// Run the test
testUserRegistration();
