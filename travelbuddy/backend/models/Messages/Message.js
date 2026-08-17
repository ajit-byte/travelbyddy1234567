import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  content:  { type: String, trim: true },
  type: { type: String, enum: ['text', 'location'], default: 'text' },
  location: {
    lat: Number,
    lng: Number,
    title: String,
    address: String
  },
  attachments: [{
    url:      String,
    publicId: String,
    fileType: { type: String, enum: ['image', 'video', 'audio', 'file'] },
  }],
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  readBy: [{
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    readAt: { type: Date, default: Date.now },
  }],
  deleted:   { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
}, { timestamps: true });

MessageSchema.index({ threadId: 1, createdAt: -1 }); // paginated message fetch
MessageSchema.index({ threadId: 1, content: 'text' }); // message search

export default mongoose.model('Message', MessageSchema);
