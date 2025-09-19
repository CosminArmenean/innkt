// Initialize single-node replica set for Change Streams
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "mongodb-messaging:27017" }]
});

