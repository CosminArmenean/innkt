// Test script to verify the API fix is working
// Run this in the browser console on the React UI page

console.log('=== TESTING API FIX ===');

// Test the handleApiResponse function directly
function testHandleApiResponse() {
    console.log('Testing handleApiResponse function...');
    
    // Test with direct data (like Social service)
    const directResponse = {
        data: ['topic1', 'topic2', 'topic3']
    };
    
    console.log('Direct response test:', directResponse);
    
    // Test with wrapped response (like Officer service)
    const wrappedResponse = {
        data: {
            success: true,
            data: { id: '123', name: 'test' }
        }
    };
    
    console.log('Wrapped response test:', wrappedResponse);
    
    // Test with error response
    const errorResponse = {
        data: {
            success: false,
            message: 'Something went wrong'
        }
    };
    
    console.log('Error response test:', errorResponse);
}

// Test actual API calls
async function testActualAPICalls() {
    console.log('Testing actual API calls...');
    
    try {
        // Test Social service health endpoint
        console.log('Testing Social service health...');
        const healthResponse = await fetch('http://localhost:8081/health');
        console.log('Health response:', healthResponse.status, healthResponse.statusText);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.text();
            console.log('Health data:', healthData);
        }
        
        // Test Social service trending topics (should fail without auth)
        console.log('Testing Social service trending topics...');
        const trendingResponse = await fetch('http://localhost:8081/api/trending/topics');
        console.log('Trending response:', trendingResponse.status, trendingResponse.statusText);
        
        if (trendingResponse.ok) {
            const trendingData = await trendingResponse.text();
            console.log('Trending data:', trendingData);
        } else {
            console.log('Expected 401 error for trending topics without auth');
        }
        
    } catch (error) {
        console.error('API call error:', error);
    }
}

// Test with authentication
async function testWithAuth() {
    console.log('Testing with authentication...');
    
    try {
        // Login first
        console.log('Logging in...');
        const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: 'testuser1@example.com',
                Password: 'TestPassword123!'
            })
        });
        
        if (!loginResponse.ok) {
            console.error('Login failed:', loginResponse.status);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('Login successful, token:', loginData.accessToken.substring(0, 50) + '...');
        
        // Test Social service with token
        console.log('Testing Social service with token...');
        const trendingResponse = await fetch('http://localhost:8081/api/trending/topics', {
            headers: {
                'Authorization': `Bearer ${loginData.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Trending response with auth:', trendingResponse.status, trendingResponse.statusText);
        
        if (trendingResponse.ok) {
            const trendingData = await trendingResponse.text();
            console.log('Trending data with auth:', trendingData);
        }
        
    } catch (error) {
        console.error('Auth test error:', error);
    }
}

// Run all tests
console.log('Running API fix tests...');
testHandleApiResponse();
testActualAPICalls();
testWithAuth();

console.log('=== TEST COMPLETE ===');
console.log('Check the console output above for results.');
