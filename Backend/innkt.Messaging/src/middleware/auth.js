const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Socket.IO authentication middleware
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.userInfo = {
      username: decoded.username,
      displayName: decoded.displayName,
      avatar: decoded.avatar
    };

    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Invalid authentication token'));
  }
}

// Express authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  });
}

module.exports = { authenticateSocket, authenticateToken };
