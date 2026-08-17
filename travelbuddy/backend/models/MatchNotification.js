import mongoose from 'mongoose';

const MatchNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  matchCount: { type: Number, default: 0 },
  matches: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    score: Number,
    matchReason: String,
    sharedSignals: [String],
    destinationOverlap: { type: Boolean, default: false },
  }],
  read: { type: Boolean, default: false },
}, { timestamps: true });

MatchNotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('MatchNotification', MatchNotificationSchema);
