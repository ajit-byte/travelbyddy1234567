import mongoose from 'mongoose';

const SavedSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  postTitle: { type: String, required: true },
}, { timestamps: true });

SavedSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model('Saved', SavedSchema);
