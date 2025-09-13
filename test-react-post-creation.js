// Test script to verify React UI post creation
// Run this in the browser console when on http://localhost:3001

console.log('=== TESTING REACT UI POST CREATION ===');

// Test 1: Check if user is logged in
console.log('1. Checking authentication status:');
const token = localStorage.getItem('accessToken');
if (token) {
    console.log('✅ User is logged in - Token:', token.substring(0, 30) + '...');
} else {
    console.log('❌ User is not logged in - No token found');
    console.log('Please login first using the React UI');
}

// Test 2: Check if socialService is available
console.log('2. Checking socialService availability:');
if (typeof socialService !== 'undefined') {
    console.log('✅ socialService is available');
} else {
    console.log('❌ socialService is not available');
}

// Test 3: Test post creation directly
async function testPostCreation() {
    if (!token) {
        console.log('❌ Cannot test post creation - No authentication token');
        return;
    }

    try {
        console.log('3. Testing post creation:');
        const postData = {
            content: 'Test post from React UI console - JWT working! #test #console',
            type: 'text',
            visibility: 'public',
            tags: ['test', 'console'],
            isPublic: true
        };

        const response = await fetch('http://localhost:8081/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Post created successfully:', data);
        } else {
            const errorText = await response.text();
            console.log('❌ Post creation failed:', response.status, errorText);
        }
    } catch (error) {
        console.log('❌ Post creation error:', error);
    }
}

// Run the test
testPostCreation();

console.log('=== TEST COMPLETE ===');
console.log('If post creation failed, check the browser console for detailed error messages');
