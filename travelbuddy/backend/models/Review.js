import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },

  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true },

  itineraryTitle:    { type: String, required: true },
  itineraryOwner:    { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },

  rating:            { type: Number, min: 1, max: 5, required: true },
  description:       { type: String, default: '' },          // Experience description
  plannerRating:     { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'], required: true },
  activitiesFollowed:{ type: String, enum: ['Yes', 'No', 'Not all'], required: true },
  badge:             { type: String, enum: [
    'Hidden Gem',
    'Adventure Master',
    'Budget Wizard',
    'Luxury Curator',
    'Cultural Explorer',
    'Foodie Paradise',
    'Off the Beaten Path',
    'Family Friendly',
    'Solo Traveler Pick',
    'Eco Conscious',
  ], required: true },
}, { timestamps: true });

ReviewSchema.index({ reviewer: 1, itinerary: 1 }, { unique: true });

export default mongoose.model('Review', ReviewSchema);
