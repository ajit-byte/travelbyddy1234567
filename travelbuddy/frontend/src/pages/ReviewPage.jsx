import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const BADGES = [
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
];

const BADGE_ICONS = {
  'Hidden Gem':          '💎',
  'Adventure Master':    '🏔️',
  'Budget Wizard':       '💰',
  'Luxury Curator':      '✨',
  'Cultural Explorer':   '🏛️',
  'Foodie Paradise':     '🍜',
  'Off the Beaten Path': '🗺️',
  'Family Friendly':     '👨‍👩‍👧',
  'Solo Traveler Pick':  '🎒',
  'Eco Conscious':       '🌿',
};

export default function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itineraryId, itineraryTitle } = location.state || {};

  const [rating, setRating]                   = useState(0);
  const [hoverRating, setHoverRating]         = useState(0);
  const [description, setDescription]         = useState('');
  const [plannerRating, setPlannerRating]     = useState('');
  const [activitiesFollowed, setActivities]   = useState('');
  const [badge, setBadge]                     = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [submitted, setSubmitted]             = useState(false);
  const [error, setError]                     = useState('');

  const token = () => JSON.parse(localStorage.getItem('authTokens'))?.token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating)              return setError('Please select a star rating.');
    if (!plannerRating)       return setError('Please rate the trip planner.');
    if (!activitiesFollowed)  return setError('Please answer the activities question.');
    if (!badge)               return setError('Please select a badge for this trip.');

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token() || '' },
        body: JSON.stringify({ itineraryId, rating, description, plannerRating, activitiesFollowed, badge }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.msg || 'Submission failed.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!itineraryId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">No trip selected for review.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />

      <main className="pt-24 pb-20 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">Trip Review</span>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight leading-tight">{itineraryTitle || 'Untitled Trip'}</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Share your honest experience to help future travelers.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Star Rating ── */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">star</span>
              Overall Rating
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      color: star <= (hoverRating || rating) ? '#F59E0B' : '#E5E7EB',
                    }}
                  >star</span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-bold mt-2 text-amber-600">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
              </p>
            )}
          </section>

          {/* ── Experience Description ── */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_note</span>
              Describe Your Experience
            </h2>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="What made this trip memorable? Any highlights or things to improve?"
              className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </section>

          {/* ── Trip Planner Rating ── */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">person_check</span>
              How was the Trip Planner?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {['Excellent', 'Good', 'Average', 'Poor'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPlannerRating(opt)}
                  className={`py-3 px-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                    plannerRating === opt
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  {opt === 'Excellent' ? '🌟 Excellent' : opt === 'Good' ? '👍 Good' : opt === 'Average' ? '😐 Average' : '👎 Poor'}
                </button>
              ))}
            </div>
          </section>

          {/* ── Activities Followed ── */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">checklist</span>
              Did all trip activities go according to the plan?
            </h2>
            <div className="flex gap-3">
              {['Yes', 'No', 'Not all'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setActivities(opt)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                    activitiesFollowed === opt
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  {opt === 'Yes' ? '✅ Yes' : opt === 'No' ? '❌ No' : '⚠️ Not all'}
                </button>
              ))}
            </div>
          </section>

          {/* ── Badge ── */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">military_tech</span>
              What badge does this itinerary deserve?
            </h2>
            <p className="text-xs text-outline mb-4">Choose the one that best describes this trip.</p>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(b)}
                  className={`py-3 px-4 rounded-2xl text-sm font-bold border-2 transition-all text-left flex items-center gap-2 ${
                    badge === b
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-secondary/40'
                  }`}
                >
                  <span>{BADGE_ICONS[b]}</span>
                  <span>{b}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="bg-error-container/30 border border-error/30 rounded-2xl px-4 py-3 text-sm text-error font-medium">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-br from-primary to-secondary text-white font-bold py-4 rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </main>

      {/* ── Success Modal ── */}
      {submitted && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-emerald-500 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="text-2xl font-extrabold text-primary mb-2">Review Submitted!</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              Thank you for sharing your experience. Your review helps the community make better travel decisions.
            </p>
            <button
              onClick={() => navigate('/homepage')}
              className="w-full bg-primary text-white py-3.5 rounded-full font-bold hover:bg-primary/90 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
