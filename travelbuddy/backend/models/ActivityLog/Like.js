import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: true });

LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1 }); 

export default mongoose.model('Like', LikeSchema);
