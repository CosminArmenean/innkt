// Test setup file for innkt.Messaging service

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/innkt_messaging_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.KAFKA_BROKERS = 'localhost:9092';

// Mock external services
jest.mock('../src/services/kafkaService', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  publishNotification: jest.fn().mockResolvedValue(),
  publishSocialEvent: jest.fn().mockResolvedValue(),
  publishMessageEvent: jest.fn().mockResolvedValue(),
  publishUserActivity: jest.fn().mockResolvedValue(),
  subscribe: jest.fn().mockResolvedValue()
}));

jest.mock('../src/services/pushNotificationService', () => ({
  sendToSingleUser: jest.fn().mockResolvedValue(),
  sendToMultipleUsers: jest.fn().mockResolvedValue(),
  sendToAllUsers: jest.fn().mockResolvedValue()
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(),
    unsubscribe: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock MongoDB
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  connection: {
    readyState: 1,
    on: jest.fn(),
    off: jest.fn()
  },
  Schema: jest.fn(),
  model: jest.fn(() => ({
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockResolvedValue([])
        })
      })
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([])
  }))
}));

// Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    use: jest.fn(),
    close: jest.fn()
  }))
}));

// Mock web-push
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue(),
  generateVAPIDKeys: jest.fn().mockReturnValue({
    publicKey: 'test-public-key',
    privateKey: 'test-private-key'
  })
}));

// Mock multer
jest.mock('multer', () => ({
  diskStorage: jest.fn(),
  memoryStorage: jest.fn(),
  __esModule: true,
  default: jest.fn(() => ({
    single: jest.fn((field) => (req, res, next) => {
      req.file = {
        fieldname: field,
        originalname: 'test-file.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test-file-content')
      };
      next();
    }),
    array: jest.fn((field, maxCount) => (req, res, next) => {
      req.files = Array(maxCount).fill({
        fieldname: field,
        originalname: 'test-file.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test-file-content')
      });
      next();
    })
  }))
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('test-file-content'),
  unlinkSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({
    size: 1024,
    mtime: new Date()
  })
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn().mockReturnValue('.jpg'),
  basename: jest.fn().mockReturnValue('test-file.jpg'),
  dirname: jest.fn().mockReturnValue('/test/dir')
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    ...overrides
  }),
  
  createMockMessage: (overrides = {}) => ({
    id: 'test-message-id',
    content: 'Test message content',
    senderId: 'test-user-id',
    conversationId: 'test-conversation-id',
    type: 'text',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockConversation: (overrides = {}) => ({
    id: 'test-conversation-id',
    name: 'Test Conversation',
    type: 'direct',
    participants: ['test-user-id', 'test-user-2-id'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockNotification: (overrides = {}) => ({
    id: 'test-notification-id',
    userId: 'test-user-id',
    type: 'message',
    title: 'New Message',
    body: 'You have a new message',
    data: {},
    read: false,
    createdAt: new Date(),
    ...overrides
  }),
  
  createMockPushSubscription: (overrides = {}) => ({
    userId: 'test-user-id',
    endpoint: 'https://example.com/push',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key'
    },
    userAgent: 'test-user-agent',
    isActive: true,
    createdAt: new Date(),
    ...overrides
  })
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);
