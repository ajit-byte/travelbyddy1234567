import mongoose from 'mongoose';

const MatchCacheSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  score: { type: Number, required: true },
  verdict: { type: String, enum: ['high', 'medium', 'low'], required: true },
  sharedSignals: [{ type: String }],
  destinationOverlap: { type: Boolean, default: false },
  matchReason: { type: String, default: '' }
}, { timestamps: true });


MatchCacheSchema.index({ userA: 1, userB: 1 }, { unique: true });

export default mongoose.model('MatchCache', MatchCacheSchema);
