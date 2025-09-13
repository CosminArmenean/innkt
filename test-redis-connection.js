// Test Redis Connection
const redis = require('redis');

async function testRedisConnection() {
  console.log('Testing Redis connection...');
  
  const client = new redis.createClient({
    url: 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.error('Max retry attempts reached');
          return new Error('Max retry attempts reached');
        }
        console.log(`Retrying connection, attempt ${retries}`);
        return Math.min(retries * 100, 3000);
      },
      connectTimeout: 10000,
      lazyConnect: true
    },
    retry: {
      retries: 5,
      delay: (retries) => Math.min(retries * 100, 3000)
    }
  });

  client.on('error', (error) => {
    console.error('Redis client error:', error);
  });

  client.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  client.on('ready', () => {
    console.log('✅ Redis client ready');
  });

  client.on('end', () => {
    console.log('Redis client connection ended');
  });

  client.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
  });

  try {
    await client.connect();
    console.log('✅ Redis connection successful!');
    
    // Test a simple operation
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');
    console.log('✅ Redis operation successful:', value);
    
    await client.del('test-key');
    console.log('✅ Redis cleanup successful');
    
    await client.quit();
    console.log('✅ Redis connection closed gracefully');
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }
}

testRedisConnection();
