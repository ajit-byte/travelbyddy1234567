import express from 'express';
import auth from '../middleware/auth.js';
import Review from '../models/Review.js';
import Itinerary from '../models/ContentsCreated/Itinerary.js';
import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';

const router = express.Router();


router.get('/pending', auth, async (req, res) => {
  try {
    const currentUser = await Profile.findById(req.user.id).select('username');
    if (!currentUser) return res.json({ pending: null });

    const now = new Date();

    const finishedJoined = await Itinerary.find({
      members: currentUser.username,
      user: { $ne: req.user.id },   // never the owner
      endDate: { $lt: now },
    }).select('_id title user endDate');

    if (!finishedJoined.length) return res.json({ pending: null });

    const alreadyReviewed = await Review.find({
      reviewer: req.user.id,
      itinerary: { $in: finishedJoined.map(i => i._id) },
    }).select('itinerary');
    const reviewedIds = new Set(alreadyReviewed.map(r => r.itinerary.toString()));

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const snoozed = await Notification.find({
      recipient: req.user.id,
      type: 'review_request',
      status: 'pending',
      createdAt: { $gte: todayStart },
    }).select('itinerary');
    const snoozedIds = new Set(snoozed.map(n => n.itinerary?.toString()));

    const pending = finishedJoined.find(
      i => !reviewedIds.has(i._id.toString()) && !snoozedIds.has(i._id.toString())
    );

    if (!pending) return res.json({ pending: null });

    res.json({
      pending: {
        _id: pending._id,
        title: pending.title,
        endDate: pending.endDate,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/snooze/:itineraryId', auth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.itineraryId).select('title user');
    if (!itinerary) return res.status(404).json({ msg: 'Itinerary not found' });

     const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await Notification.deleteMany({
      recipient: req.user.id,
      itinerary: req.params.itineraryId,
      type: 'review_request',
      status: 'pending',
    });

    await Notification.create({
      recipient: req.user.id,
      sender: itinerary.user,
      type: 'review_request',
      itinerary: req.params.itineraryId,
      message: `How was your trip "${itinerary.title}"? Share your experience!`,
      status: 'pending',
    });

    res.json({ msg: 'Snoozed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/', auth, async (req, res) => {
  try {
    const { itineraryId, rating, description, plannerRating, activitiesFollowed, badge } = req.body;

    if (!itineraryId || !rating || !plannerRating || !activitiesFollowed || !badge) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const itinerary = await Itinerary.findById(itineraryId).select('title user');

     let itineraryTitle = itinerary?.title;
    let itineraryOwner = itinerary?.user;

    if (!itinerary) {
      const existingReview = await Review.findOne({ itinerary: itineraryId });
      if (existingReview) {
        itineraryTitle = existingReview.itineraryTitle;
        itineraryOwner = existingReview.itineraryOwner;
      } else {
        const Notification = (await import('../models/Notification.js')).default;
        const joinAccepted = await Notification.findOne({
          recipient: req.user.id,
          itinerary: itineraryId,
          type: 'trip_join_accepted',
        });
        if (!joinAccepted) {
          return res.status(404).json({ msg: 'Itinerary not found and no membership record exists.' });
        }
        itineraryTitle = 'Deleted Trip';
        itineraryOwner = joinAccepted.sender;
      }
    } else {
      if (itinerary.user.toString() === req.user.id) {
        return res.status(403).json({ msg: 'You cannot review your own itinerary' });
      }
    }

    const review = await Review.findOneAndUpdate(
      { reviewer: req.user.id, itinerary: itineraryId },
      {
        reviewer: req.user.id,
        itinerary: itineraryId,
        itineraryTitle,
        itineraryOwner,
        rating: Number(rating),
        description,
        plannerRating,
        activitiesFollowed,
        badge,
      },
      { upsert: true, new: true }
    );

    const Notification = (await import('../models/Notification.js')).default;
    await Notification.updateMany(
      { recipient: req.user.id, itinerary: itineraryId, type: 'review_request' },
      { status: 'read' }
    );

    res.json({ msg: 'Review submitted', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/itinerary/by-owner/:userId', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const reviews = await Review.find({ itineraryOwner: req.params.userId })
      .populate('reviewer', 'username nickname profileIconUrl')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/itinerary/:itineraryId', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ itinerary: req.params.itineraryId })
      .populate('reviewer', 'username nickname profileIconUrl')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/stats/:userId', auth, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const reviewStats = await Review.aggregate([
      { $match: { itineraryOwner: userId } },
      { $group: {
        _id: null,
        avgRating:  { $avg: '$rating' },
        count:      { $sum: 1 },
        badges:     { $push: '$badge' },
        plannerRatings: { $push: '$plannerRating' },
      }},
    ]);

    const avgRating    = reviewStats[0]?.avgRating    || 0;
    const reviewCount  = reviewStats[0]?.count        || 0;
    const allBadges    = reviewStats[0]?.badges       || [];

    const badgeCount = allBadges.reduce((acc, b) => { acc[b] = (acc[b] || 0) + 1; return acc; }, {});
    const topBadges  = Object.entries(badgeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([badge, count]) => ({ badge, count }));

    const profile = await Profile.findById(req.params.userId)
      .select('bio profileIconUrl phoneNo travelPreferences linkedAccounts');
    const VerificationStatus = (await import('../models/VerificationStatus.js')).default;
    const vs = await VerificationStatus.findOne({ user: req.params.userId });
    const isVerified = vs?.status === 'verified';

    const kycScore         = isVerified ? 30 : 0;
    const ratingScore      = Math.round((avgRating / 5) * 25);
    const reviewScore      = Math.round(Math.min(reviewCount / 10, 1) * 15);
    const linkedCount      = (profile?.linkedAccounts || []).length;
    const linkedScore      = Math.round(Math.min(linkedCount / 5, 1) * 20);
    const completeness     = [
      !!profile?.bio,
      !!profile?.profileIconUrl,
      !!profile?.phoneNo,
      (profile?.travelPreferences || []).length > 0,
    ].filter(Boolean).length;
    const completenessScore = Math.round((completeness / 4) * 10);
    const trustScore = kycScore + ratingScore + reviewScore + linkedScore + completenessScore;

    res.json({
      rating:      Math.round(avgRating * 10) / 10,
      reviews:     reviewCount,
      topBadges,
      badgeCount,
      trustScore:  Math.min(trustScore, 100),
      breakdown: {
        kyc:          kycScore,
        rating:       ratingScore,
        reviewCount:  reviewScore,
        linkedAccounts: linkedScore,
        completeness: completenessScore,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
