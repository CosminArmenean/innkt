const redis = require('redis');
const logger = require('../utils/logger');

async function connectRedis(url) {
  try {
    const client = new redis.createClient({
      url: url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max retry attempts reached');
            return new Error('Max retry attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 10000,
        lazyConnect: true
      },
      retry: {
        retries: 10,
        delay: (retries) => Math.min(retries * 100, 3000)
      }
    });

    client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    client.on('connect', () => {
      logger.info('✅ Redis client connected');
    });

    client.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    client.on('end', () => {
      logger.warn('Redis client connection ended');
    });

    client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    // Connect with retry logic
    let connected = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!connected && attempts < maxAttempts) {
      try {
        await client.connect();
        connected = true;
        logger.info('✅ Redis client connected successfully');
      } catch (error) {
        attempts++;
        logger.warn(`Redis connection attempt ${attempts} failed:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        } else {
          throw error;
        }
      }
    }

    return client;

  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

module.exports = { connectRedis };

