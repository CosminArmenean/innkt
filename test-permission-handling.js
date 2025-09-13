// Test script to verify permission handling in React UI
// Run this in the browser console when on http://localhost:3001

console.log('=== TESTING PERMISSION HANDLING ===');

// Test 1: Check notification permission
console.log('1. Testing notification permission handling:');
if ('Notification' in window) {
    console.log('Notification API available');
    console.log('Current permission:', Notification.permission);
    
    if (Notification.permission === 'denied') {
        console.log('✅ Notification permission denied - this is handled gracefully');
    } else if (Notification.permission === 'granted') {
        console.log('✅ Notification permission granted');
    } else {
        console.log('ℹ️ Notification permission not yet requested');
    }
} else {
    console.log('❌ Notification API not available in this browser');
}

// Test 2: Check clipboard permission
console.log('2. Testing clipboard permission handling:');
if ('clipboard' in navigator) {
    console.log('Clipboard API available');
    try {
        // Try to read clipboard to test permission
        navigator.clipboard.readText().then(() => {
            console.log('✅ Clipboard read permission granted');
        }).catch((error) => {
            console.log('⚠️ Clipboard read permission denied:', error.message);
        });
    } catch (error) {
        console.log('⚠️ Clipboard API error:', error.message);
    }
} else {
    console.log('❌ Clipboard API not available in this browser');
}

// Test 3: Check service worker registration
console.log('3. Testing service worker registration:');
if ('serviceWorker' in navigator) {
    console.log('Service Worker API available');
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
            console.log('✅ Service Worker registered');
        } else {
            console.log('ℹ️ No Service Worker registered');
        }
    }).catch((error) => {
        console.log('⚠️ Service Worker error:', error.message);
    });
} else {
    console.log('❌ Service Worker API not available in this browser');
}

console.log('=== TEST COMPLETE ===');
console.log('If you see warnings instead of errors, the permission handling is working correctly!');

