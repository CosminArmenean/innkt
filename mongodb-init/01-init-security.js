// MongoDB Security Initialization Script
// This script sets up proper security for the INNKT messaging database

// Switch to the messaging database
db = db.getSiblingDB('innkt_messaging');

// Create application user with limited privileges
db.createUser({
  user: 'innkt_messaging_user',
  pwd: 'MessagingUser123!@#',
  roles: [
    {
      role: 'readWrite',
      db: 'innkt_messaging'
    }
  ]
});

// Create collections with proper indexes
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('participants');

// Create indexes for better performance and security
db.conversations.createIndex({ "createdAt": 1 });
db.conversations.createIndex({ "participants": 1 });
db.conversations.createIndex({ "type": 1 });

db.messages.createIndex({ "conversationId": 1, "createdAt": -1 });
db.messages.createIndex({ "senderId": 1 });
db.messages.createIndex({ "createdAt": 1 });

db.participants.createIndex({ "conversationId": 1 });
db.participants.createIndex({ "userId": 1 });

// Create a system user for monitoring (read-only)
db.createUser({
  user: 'innkt_monitor',
  pwd: 'MonitorUser123!@#',
  roles: [
    {
      role: 'read',
      db: 'innkt_messaging'
    },
    {
      role: 'clusterMonitor',
      db: 'admin'
    }
  ]
});

print('MongoDB security initialization completed successfully');
