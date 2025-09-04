const axios = require('axios');

// Configuration
const CONFIG = {
  officerUrl: 'http://localhost:5001',
  messagingUrl: 'http://localhost:5003',
  concurrentRequests: 20,
  testDuration: 15000 // 15 seconds
};

// Test results
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: Date.now()
};

// Test Officer API health endpoint
async function testOfficerHealth() {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${CONFIG.officerUrl}/health`, {
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    
    results.responseTimes.push(responseTime);
    results.successfulRequests++;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    results.failedRequests++;
    results.errors.push(`Officer Health: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test Messaging API health endpoint
async function testMessagingHealth() {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${CONFIG.messagingUrl}/health`, {
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    
    results.responseTimes.push(responseTime);
    results.successfulRequests++;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    results.failedRequests++;
    results.errors.push(`Messaging Health: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test Messaging API with authentication (should fail with proper error)
async function testMessagingAuth() {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${CONFIG.messagingUrl}/api/conversations`, {
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    
    results.responseTimes.push(responseTime);
    results.successfulRequests++;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    // This should fail with 401/403, which is expected
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const responseTime = Date.now() - Date.now();
      results.responseTimes.push(responseTime);
      results.successfulRequests++;
      
      return {
        success: true,
        status: error.response.status,
        responseTime,
        data: error.response.data,
        expected: true
      };
    } else {
      results.failedRequests++;
      results.errors.push(`Messaging Auth: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run a single test cycle
async function runTestCycle() {
  const tests = [
    testOfficerHealth,
    testMessagingHealth,
    testMessagingAuth
  ];
  
  const cycleResults = [];
  
  for (const test of tests) {
    const result = await test();
    cycleResults.push(result);
    results.totalRequests++;
  }
  
  return cycleResults;
}

// Main load test function
async function runLoadTest() {
  console.log('🚀 Starting INNKT Platform Simple Load Test');
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent Requests: ${CONFIG.concurrentRequests}`);
  console.log(`   - Test Duration: ${CONFIG.testDuration / 1000} seconds`);
  console.log(`   - Officer API: ${CONFIG.officerUrl}`);
  console.log(`   - Messaging API: ${CONFIG.messagingUrl}`);
  console.log('');
  
  results.startTime = Date.now();
  
  // Create concurrent test cycles
  const testPromises = [];
  for (let i = 0; i < CONFIG.concurrentRequests; i++) {
    testPromises.push(runTestCycle());
  }
  
  // Wait for all tests to complete or timeout
  const timeoutPromise = new Promise(resolve => 
    setTimeout(resolve, CONFIG.testDuration)
  );
  
  await Promise.race([
    Promise.all(testPromises),
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
  console.log(`📊 Total Requests: ${results.totalRequests}`);
  console.log(`✅ Successful Requests: ${results.successfulRequests}`);
  console.log(`❌ Failed Requests: ${results.failedRequests}`);
  console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`🚨 Total Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.slice(0, 10).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
    if (results.errors.length > 10) {
      console.log(`   ... and ${results.errors.length - 10} more errors`);
    }
  }
  
  // Performance metrics
  const successRate = results.totalRequests > 0 
    ? (results.successfulRequests / results.totalRequests) * 100 
    : 0;
  const requestsPerSecond = results.totalRequests / (totalTime / 1000);
  
  console.log('\n📊 Performance Metrics:');
  console.log(`   - Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`   - Requests per Second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`   - Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  
  // Performance assessment
  console.log('\n🎯 Performance Assessment:');
  if (successRate >= 95 && avgResponseTime < 500) {
    console.log('   ✅ EXCELLENT: System performing optimally');
  } else if (successRate >= 90 && avgResponseTime < 1000) {
    console.log('   ✅ GOOD: System performing well');
  } else if (successRate >= 80 && avgResponseTime < 2000) {
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
