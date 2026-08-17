import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Profile from '../models/Profile.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();


function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ msg: 'Admin access required' });
  next();
}

const streamUpload = (buffer, folder) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
    if (result) resolve(result); else reject(err);
  });
  streamifier.createReadStream(buffer).pipe(stream);
});


router.get('/stats', [auth, adminOnly], async (req, res) => {
  try {
    const VerificationStatus = (await import('../models/VerificationStatus.js')).default;
    const [total, pending, approved, rejected] = await Promise.all([
      Profile.countDocuments({ isAdmin: { $ne: true } }),
      VerificationStatus.countDocuments({ status: 'pending' }),
      VerificationStatus.countDocuments({ status: 'verified' }),
      VerificationStatus.countDocuments({ status: 'unverified' }),
    ]);
    res.json({ totalUsers: total, pendingKyc: pending, approvedKyc: approved, rejectedKyc: rejected });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
