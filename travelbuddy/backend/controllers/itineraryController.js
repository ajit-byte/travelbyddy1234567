import Itinerary from '../models/ContentsCreated/Itinerary.js';

export async function createItinerary(req, res) {
  try {
    const {
      title, destinations, startDate, endDate,
      activities, budget = 0, notes = '',
      dailyBreakdown = [], activityItems = [],
      isPublic = false
    } = req.body;

    const newItinerary = new Itinerary({
      user: req.user.id,
      title,
      destinations: Array.isArray(destinations) ? destinations.filter(d => d && d.trim()) : (destinations ? [destinations] : []),
      startDate,
      endDate,
      activities: Array.isArray(activities) ? activities : (activities ? activities.split(',').map(a => a.trim()) : []),
      budget: Number(budget),
      notes,
      dailyBreakdown: Array.isArray(dailyBreakdown) ? dailyBreakdown : [],
      activityItems: Array.isArray(activityItems) ? activityItems.map(a => ({
        dayId: Number(a.dayId) || 1,
        name: a.name || '',
        description: a.description || '',
        time: a.time || '',
        cost: Number(a.cost) || 0,
        location: a.location || '',
        budgetType: a.budgetType || 'Food',
        suggestedBy: a.suggestedBy || '',
      })) : [],
      isPublic: !!isPublic,
    });

    await newItinerary.save();
    res.status(201).json(newItinerary);
  } catch (err) {
    console.error('createItinerary error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getPublicItineraries(req, res) {
  try {
    // Exclude itineraries created by admin users
    const { default: Profile } = await import('../models/Profile.js');
    const adminUsers = await Profile.find({ isAdmin: true }).select('_id');
    const adminIds = adminUsers.map(u => u._id);

    const itineraries = await Itinerary.find({
      isPublic: true,
      endDate: { $gte: new Date() },  // hide expired trips
      ...(adminIds.length && { user: { $nin: adminIds } }),
    })
      .populate('user', 'username nickname profileIconUrl')
      .sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getMyItineraries(req, res) {
  try {
    const itineraries = await Itinerary.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function updateItinerary(req, res) {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ msg: 'Itinerary not found' });
    if (itinerary.user.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    const {
      title, destinations, startDate, endDate,
      activities, budget, notes, dailyBreakdown,
      activityItems, isPublic
    } = req.body;

    if (title) itinerary.title = title;
    if (destinations) itinerary.destinations = Array.isArray(destinations) ? destinations.filter(d => d && d.trim()) : [destinations];
    if (startDate) itinerary.startDate = startDate;
    if (endDate) itinerary.endDate = endDate;
    if (activities !== undefined) itinerary.activities = Array.isArray(activities) ? activities : (activities ? activities.split(',').map(a => a.trim()) : []);
    if (budget !== undefined) itinerary.budget = Number(budget);
    if (notes !== undefined) itinerary.notes = notes;
    if (dailyBreakdown !== undefined) itinerary.dailyBreakdown = Array.isArray(dailyBreakdown) ? dailyBreakdown : [];
    if (activityItems !== undefined) {
      itinerary.activityItems = Array.isArray(activityItems) ? activityItems.map(a => ({
        dayId: Number(a.dayId) || 1,
        name: a.name || '',
        description: a.description || '',
        time: a.time || '',
        cost: Number(a.cost) || 0,
        location: a.location || '',
        budgetType: a.budgetType || 'Food',
        suggestedBy: a.suggestedBy || '',
      })) : [];
    }
    if (isPublic !== undefined) itinerary.isPublic = !!isPublic;

    await itinerary.save();
    res.json(itinerary);
  } catch (err) {
    console.error('updateItinerary error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function deleteItinerary(req, res) {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ msg: 'Itinerary not found' });
    if (itinerary.user.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });
    await itinerary.deleteOne();
    res.json({ msg: 'Itinerary deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}
