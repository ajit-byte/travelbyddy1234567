import Notification from '../models/Notification.js';
import Following from '../models/SocialGraph/Following.js';
import Followers from '../models/SocialGraph/Followers.js';
import Profile from '../models/Profile.js';
import Post from '../models/ContentsCreated/Post.js';
import Itinerary from '../models/ContentsCreated/Itinerary.js';
import Like from '../models/ActivityLog/Like.js';
import Comment from '../models/ActivityLog/Comment.js';
import Saved from '../models/ActivityLog/Saved.js';
import { streamUpload } from '../utils/cloudinaryUpload.js';

async function isFollowing(userId, targetId) {
  const exists = await Following.exists({ user: userId, followingIds: targetId });
  return !!exists;
}

export async function getFollowStatus(req, res) {
  try {
    const { targetId } = req.params;
    const meId = req.user.id;
    const following = await isFollowing(meId, targetId);
    const theyFollowMe = await isFollowing(targetId, meId);
    const pending = await Notification.findOne({ sender: meId, recipient: targetId, type: 'follow_request', status: 'pending' });
    res.json({ following, requested: !!pending, friends: following && theyFollowMe });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function sendFollowRequest(req, res) {
  try {
    const { targetId } = req.params;
    const meId = req.user.id;
    if (meId === targetId) return res.status(400).json({ msg: 'Cannot follow yourself' });
    if (await isFollowing(meId, targetId)) return res.status(400).json({ msg: 'Already following' });
    const existing = await Notification.findOne({ sender: meId, recipient: targetId, type: 'follow_request', status: 'pending' });
    if (existing) return res.status(400).json({ msg: 'Request already sent' });
    await Notification.create({ recipient: targetId, sender: meId, type: 'follow_request' });
    res.json({ msg: 'Follow request sent' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function unfollow(req, res) {
  try {
    const { targetId } = req.params;
    const meId = req.user.id;
    await Following.updateOne({ user: meId }, { $pull: { followingIds: targetId } });
    await Followers.updateOne({ user: targetId }, { $pull: { followerIds: meId } });
    await Notification.deleteMany({ sender: meId, recipient: targetId, type: 'follow_request' });
    res.json({ msg: 'Unfollowed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getNotifications(req, res) {
  try {
    const notifs = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'username nickname')
      .sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function acceptNotification(req, res) {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif || notif.recipient.toString() !== req.user.id) return res.status(404).json({ msg: 'Not found' });
    notif.status = 'accepted';
    await notif.save();
    const followerId = notif.sender.toString();
    const followedId = req.user.id;
    await Following.findOneAndUpdate({ user: followerId }, { $addToSet: { followingIds: followedId } }, { upsert: true });
    await Followers.findOneAndUpdate({ user: followedId }, { $addToSet: { followerIds: followerId } }, { upsert: true });
    await Notification.create({ recipient: followerId, sender: followedId, type: 'follow_accepted', status: 'read' });
    res.json({ msg: 'Accepted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function declineNotification(req, res) {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif || notif.recipient.toString() !== req.user.id) return res.status(404).json({ msg: 'Not found' });
    notif.status = 'declined';
    await notif.save();
    res.json({ msg: 'Declined' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: 'read' });
    res.json({ msg: 'Marked read' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getMyProfile(req, res) {
  try {
    const meId = req.user.id;
    const profile = await Profile.findById(meId).select('-password');
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    const [followingRec, followersRec, postCount, tripCount] = await Promise.all([
      Following.findOne({ user: meId }),
      Followers.findOne({ user: meId }),
      Post.countDocuments({ user: meId }),
      Itinerary.countDocuments({ user: meId }),
    ]);
    res.json({
      _id: profile._id, username: profile.username, nickname: profile.nickname,
      email: profile.email, bio: profile.bio, profileIconUrl: profile.profileIconUrl,
      coverImageUrl: profile.coverImageUrl,
      stats: {
        posts: postCount, trips: tripCount,
        followers: followersRec?.followerIds?.length || 0,
        following: followingRec?.followingIds?.length || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const { bio, nickname, username, email, phoneNo, profileIconUrl, coverImageUrl } = req.body;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (nickname !== undefined) updates.nickname = nickname;
    if (username?.trim()) updates.username = username.trim();
    if (email?.trim()) updates.email = email.trim();
    if (phoneNo !== undefined) updates.phoneNo = phoneNo;
    if (profileIconUrl !== undefined) updates.profileIconUrl = profileIconUrl;
    if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl;
    const profile = await Profile.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(profile);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file provided' });
    try {
      const result = await streamUpload(req, req.body.folder || 'profiles');
      return res.json({ url: result.secure_url });
    } catch (cloudErr) {
      console.warn('Cloudinary fallback to base64:', cloudErr.message);
      const b64 = req.file.buffer.toString('base64');
      return res.json({ url: `data:${req.file.mimetype};base64,${b64}` });
    }
  } catch (err) {
    res.status(500).json({ msg: 'Upload failed' });
  }
}

async function enrichPostsWithCounts(posts) {
  if (!posts.length) return [];
  const postIds = posts.map(p => p._id);
  const [likeCounts, commentCounts, saveCounts] = await Promise.all([
    Like.aggregate([{ $match: { post: { $in: postIds } } }, { $group: { _id: '$post', count: { $sum: 1 } } }]),
    Comment.aggregate([{ $match: { post: { $in: postIds } } }, { $group: { _id: '$post', count: { $sum: 1 } } }]),
    Saved.aggregate([{ $match: { post: { $in: postIds } } }, { $group: { _id: '$post', count: { $sum: 1 } } }]),
  ]);
  const toMap = arr => Object.fromEntries(arr.map(r => [r._id.toString(), r.count]));
  const lm = toMap(likeCounts), cm = toMap(commentCounts), sm = toMap(saveCounts);
  return posts.map(p => ({
    ...p.toObject(),
    likeCount: lm[p._id.toString()] || 0,
    commentCount: cm[p._id.toString()] || 0,
    saveCount: sm[p._id.toString()] || 0,
  }));
}

export async function getProfilePosts(req, res) {
  try {
    const posts = await Post.find({ user: req.user.id }).populate('user', 'username nickname profileIconUrl').sort({ createdAt: -1 });
    res.json(await enrichPostsWithCounts(posts));
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
}

export async function getLikedPosts(req, res) {
  try {
    const likes = await Like.find({ user: req.user.id }).select('post');
    const posts = await Post.find({ _id: { $in: likes.map(l => l.post) } }).populate('user', 'username nickname profileIconUrl').sort({ createdAt: -1 });
    res.json(await enrichPostsWithCounts(posts));
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
}

export async function getSavedPosts(req, res) {
  try {
    const saves = await Saved.find({ user: req.user.id }).select('post');
    const posts = await Post.find({ _id: { $in: saves.map(s => s.post) } }).populate('user', 'username nickname profileIconUrl').sort({ createdAt: -1 });
    res.json(await enrichPostsWithCounts(posts));
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
}

export async function getMutualFollowers(req, res) {
  try {
    const meId = req.user.id;
    const myFollowing = await Following.findOne({ user: meId });
    const iFollow = myFollowing?.followingIds.map(id => id.toString()) || [];
    const theirFollowing = await Following.find({ followingIds: meId });
    const theyFollowMe = theirFollowing.map(r => r.user.toString());
    const mutualIds = iFollow.filter(id => theyFollowMe.includes(id));
    const users = await Profile.find({
      _id: { $in: mutualIds },
      isAdmin: { $ne: true },
    }).select('username nickname profileIconUrl');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}
