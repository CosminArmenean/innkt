const io = require('socket.io-client');

// Configuration
const MESSAGING_URL = 'http://localhost:5003';
const TOKEN = process.argv[2]; // Get token from command line argument

if (!TOKEN) {
    console.error('Please provide a JWT token as an argument');
    console.log('Usage: node test-chat.js <jwt-token>');
    process.exit(1);
}

console.log('🚀 Starting chat test...');
console.log('📡 Connecting to messaging service:', MESSAGING_URL);

// Create socket connection with authentication
const socket = io(MESSAGING_URL, {
    auth: {
        token: TOKEN
    },
    transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Connected to messaging service!');
    console.log('🆔 Socket ID:', socket.id);
    
    // Test sending a message
    setTimeout(() => {
        console.log('📤 Sending test message...');
        socket.emit('send_message', {
            content: 'Hello from test script!',
            type: 'text',
            timestamp: new Date().toISOString()
        });
    }, 2000);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
});

// Message events
socket.on('message_received', (data) => {
    console.log('📨 Message received:', data);
});

socket.on('message_sent', (data) => {
    console.log('📤 Message sent confirmation:', data);
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
});

// Authentication events
socket.on('authenticated', (data) => {
    console.log('🔐 Authentication successful:', data);
});

socket.on('authentication_error', (error) => {
    console.error('❌ Authentication failed:', error);
});

// Keep the script running for a few seconds to test
setTimeout(() => {
    console.log('🏁 Test completed. Disconnecting...');
    socket.disconnect();
    process.exit(0);
}, 10000);
