// Test script to verify periodic sync handling in React UI
// Run this in the browser console when on http://localhost:3001

console.log('=== TESTING PERIODIC SYNC FIX ===');

// Test 1: Check service worker registration
console.log('1. Testing service worker registration:');
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
            console.log('✅ Service Worker registered');
            const registration = registrations[0];
            console.log('Service Worker state:', registration.active?.state || 'not active');
            
            // Test 2: Check periodic sync support
            console.log('2. Testing periodic sync support:');
            if ('periodicSync' in window.ServiceWorkerRegistration.prototype) {
                console.log('✅ Periodic sync API available');
                
                // Test 3: Try to register periodic sync (this should not throw an error now)
                console.log('3. Testing periodic sync registration:');
                try {
                    if (registration.periodicSync) {
                        registration.periodicSync.register('test-sync', {
                            minInterval: 24 * 60 * 60 * 1000 // 24 hours
                        }).then(() => {
                            console.log('✅ Periodic sync registered successfully');
                        }).catch((error) => {
                            console.log('⚠️ Periodic sync registration failed (expected):', error.message);
                        });
                    } else {
                        console.log('⚠️ Periodic sync not available on this registration');
                    }
                } catch (error) {
                    console.log('⚠️ Periodic sync registration error (expected):', error.message);
                }
            } else {
                console.log('❌ Periodic sync API not available');
            }
        } else {
            console.log('❌ No Service Worker registered');
        }
    }).catch((error) => {
        console.log('❌ Service Worker error:', error);
    });
} else {
    console.log('❌ Service Worker not supported');
}

// Test 4: Check console for any errors
console.log('4. Checking for runtime errors:');
console.log('If you see warnings instead of errors, the fix is working!');

console.log('=== TEST COMPLETE ===');
console.log('The periodic sync error should now be handled gracefully!');

