import mongoose from 'mongoose';

const FollowersSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, unique: true },
  followerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }]
}, { timestamps: true });

export default mongoose.model('Followers', FollowersSchema);
