// Test script to verify React UI post creation after fixes
// Run this in the browser console when on http://localhost:3001

console.log('=== TESTING REACT UI POST CREATION (FIXED) ===');

// Test 1: Check if user is logged in
console.log('1. Checking authentication status:');
const token = localStorage.getItem('accessToken');
if (token) {
    console.log('✅ User is logged in - Token:', token.substring(0, 30) + '...');
} else {
    console.log('❌ User is not logged in - No token found');
    console.log('Please login first using the React UI');
}

// Test 2: Test post creation with correct data format
async function testPostCreationFixed() {
    if (!token) {
        console.log('❌ Cannot test post creation - No authentication token');
        return;
    }

    try {
        console.log('2. Testing post creation with fixed data format:');
        const postData = {
            content: 'Test post from React UI - Fixed version! #test #fixed',
            type: 'text',
            visibility: 'public',
            tags: ['test', 'fixed'],
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
            console.log('Post ID:', data.id);
            console.log('Author:', data.author);
            console.log('Author Profile:', data.authorProfile);
            console.log('Content:', data.content);
            console.log('Created At:', data.createdAt);
        } else {
            const errorText = await response.text();
            console.log('❌ Post creation failed:', response.status, errorText);
        }
    } catch (error) {
        console.log('❌ Post creation error:', error);
    }
}

// Test 3: Test posts feed
async function testPostsFeed() {
    if (!token) {
        console.log('❌ Cannot test posts feed - No authentication token');
        return;
    }

    try {
        console.log('3. Testing posts feed:');
        const response = await fetch('http://localhost:8081/api/posts/feed?page=1&limit=5', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Posts feed loaded successfully:', data);
            console.log('Number of posts:', data.posts?.length || 0);
            if (data.posts && data.posts.length > 0) {
                console.log('First post:', data.posts[0]);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Posts feed failed:', response.status, errorText);
        }
    } catch (error) {
        console.log('❌ Posts feed error:', error);
    }
}

// Run the tests
testPostCreationFixed();
testPostsFeed();

console.log('=== TEST COMPLETE ===');
console.log('If both tests pass, the React UI should now work correctly!');
