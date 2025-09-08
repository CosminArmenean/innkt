// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/innkt_messaging_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.VAPID_PUBLIC_KEY = 'test-vapid-public-key';
process.env.VAPID_PRIVATE_KEY = 'test-vapid-private-key';
process.env.VAPID_SUBJECT = 'mailto:test@example.com';
process.env.UPLOAD_PATH = 'test-uploads';
process.env.MAX_FILE_SIZE = '10485760';
process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,image/gif,application/pdf,text/plain';
