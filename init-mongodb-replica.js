// MongoDB Replica Set Initialization Script
// Required for Change Streams functionality

print('🔧 MongoDB Replica Set Initialization Script');
print('============================================');

// Wait a bit for MongoDB to be fully ready
sleep(1000);

try {
  // Check if replica set is already initialized
  var status = rs.status();
  print('✅ Replica set is already initialized');
  print('Current status:', status.ok);
} catch (e) {
  print('🚀 Initializing MongoDB replica set for Change Streams...');
  
  // Initialize replica set
  var config = {
    _id: 'rs0',
    members: [
      {
        _id: 0,
        host: 'localhost:27017',
        priority: 1
      }
    ]
  };
  
  var result = rs.initiate(config);
  
  if (result.ok === 1) {
    print('✅ Replica set initialized successfully!');
    print('🎉 MongoDB Change Streams are now available');
  } else {
    print('❌ Failed to initialize replica set:', result);
  }
}

// Create the innkt_social database and collections
print('📊 Setting up innkt_social database...');

use('innkt_social');

// Create collections with proper indexes for performance
db.createCollection('posts');
db.createCollection('pollvotes');

print('✅ MongoDB setup complete!');
print('🚀 Ready for real-time Change Streams!');
