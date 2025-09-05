const { io } = require('socket.io-client');

console.log('🔌 Quick Socket.IO Test');
console.log('======================');

const socket = io('http://localhost:5004', {
  auth: {
    token: 'test-token'
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected!');
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ Error:', error.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏰ Timeout');
  process.exit(1);
}, 5000);
