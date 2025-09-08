// MongoDB initialization script for innkt.Messaging
// This script will be executed when the MongoDB container starts for the first time

// Switch to the messaging database
db = db.getSiblingDB('innkt_messaging');

// Create collections with validation
db.createCollection('conversations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'participants', 'createdAt'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Conversation name is required and must be a string'
        },
        type: {
          bsonType: 'string',
          enum: ['direct', 'group'],
          description: 'Conversation type must be either direct or group'
        },
        participants: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['userId', 'role', 'joinedAt'],
            properties: {
              userId: {
                bsonType: 'string',
                description: 'User ID is required and must be a string'
              },
              role: {
                bsonType: 'string',
                enum: ['admin', 'moderator', 'member'],
                description: 'Role must be admin, moderator, or member'
              },
              joinedAt: {
                bsonType: 'date',
                description: 'Join date is required and must be a date'
              }
            }
          }
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required and must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Updated date must be a date'
        }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['conversationId', 'senderId', 'content', 'type', 'createdAt'],
      properties: {
        conversationId: {
          bsonType: 'string',
          description: 'Conversation ID is required and must be a string'
        },
        senderId: {
          bsonType: 'string',
          description: 'Sender ID is required and must be a string'
        },
        content: {
          bsonType: 'string',
          description: 'Message content is required and must be a string'
        },
        type: {
          bsonType: 'string',
          enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
          description: 'Message type must be one of the allowed types'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required and must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Updated date must be a date'
        }
      }
    }
  }
});

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'type', 'title', 'body', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID is required and must be a string'
        },
        type: {
          bsonType: 'string',
          enum: ['message', 'follow', 'like', 'comment', 'mention', 'system'],
          description: 'Notification type must be one of the allowed types'
        },
        title: {
          bsonType: 'string',
          description: 'Notification title is required and must be a string'
        },
        body: {
          bsonType: 'string',
          description: 'Notification body is required and must be a string'
        },
        read: {
          bsonType: 'bool',
          description: 'Read status must be a boolean'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required and must be a date'
        }
      }
    }
  }
});

db.createCollection('pushSubscriptions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'endpoint', 'keys', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID is required and must be a string'
        },
        endpoint: {
          bsonType: 'string',
          description: 'Push endpoint is required and must be a string'
        },
        keys: {
          bsonType: 'object',
          required: ['p256dh', 'auth'],
          properties: {
            p256dh: {
              bsonType: 'string',
              description: 'P256DH key is required and must be a string'
            },
            auth: {
              bsonType: 'string',
              description: 'Auth key is required and must be a string'
            }
          }
        },
        isActive: {
          bsonType: 'bool',
          description: 'Active status must be a boolean'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date is required and must be a date'
        }
      }
    }
  }
});

// Create indexes for performance
db.conversations.createIndex({ 'participants.userId': 1 });
db.conversations.createIndex({ 'type': 1 });
db.conversations.createIndex({ 'createdAt': -1 });

db.messages.createIndex({ 'conversationId': 1, 'createdAt': -1 });
db.messages.createIndex({ 'senderId': 1 });
db.messages.createIndex({ 'type': 1 });
db.messages.createIndex({ 'createdAt': -1 });

db.notifications.createIndex({ 'userId': 1, 'createdAt': -1 });
db.notifications.createIndex({ 'type': 1 });
db.notifications.createIndex({ 'read': 1 });
db.notifications.createIndex({ 'createdAt': -1 });

db.pushSubscriptions.createIndex({ 'userId': 1 });
db.pushSubscriptions.createIndex({ 'endpoint': 1 });
db.pushSubscriptions.createIndex({ 'isActive': 1 });

// Insert sample data for development
db.conversations.insertOne({
  _id: ObjectId(),
  name: 'General Chat',
  type: 'group',
  participants: [
    {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'admin',
      joinedAt: new Date()
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      role: 'member',
      joinedAt: new Date()
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

db.messages.insertOne({
  _id: ObjectId(),
  conversationId: db.conversations.findOne()._id.toString(),
  senderId: '550e8400-e29b-41d4-a716-446655440000',
  content: 'Welcome to the general chat!',
  type: 'text',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.notifications.insertOne({
  _id: ObjectId(),
  userId: '550e8400-e29b-41d4-a716-446655440001',
  type: 'message',
  title: 'New Message',
  body: 'You have a new message in General Chat',
  read: false,
  createdAt: new Date()
});

// Create a TTL index for notifications (auto-delete after 30 days)
db.notifications.createIndex({ 'createdAt': 1 }, { expireAfterSeconds: 2592000 });

// Create a TTL index for old messages (auto-delete after 1 year)
db.messages.createIndex({ 'createdAt': 1 }, { expireAfterSeconds: 31536000 });

print('MongoDB initialization completed successfully!');
