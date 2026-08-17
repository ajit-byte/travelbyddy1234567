import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import Profile from '../models/Profile.js';
import bcrypt from 'bcryptjs';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, googleProfile, done) => {
      try {
        const email = googleProfile.emails?.[0]?.value;
        const name  = googleProfile.displayName || googleProfile.name?.givenName || 'Traveler';
        const photo = googleProfile.photos?.[0]?.value || '';

        if (!email) return done(new Error('No email returned from Google'), null);

        let user = await Profile.findOne({ email });
        if (user) {
          if (!user.profileIconUrl && photo) { user.profileIconUrl = photo; await user.save(); }
          return done(null, user);
        }

        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        const username = `${baseUsername}_${Date.now().toString(36)}`;
        user = await Profile.create({ username, email, password: randomPassword, nickname: name, profileIconUrl: photo });
        return done(null, user);
      } catch (err) { return done(err, null); }
    }
  )
);


passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['read:user'],
    },
    async (accessToken, refreshToken, githubProfile, done) => {
      try {
        const githubUsername = githubProfile.username;
        const photo          = githubProfile.photos?.[0]?.value || '';
        const profileUrl     = `https://github.com/${githubUsername}`;

        return done(null, { githubUsername, photo, profileUrl });
      } catch (err) { return done(err, null); }
    }
  )
);


const linkedInOAuth2 = new OAuth2Strategy(
  {
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL:         'https://www.linkedin.com/oauth/v2/accessToken',
    clientID:         process.env.LINKEDIN_CLIENT_ID,
    clientSecret:     process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL:      process.env.LINKEDIN_CALLBACK_URL,
    scope:            ['openid', 'profile', 'email'],

    store:            { store: (req, state, meta, cb) => cb(null, state),
                        verify: (req, state, cb) => cb(null, true, state) },
  },
  async (accessToken, refreshToken, params, _profile, done) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      const displayName = data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || 'LinkedIn User';
      const linkedInId  = data.sub;

      return done(null, { linkedInName: displayName, profileUrl: `https://www.linkedin.com/in/${linkedInId}`, linkedInId });
    } catch (err) { return done(err, null); }
  }
);
linkedInOAuth2.name = 'linkedin';
passport.use(linkedInOAuth2);

passport.serializeUser((user, done) => done(null, user.id || user.githubUsername || user.linkedInId || user.discordId));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Profile.findById(id);
    done(null, user);
  } catch (err) { done(err, null); }
});

const discordOAuth2 = new OAuth2Strategy(
  {
    authorizationURL: 'https://discord.com/oauth2/authorize',
    tokenURL:         'https://discord.com/api/oauth2/token',
    clientID:         process.env.DISCORD_CLIENT_ID,
    clientSecret:     process.env.DISCORD_CLIENT_SECRET,
    callbackURL:      process.env.DISCORD_CALLBACK_URL,
    scope:            ['identify', 'email'],
    store: {
      store:  (req, state, meta, cb) => cb(null, state),
      verify: (req, state, cb)       => cb(null, true, state),
    },
  },
  async (accessToken, refreshToken, params, _profile, done) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const res = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      const username   = data.username || 'Discord User';
      const discordId  = data.id;
      const profileUrl = `https://discord.com/users/${discordId}`;

      return done(null, { discordUsername: username, profileUrl, discordId });
    } catch (err) { return done(err, null); }
  }
);
discordOAuth2.name = 'discord';
passport.use(discordOAuth2);

export default passport;
