const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  fromCounsellor: {
    type: Boolean,
    default: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast message retrieval by student
MessageSchema.index({ tokenId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
