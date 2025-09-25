const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: [true, 'Club ID is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [500, 'Message cannot exceed 500 characters'],
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'system', 'event', 'announcement'],
    default: 'text'
  },
  metadata: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    mentioned: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      maxlength: [200, 'Reply cannot exceed 200 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

messageSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });
  return counts;
});

messageSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

messageSchema.virtual('isEdited').get(function() {
  return this.metadata.edited;
});

messageSchema.index({ club: 1, createdAt: -1 });
messageSchema.index({ user: 1, createdAt: -1 });
messageSchema.index({ club: 1, type: 1, createdAt: -1 });

messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );

  if (existingReaction) {
    return { success: false, message: 'Reaction already exists' };
  }

  this.reactions.push({ user: userId, emoji });
  return { success: true, message: 'Reaction added' };
};

messageSchema.methods.removeReaction = function(userId, emoji) {
  const reactionIndex = this.reactions.findIndex(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );

  if (reactionIndex === -1) {
    return { success: false, message: 'Reaction not found' };
  }

  this.reactions.splice(reactionIndex, 1);
  return { success: true, message: 'Reaction removed' };
};

messageSchema.methods.addReply = function(userId, content) {
  if (content.length > 200) {
    return { success: false, message: 'Reply cannot exceed 200 characters' };
  }

  this.replies.push({ user: userId, content });
  return { success: true, message: 'Reply added' };
};

messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(
    r => r.user.toString() === userId.toString()
  );

  if (!existingRead) {
    this.readBy.push({ user: userId });
  }
};

messageSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
};

messageSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

messageSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

messageSchema.pre('findOneAndUpdate', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Message', messageSchema);