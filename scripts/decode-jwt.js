const axios = require('axios');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5001'
};

// Test user credentials
const testUser = {
  email: 'testuser1@innkt.com',
  password: 'TestPassword123!'
};

async function decodeJWT() {
  try {
    // Login to get a real token
    console.log('🔐 Logging in to get JWT token...');
    const loginResponse = await axios.post(`${CONFIG.baseUrl}/api/auth/login`, testUser);
    
    if (!loginResponse.data.accessToken) {
      console.log('❌ Login failed: No access token received');
      return;
    }
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful!');
    console.log('Token:', token);
    console.log('');

    // Decode JWT token (without verification)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format');
      return;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('📋 JWT Header:');
    console.log(JSON.stringify(header, null, 2));
    console.log('');
    
    console.log('📋 JWT Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    // Check what fields the messaging service expects
    console.log('🔍 Expected fields by messaging service:');
    console.log('- userId:', payload.userId || payload.sub || payload.name || 'NOT FOUND');
    console.log('- username:', payload.username || payload.preferred_username || 'NOT FOUND');
    console.log('- displayName:', payload.displayName || payload.given_name || 'NOT FOUND');
    console.log('- avatar:', payload.avatar || 'NOT FOUND');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
decodeJWT();
