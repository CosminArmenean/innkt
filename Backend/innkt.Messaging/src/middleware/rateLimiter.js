const logger = require('../utils/logger');

// Simple in-memory rate limiter (in production, use Redis)
const rateLimitStore = new Map();

function rateLimiter(action, maxRequests, windowMs) {
  return (socket, next) => {
    const userId = socket.userId;
    const key = `${userId}:${action}`;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimitStore.get(key);
    
    if (now > limit.resetTime) {
      // Reset window
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (limit.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for user ${userId}, action: ${action}`);
      return next(new Error(`Rate limit exceeded. Max ${maxRequests} requests per ${windowMs/1000} seconds`));
    }
    
    limit.count++;
    next();
  };
}

// Clean up expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimitStore.entries()) {
    if (now > limit.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

module.exports = { rateLimiter };

