import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, enum: ['Photo', 'Itinerary', 'Tip'], required: true, default: 'Photo' },
  title: { type: String, required: true },
  content: { type: String },
  image: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  destination: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  activities: [{ type: String }],
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ isPublic: 1, createdAt: -1 });

export default mongoose.model('Post', PostSchema);
