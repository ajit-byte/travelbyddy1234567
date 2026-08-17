import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Post from '../models/ContentsCreated/Post.js';
import Like from '../models/ActivityLog/Like.js';
import Comment from '../models/ActivityLog/Comment.js';
import Saved from '../models/ActivityLog/Saved.js';
import Following from '../models/SocialGraph/Following.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import { streamUpload } from '../utils/cloudinaryUpload.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, GIF, MP4, MOV, WEBM, AVI`));
    }
  },
});


router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { type = 'Photo', title, content, destination, startDate, endDate, activities, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({ msg: 'Title is required' });
    }

    if (type === 'Photo') {
      if (!content) return res.status(400).json({ msg: 'Context is required for Photo posts' });
      if (!req.file) return res.status(400).json({ msg: 'Image or video is required for Photo posts' });
    } else if (type === 'Itinerary') {
      if (!destination || !startDate || !endDate) return res.status(400).json({ msg: 'Destination and dates are required for Itineraries' });
    } else if (type === 'Tip') {
      if (!content) return res.status(400).json({ msg: 'Content is required for Tips' });
    } else {
      return res.status(400).json({ msg: 'Invalid post type' });
    }

    let mediaUrl = '';
    let mediaType = 'image';

    if (req.file) {
      const isVideo = ALLOWED_VIDEO_TYPES.includes(req.file.mimetype);
      const isImage = ALLOWED_IMAGE_TYPES.includes(req.file.mimetype);

      if (isImage && req.file.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({ msg: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` });
      }

      const resourceType = isVideo ? 'video' : 'image';
      mediaType = isVideo ? 'video' : 'image';

      try {
        const result = await streamUpload(req, 'posts', resourceType);
        mediaUrl = result.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ msg: 'Media upload failed. Please try again.' });
      }
    }

    const parsedActivities = activities
      ? activities.split(',').map(a => a.trim()).filter(Boolean)
      : [];

    const newPost = new Post({
      user: req.user.id,
      type,
      title,
      content,
      destination,
      startDate,
      endDate,
      image: mediaUrl,
      mediaType,
      activities: parsedActivities,
      isPublic: isPublic !== 'false' && isPublic !== false,
    });

    await newPost.save();

    const populated = await newPost.populate('user', 'username nickname profileIconUrl isVerified');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: `File too large. Maximum video size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB.` });
    }
    if (err.message?.startsWith('Unsupported file type')) {
      return res.status(400).json({ msg: err.message });
    }
    console.error('Create post error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/', async (req, res) => {
  try {
    let requestingUserId = null;
    const token = req.header('x-auth-token');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requestingUserId = decoded.user.id;
      } catch (_) {}
    }
    const query = requestingUserId
      ? { $or: [{ isPublic: true }, { user: requestingUserId }] }
      : { isPublic: true };
    const posts = await Post.find(query).populate('user', 'username nickname profileIconUrl isVerified').sort({ createdAt: -1 });

    const enriched = await Promise.all(posts.map(async p => {
      const [likeCount, commentCount, saveCount, myLike, mySave] = await Promise.all([
        Like.countDocuments({ post: p._id }),
        Comment.countDocuments({ post: p._id }),
        Saved.countDocuments({ post: p._id }),
        requestingUserId ? Like.findOne({ post: p._id, user: requestingUserId }) : null,
        requestingUserId ? Saved.findOne({ post: p._id, user: requestingUserId }) : null,
      ]);
      return { 
        ...p.toObject(), 
        likeCount, 
        commentCount, 
        saveCount,
        isLiked: !!myLike,
        isSaved: !!mySave
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Get all posts error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/my', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate('user', 'username nickname profileIconUrl')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(posts.map(async p => {
      const [likeCount, commentCount, saveCount, myLike, mySave] = await Promise.all([
        Like.countDocuments({ post: p._id }),
        Comment.countDocuments({ post: p._id }),
        Saved.countDocuments({ post: p._id }),
        Like.findOne({ post: p._id, user: req.user.id }),
        Saved.findOne({ post: p._id, user: req.user.id }),
      ]);
      return { 
        ...p.toObject(), 
        likeCount, 
        commentCount, 
        saveCount,
        isLiked: !!myLike,
        isSaved: !!mySave
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Get my posts error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/following/list', auth, async (req, res) => {
  try {
    const following = await Following.findOne({ user: req.user.id }).populate('followingIds', 'username nickname email');
    res.json(following?.followingIds || []);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/users/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json([]);

    const query = q.trim();
    const meId = req.user.id;
    const isObjectId = /^[a-f\d]{24}$/i.test(query);

    let users;
    if (isObjectId) {
      const u = await Profile.findById(query).select('username nickname email _id');
      users = u && u._id.toString() !== meId ? [u] : [];
    } else {
      users = await Profile.find({
        _id: { $ne: meId },
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { nickname: { $regex: query, $options: 'i' } },
        ],
      }).select('username nickname email _id').limit(20);
    }

    const myFollowing = await Following.findOne({ user: meId });
    const iFollow = myFollowing?.followingIds.map(id => id.toString()) || [];
    const theirFollowing = await Following.find({ followingIds: meId });
    const theyFollowMe = theirFollowing.map(r => r.user.toString());
    const pendingRequests = await Notification.find({
      sender: meId, type: 'follow_request', status: 'pending',
    });
    const pendingIds = pendingRequests.map(n => n.recipient.toString());

    let enriched = users.map(u => {
      const uid = u._id.toString();
      const following = iFollow.includes(uid);
      const theyFollow = theyFollowMe.includes(uid);
      return {
        _id: u._id,
        username: u.username,
        nickname: u.nickname,
        email: u.email,
        following,
        requested: pendingIds.includes(uid),
        friends: following && theyFollow,
      };
    });

    if (req.query.notConnected === 'true') {
      enriched = enriched.filter(u => !u.friends);
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


router.put('/:id', [auth, upload.single('image')], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not authorized to edit this post' });
    }

    const { type, title, content, destination, startDate, endDate, activities, isPublic } = req.body;

    if (type) post.type = type;
    if (title) post.title = title;
    if (content) post.content = content;
    if (destination) post.destination = destination;
    if (startDate) post.startDate = startDate;
    if (endDate) post.endDate = endDate;
    if (isPublic !== undefined) post.isPublic = isPublic !== 'false' && isPublic !== false;
    
    if (activities) {
      post.activities = activities.split(',').map(a => a.trim()).filter(Boolean);
    }

    if (req.file) {
      const isVideo = ALLOWED_VIDEO_TYPES.includes(req.file.mimetype);
      if (isVideo && req.file.size > MAX_VIDEO_SIZE) {
        return res.status(400).json({ msg: `Video too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB.` });
      }
      if (!isVideo && req.file.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({ msg: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` });
      }
      const resourceType = isVideo ? 'video' : 'image';
      try {
        const result = await streamUpload(req, 'posts', resourceType);
        post.image = result.secure_url;
        post.mediaType = isVideo ? 'video' : 'image';
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ msg: 'Media upload failed. Please try again.' });
      }
    }

    await post.save();

    const updatedPost = await post.populate('user', 'username nickname profileIconUrl');
    res.json(updatedPost);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: `File too large. Maximum video size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB.` });
    }
    if (err.message?.startsWith('Unsupported file type')) {
      return res.status(400).json({ msg: err.message });
    }
    console.error('Update post error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Only owner can delete
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not authorized to delete this post' });
    }

    await post.deleteOne();
    await Promise.all([
      Like.deleteMany({ post: req.params.id }),
      Comment.deleteMany({ post: req.params.id }),
      Saved.deleteMany({ post: req.params.id }),
    ]);

    res.json({ msg: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/:id/like', auth, async (req, res) => {
  try {
    const existing = await Like.findOne({ user: req.user.id, post: req.params.id });
    if (existing) {
      await existing.deleteOne();
      const count = await Like.countDocuments({ post: req.params.id });
      return res.json({ liked: false, count });
    }
    await Like.create({ user: req.user.id, post: req.params.id });
    const count = await Like.countDocuments({ post: req.params.id });
    res.json({ liked: true, count });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/:id/like', auth, async (req, res) => {
  try {
    const liked = !!(await Like.findOne({ user: req.user.id, post: req.params.id }));
    const count = await Like.countDocuments({ post: req.params.id });
    res.json({ liked, count });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('user', 'username nickname profileIconUrl')
      .populate('replies.user', 'username nickname')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Comment text required' });
    const comment = await Comment.create({ user: req.user.id, post: req.params.id, text });
    const populated = await comment.populate('user', 'username nickname profileIconUrl');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/:id/comments/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    const idx = comment.likes.indexOf(req.user.id);
    if (idx > -1) {
      comment.likes.splice(idx, 1);
    } else {
      comment.likes.push(req.user.id);
    }
    await comment.save();
    res.json({ liked: idx === -1, count: comment.likes.length });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/:id/comments/:commentId/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Reply text required' });
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    comment.replies.push({ user: req.user.id, text });
    await comment.save();
    await comment.populate('user', 'username nickname profileIconUrl');
    await comment.populate('replies.user', 'username nickname');
    res.json(comment);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/:id/save', auth, async (req, res) => {
  try {
    const existing = await Saved.findOne({ user: req.user.id, post: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ saved: false });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    await Saved.create({ user: req.user.id, post: req.params.id, postTitle: post.title });
    res.json({ saved: true });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/:id/save', auth, async (req, res) => {
  try {
    const saved = !!(await Saved.findOne({ user: req.user.id, post: req.params.id }));
    res.json({ saved });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
