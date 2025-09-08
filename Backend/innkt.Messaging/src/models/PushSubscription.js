const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  userAgent: {
    type: String,
    default: ''
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet'],
    default: 'desktop'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });
pushSubscriptionSchema.index({ lastUsed: 1 });

pushSubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
