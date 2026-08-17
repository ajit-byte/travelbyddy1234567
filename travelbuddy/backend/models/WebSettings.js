import mongoose from 'mongoose';

const WebSettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  theme: { type: String, enum: ['Light', 'Dark'], default: 'Light' },
  language: { type: String, default: 'en' },
  notifications: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('WebSettings', WebSettingsSchema);
