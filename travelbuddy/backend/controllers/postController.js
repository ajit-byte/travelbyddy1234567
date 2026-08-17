import Post from '../models/ContentsCreated/Post.js';
import Like from '../models/ActivityLog/Like.js';
import Comment from '../models/ActivityLog/Comment.js';
import Saved from '../models/ActivityLog/Saved.js';
import Following from '../models/SocialGraph/Following.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import { streamUpload } from '../utils/cloudinaryUpload.js';

export async function createPost(req, res) {
  try {
    const { type = 'Photo', title, content, destination, startDate, endDate, activities, isPublic } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title is required' });
    if (type === 'Photo') {
      if (!content) return res.status(400).json({ msg: 'Context is required for Photo posts' });
      if (!req.file) return res.status(400).json({ msg: 'Image is required for Photo posts' });
    } else if (type === 'Itinerary') {
      if (!destination || !startDate || !endDate) return res.status(400).json({ msg: 'Destination and dates are required for Itineraries' });
    } else if (type === 'Tip') {
      if (!content) return res.status(400).json({ msg: 'Content is required for Tips' });
    } else {
      return res.status(400).json({ msg: 'Invalid post type' });
    }

    let imageUrl = '';
    if (req.file) {
      const result = await streamUpload(req);
      imageUrl = result.secure_url;
    }

    const parsedActivities = activities ? activities.split(',').map(a => a.trim()).filter(Boolean) : [];
    const newPost = new Post({
      user: req.user.id, type, title, content, destination, startDate, endDate,
      image: imageUrl, activities: parsedActivities,
      isPublic: isPublic !== 'false' && isPublic !== false,
    });
    await newPost.save();
    const populated = await newPost.populate('user', 'username nickname profileIconUrl');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getAllPosts(req, res) {
  try {
    let requestingUserId = null;
    const token = req.header('x-auth-token');
    if (token) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requestingUserId = decoded.user.id;
      } catch (_) {}
    }

    const adminUsers = await Profile.find({ isAdmin: true }).select('_id');
    const adminIds = adminUsers.map(u => u._id);

    const visibilityFilter = requestingUserId
      ? { $or: [{ isPublic: true }, { user: requestingUserId }] }
      : { isPublic: true };

    const query = adminIds.length
      ? { $and: [visibilityFilter, { user: { $nin: adminIds } }] }
      : visibilityFilter;

    const posts = await Post.find(query)
      .populate('user', 'username nickname profileIconUrl')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error('Get all posts error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getMyPosts(req, res) {
  try {
    const posts = await Post.find({ user: req.user.id }).populate('user', 'username nickname profileIconUrl').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function updatePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });
    const { title, content } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (req.file) {
      const result = await streamUpload(req);
      post.image = result.secure_url;
    }
    await post.save();
    res.json(await post.populate('user', 'username nickname profileIconUrl'));
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function deletePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });
    await post.deleteOne();
    await Promise.all([
      Like.deleteMany({ post: req.params.id }),
      Comment.deleteMany({ post: req.params.id }),
      Saved.deleteMany({ post: req.params.id }),
    ]);
    res.json({ msg: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function toggleLike(req, res) {
  try {
    const existing = await Like.findOne({ user: req.user.id, post: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false, count: await Like.countDocuments({ post: req.params.id }) });
    }
    await Like.create({ user: req.user.id, post: req.params.id });
    res.json({ liked: true, count: await Like.countDocuments({ post: req.params.id }) });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getLikeStatus(req, res) {
  try {
    const liked = !!(await Like.findOne({ user: req.user.id, post: req.params.id }));
    const count = await Like.countDocuments({ post: req.params.id });
    res.json({ liked, count });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getComments(req, res) {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('user', 'username nickname profileIconUrl')
      .populate('replies.user', 'username nickname')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function addComment(req, res) {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Comment text required' });
    const comment = await Comment.create({ user: req.user.id, post: req.params.id, text });
    res.status(201).json(await comment.populate('user', 'username nickname profileIconUrl'));
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function toggleCommentLike(req, res) {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    const idx = comment.likes.indexOf(req.user.id);
    if (idx > -1) comment.likes.splice(idx, 1);
    else comment.likes.push(req.user.id);
    await comment.save();
    res.json({ liked: idx === -1, count: comment.likes.length });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function addReply(req, res) {
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
}

export async function toggleSave(req, res) {
  try {
    const existing = await Saved.findOne({ user: req.user.id, post: req.params.id });
    if (existing) { await existing.deleteOne(); return res.json({ saved: false }); }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    await Saved.create({ user: req.user.id, post: req.params.id, postTitle: post.title });
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getSaveStatus(req, res) {
  try {
    const saved = !!(await Saved.findOne({ user: req.user.id, post: req.params.id }));
    res.json({ saved });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getFollowingList(req, res) {
  try {
    const following = await Following.findOne({ user: req.user.id }).populate('followingIds', 'username nickname email');
    res.json(following?.followingIds || []);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json([]);
    const query = q.trim();
    const meId = req.user.id;
    const isObjectId = /^[a-f\d]{24}$/i.test(query);

    let users;
    if (isObjectId) {
      const u = await Profile.findById(query).select('username nickname email _id isAdmin');
      users = u && u._id.toString() !== meId && !u.isAdmin ? [u] : [];
    } else {
      users = await Profile.find({
        _id: { $ne: meId },
        isAdmin: { $ne: true },
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
    const pendingRequests = await Notification.find({ sender: meId, type: 'follow_request', status: 'pending' });
    const pendingIds = pendingRequests.map(n => n.recipient.toString());

    const enriched = users.map(u => {
      const uid = u._id.toString();
      const following = iFollow.includes(uid);
      const theyFollow = theyFollowMe.includes(uid);
      return { _id: u._id, username: u.username, nickname: u.nickname, email: u.email, following, requested: pendingIds.includes(uid), friends: following && theyFollow };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}
