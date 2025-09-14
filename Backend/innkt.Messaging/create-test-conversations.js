const mongoose = require('mongoose');

// MongoDB connection with authentication (URL encoded password)
const MONGODB_URI = 'mongodb://innkt_messaging_user:MessagingUser123%21%40%23@localhost:27017/innkt_messaging?authSource=admin';

// Define schemas
const conversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ['direct', 'group'], required: true },
  name: { type: String },
  description: { type: String },
  participants: [{
    userId: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    lastReadAt: { type: Date, default: Date.now }
  }],
  lastMessage: {
    id: { type: String },
    content: { type: String },
    senderId: { type: String },
    timestamp: { type: Date }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  conversationId: { type: String, required: true },
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'video', 'file', 'system'], default: 'text' },
  mediaUrl: { type: String },
  metadata: { type: Object },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  reactions: [{
    userId: { type: String },
    emoji: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  readBy: [{
    userId: { type: String },
    readAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

async function createTestConversations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test user IDs
    const testUser1 = '4f8c8759-dfdc-423e-878e-c68036140114'; // testuser1@example.com
    const testUser2 = '5a9b9860-efed-534f-989f-d79147251225'; // testuser2@example.com
    const testUser3 = '6b0c0971-fgfe-645g-090g-e80258362336'; // testuser3@example.com

    // Clear existing test data
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    console.log('🧹 Cleared existing test data');

    // Create conversations
    const conversations = [
      {
        id: 'conv-1',
        type: 'direct',
        participants: [
          { userId: testUser1, role: 'member' },
          { userId: testUser2, role: 'member' }
        ],
        lastMessage: {
          id: 'msg-1',
          content: 'Hey! How are you doing?',
          senderId: testUser2,
          timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        }
      },
      {
        id: 'conv-2',
        type: 'direct',
        participants: [
          { userId: testUser1, role: 'member' },
          { userId: testUser3, role: 'member' }
        ],
        lastMessage: {
          id: 'msg-2',
          content: 'Thanks for the help with the project!',
          senderId: testUser1,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        }
      },
      {
        id: 'conv-3',
        type: 'group',
        name: 'Family Chat',
        description: 'Our family group chat',
        participants: [
          { userId: testUser1, role: 'admin' },
          { userId: testUser2, role: 'member' },
          { userId: testUser3, role: 'member' }
        ],
        lastMessage: {
          id: 'msg-3',
          content: 'Don\'t forget about dinner tonight!',
          senderId: testUser1,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
        }
      },
      {
        id: 'conv-4',
        type: 'direct',
        participants: [
          { userId: testUser1, role: 'member' },
          { userId: '7c1d1082-ghgf-756h-101h-f91369473447', role: 'member' } // Another test user
        ],
        lastMessage: {
          id: 'msg-4',
          content: 'See you tomorrow!',
          senderId: '7c1d1082-ghgf-756h-101h-f91369473447',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        }
      }
    ];

    // Create conversations
    for (const conv of conversations) {
      await Conversation.create(conv);
      console.log(`✅ Created conversation: ${conv.id}`);
    }

    // Create messages for each conversation
    const messages = [
      // Conversation 1 messages
      {
        id: 'msg-1-1',
        conversationId: 'conv-1',
        senderId: testUser1,
        content: 'Hello! How are you?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        id: 'msg-1-2',
        conversationId: 'conv-1',
        senderId: testUser2,
        content: 'Hey! How are you doing?',
        createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: 'msg-1-3',
        conversationId: 'conv-1',
        senderId: testUser1,
        content: 'I\'m doing great! Just working on some new features.',
        createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },

      // Conversation 2 messages
      {
        id: 'msg-2-1',
        conversationId: 'conv-2',
        senderId: testUser3,
        content: 'Hi! I can help you with that project.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      },
      {
        id: 'msg-2-2',
        conversationId: 'conv-2',
        senderId: testUser1,
        content: 'Thanks for the help with the project!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },

      // Conversation 3 messages (group chat)
      {
        id: 'msg-3-1',
        conversationId: 'conv-3',
        senderId: testUser2,
        content: 'Good morning everyone!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
      },
      {
        id: 'msg-3-2',
        conversationId: 'conv-3',
        senderId: testUser3,
        content: 'Morning! How is everyone doing?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        id: 'msg-3-3',
        conversationId: 'conv-3',
        senderId: testUser1,
        content: 'Don\'t forget about dinner tonight!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
      },

      // Conversation 4 messages
      {
        id: 'msg-4-1',
        conversationId: 'conv-4',
        senderId: '7c1d1082-ghgf-756h-101h-f91369473447',
        content: 'Hey! How was your day?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25) // 25 hours ago
      },
      {
        id: 'msg-4-2',
        conversationId: 'conv-4',
        senderId: testUser1,
        content: 'It was good! Busy but productive.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 24 hours ago
      },
      {
        id: 'msg-4-3',
        conversationId: 'conv-4',
        senderId: '7c1d1082-ghgf-756h-101h-f91369473447',
        content: 'See you tomorrow!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ];

    // Create messages
    for (const msg of messages) {
      await Message.create(msg);
      console.log(`✅ Created message: ${msg.id}`);
    }

    console.log('\n🎉 Test conversations created successfully!');
    console.log(`📊 Created ${conversations.length} conversations and ${messages.length} messages`);
    console.log('\n📱 You can now see these conversations in the UI for testuser1@example.com');

  } catch (error) {
    console.error('❌ Error creating test conversations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createTestConversations();
