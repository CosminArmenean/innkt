// Initialize replica set with both MongoDB instances as members
// This creates a single rs0 replica set with two members for high availability
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-social:27017", priority: 2 },
    { _id: 1, host: "mongodb-messaging:27017", priority: 1 }
  ]
});

// Wait for initialization
sleep(5000);

// Check status
print("Replica set initialization complete:");
print(JSON.stringify(rs.status().members.map(m => ({ 
  name: m.name, 
  state: m.stateStr,
  health: m.health 
})), null, 2));
