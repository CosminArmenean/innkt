const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const conversationSettingsSchema = new mongoose.Schema({
  allowFileSharing: {
    type: Boolean,
    default: true
  },
  allowReactions: {
    type: Boolean,
    default: true
  },
  allowReplies: {
    type: Boolean,
    default: true
  },
  messageRetention: {
    type: Number,
    default: 365 // days
  },
  encryptionEnabled: {
    type: Boolean,
    default: false
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
});

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    required: function() {
      return this.type === 'group';
    }
  },
  description: {
    type: String
  },
  avatar: {
    type: String
  },
  participants: [participantSchema],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    type: conversationSettingsSchema,
    default: () => ({})
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ type: 1, isActive: 1 });
conversationSchema.index({ updatedAt: -1 });

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to add participant
conversationSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => p.userId === userId);
  
  if (!existingParticipant) {
    this.participants.push({ userId, role });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.userId !== userId);
  return this.save();
};

// Method to update participant role
conversationSchema.methods.updateParticipantRole = function(userId, role) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    participant.role = role;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update last seen
conversationSchema.methods.updateLastSeen = function(userId) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    participant.lastSeen = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find conversation by participants
conversationSchema.statics.findDirectConversation = function(userId1, userId2) {
  return this.findOne({
    type: 'direct',
    'participants.userId': { $all: [userId1, userId2] },
    'participants': { $size: 2 }
  });
};

// Static method to get user conversations
conversationSchema.statics.getUserConversations = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    'participants.userId': userId,
    isActive: true
  })
  .sort({ updatedAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('lastMessage')
  .lean();
};

// Static method to create direct conversation
conversationSchema.statics.createDirectConversation = function(userId1, userId2) {
  return this.create({
    type: 'direct',
    participants: [
      { userId: userId1, role: 'member' },
      { userId: userId2, role: 'member' }
    ],
    createdBy: userId1,
    settings: {}
  });
};

// Static method to create group conversation
conversationSchema.statics.createGroupConversation = function(name, participants, createdBy) {
  return this.create({
    type: 'group',
    name,
    participants: participants.map(userId => ({ userId, role: 'member' })),
    createdBy,
    settings: {}
  });
};

module.exports = mongoose.model('Conversation', conversationSchema);
