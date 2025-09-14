const mongoose = require('mongoose');

const messageReactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  media: {
    url: String,
    type: String,
    size: Number,
    name: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [messageReactionSchema],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ status: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.status = 'read';
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId !== userId);
  
  // Add new reaction
  this.reactions.push({ userId, emoji });
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.userId !== userId);
  return this.save();
};

// Static method to get messages for conversation
messageSchema.statics.getConversationMessages = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const mongoose = require('mongoose');
  
  // Mongoose will automatically convert string to ObjectId based on schema
  return this.find({ conversationId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('replyTo', 'content senderId')
    .lean();
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function(conversationId, userId) {
  return this.countDocuments({
    conversationId,
    senderId: { $ne: userId },
    status: { $in: ['sent', 'delivered'] }
  });
};

module.exports = mongoose.model('Message', messageSchema);

