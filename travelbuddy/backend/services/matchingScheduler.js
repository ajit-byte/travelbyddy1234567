import cron from 'node-cron';
import Profile from '../models/Profile.js';
import MatchNotification from '../models/MatchNotification.js';
import MatchCache from '../models/MatchCache.js';
import Following from '../models/SocialGraph/Following.js';
import { scoreCompatibility } from './matchingService.js';


async function runMatchingForUser(currentUser) {
  // Exclude users the current user is already following
  const followingDoc = await Following.findOne({ user: currentUser._id });
  const alreadyFollowingIds = followingDoc?.followingIds ?? [];

  const candidates = await Profile.find({
    _id: { $ne: currentUser._id, $nin: alreadyFollowingIds },
    isAdmin: { $ne: true },
    onboardingComplete: true,
  }).select('-password').limit(50);

  const scored = [];

  for (const candidate of candidates) {
    try {
      const cacheQuery = {
        $or: [
          { userA: currentUser._id, userB: candidate._id },
          { userA: candidate._id, userB: currentUser._id },
        ],
      };

      let cachedMatch = await MatchCache.findOne(cacheQuery);
      let result;

      if (cachedMatch) {
        result = {
          score: cachedMatch.score,
          verdict: cachedMatch.verdict,
          sharedSignals: cachedMatch.sharedSignals,
          destinationOverlap: cachedMatch.destinationOverlap,
          matchReason: cachedMatch.matchReason,
        };
      } else {
        result = await scoreCompatibility(currentUser, candidate);
        await MatchCache.create({
          userA: currentUser._id,
          userB: candidate._id,
          score: result.score,
          verdict: result.verdict,
          sharedSignals: result.sharedSignals,
          destinationOverlap: result.destinationOverlap,
          matchReason: result.matchReason,
        });
      }

      if (result.verdict === 'high' || result.score >= 60) {
        scored.push({ candidate, result });
      }
    } catch (err) {
      console.error(`[Scheduler] Scoring error for candidate ${candidate._id}:`, err.message);
    }
  }

  const topMatches = scored
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 2);

  if (topMatches.length > 0) {
    await MatchNotification.create({
      userId: currentUser._id,
      matchCount: topMatches.length,
      matches: topMatches.map(m => ({
        userId: m.candidate._id,
        score: m.result.score,
        matchReason: m.result.matchReason,
        sharedSignals: m.result.sharedSignals,
        destinationOverlap: m.result.destinationOverlap,
      })),
      read: false,
    });
  }

  return topMatches.length;
}

/**
 * Run matching for all eligible users (onboarding complete, non-admin).
 * Processes users sequentially to avoid hammering the DB.
 */
async function runGlobalMatching() {
  console.log('[Scheduler] Starting global matching run...');
  const start = Date.now();

  try {
    const users = await Profile.find({
      isAdmin: { $ne: true },
      onboardingComplete: true,
    }).select('-password');

    console.log(`[Scheduler] Processing ${users.length} users...`);

    let totalMatches = 0;
    for (const user of users) {
      try {
        const count = await runMatchingForUser(user);
        totalMatches += count;
      } catch (err) {
        console.error(`[Scheduler] Failed for user ${user._id}:`, err.message);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[Scheduler] Done. ${totalMatches} match notifications created across ${users.length} users in ${elapsed}s`);
  } catch (err) {
    console.error('[Scheduler] Global matching run failed:', err.message);
  }
}

// Start the cron job — runs every 6 hours.
// Cron expression: "0 */6 * * *"  (at minute 0 of every 6th hour)
export function startMatchingScheduler() {
  cron.schedule('0 */6 * * *', runGlobalMatching, {
    timezone: 'UTC',
  });

  console.log('[Scheduler] Matching scheduler started — runs every 6 hours (UTC)');
}

/**
 * Exported for manual test triggering only.
 * Remove or guard with admin auth before going to production.
 */
export { runGlobalMatching };
