import mongoose from 'mongoose';

const FollowingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, unique: true },
  followingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }]
}, { timestamps: true });

export default mongoose.model('Following', FollowingSchema);
