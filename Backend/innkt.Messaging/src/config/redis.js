const redis = require('redis');
const logger = require('../utils/logger');

async function connectRedis(url) {
  try {
    const client = redis.createClient({
      url: url,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
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

    await client.connect();
    return client;

  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

module.exports = { connectRedis };

