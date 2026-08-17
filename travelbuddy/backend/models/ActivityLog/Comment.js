import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  text: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  replies: [ReplySchema],
}, { timestamps: true });

CommentSchema.index({ post: 1, createdAt: -1 }); // fast fetch by post

export default mongoose.model('Comment', CommentSchema);
