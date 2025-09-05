# INNKT Messaging Service

Real-time messaging service built with Socket.IO, MongoDB, and Redis for the INNKT platform.

## Features

- **Real-time messaging** with Socket.IO
- **Direct and group conversations**
- **Message reactions and status tracking**
- **File sharing support**
- **Message encryption** (end-to-end)
- **Presence tracking** (online/offline status)
- **Rate limiting** and security
- **MongoDB** for message storage
- **Redis** for pub/sub and caching

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Socket.IO      │    │    MongoDB      │
│                 │◄──►│  Server         │◄──►│                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Pub/Sub)     │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Redis 6+

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the service:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Docker

```bash
# Build image
docker build -t innkt-messaging .

# Run container
docker run -p 5003:5003 --env-file .env innkt-messaging
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Conversations
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations/direct` - Create direct conversation
- `POST /api/conversations/group` - Create group conversation
- `POST /api/conversations/:id/participants` - Add participant
- `DELETE /api/conversations/:id/participants/:userId` - Remove participant
- `PUT /api/conversations/:id/settings` - Update settings
- `PUT /api/conversations/:id/read` - Mark as read

### Messages
- `GET /api/messages` - Get conversation messages
- `GET /api/messages/:id` - Get specific message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `PUT /api/messages/:id/read` - Mark as read
- `POST /api/messages/:id/reactions` - Add reaction
- `DELETE /api/messages/:id/reactions/:reactionId` - Remove reaction
- `GET /api/messages/search` - Search messages

### Users
- `GET /api/users/stats` - Get user messaging stats
- `GET /api/users/:userId/status` - Get user status
- `PUT /api/users/presence` - Update presence

## Socket.IO Events

### Client → Server
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Send new message
- `add_reaction` - Add reaction to message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `update_presence` - Update user presence

### Server → Client
- `new_message` - New message received
- `reaction_added` - Reaction added to message
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_status_changed` - User status changed
- `conversation_updated` - Conversation updated
- `joined_conversation` - Successfully joined conversation
- `left_conversation` - Successfully left conversation
- `error` - Error occurred

## Database Schema

### Messages Collection
```javascript
{
  _id: ObjectId,
  senderId: String,
  conversationId: String,
  content: String,
  type: String, // 'text', 'image', 'file', 'system'
  media: {
    url: String,
    type: String,
    size: Number,
    name: String
  },
  status: String, // 'sent', 'delivered', 'read'
  isEncrypted: Boolean,
  replyTo: ObjectId,
  reactions: [{
    userId: String,
    emoji: String,
    timestamp: Date
  }],
  metadata: Object,
  timestamp: Date
}
```

### Conversations Collection
```javascript
{
  _id: ObjectId,
  type: String, // 'direct', 'group'
  name: String, // Required for groups
  description: String,
  avatar: String,
  participants: [{
    userId: String,
    role: String, // 'admin', 'moderator', 'member'
    joinedAt: Date,
    lastSeen: Date
  }],
  lastMessage: ObjectId,
  unreadCount: Number,
  isActive: Boolean,
  settings: {
    allowFileSharing: Boolean,
    allowReactions: Boolean,
    allowReplies: Boolean,
    messageRetention: Number,
    encryptionEnabled: Boolean,
    notificationsEnabled: Boolean
  },
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Security

- **JWT Authentication** for all API endpoints
- **Socket.IO Authentication** middleware
- **Rate Limiting** to prevent spam
- **Input Validation** with Joi
- **CORS** configuration
- **Helmet** security headers
- **End-to-end encryption** support

## Monitoring

- **Winston** logging with multiple transports
- **Health check** endpoint
- **Connection tracking** and cleanup
- **Error handling** and reporting

## Integration with INNKT

This service integrates with:
- **Frontier Service** - Load balancing and routing
- **Officer Service** - User authentication and management
- **NeuroSpark Service** - AI features and processing

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Environment Variables
See `env.example` for all available configuration options.

## License

MIT License - see LICENSE file for details.

