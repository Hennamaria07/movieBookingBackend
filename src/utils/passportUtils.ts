import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as AppleStrategy } from 'passport-apple';
import User from '../models/user.model';
import { Request } from 'express';

// Load environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || '';
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Helper function to find or create user
const findOrCreateUser = async (profile: any, provider: string) => {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error('Email not provided from OAuth provider');
  }

  let user = await User.findOne({ email });
  
  if (!user) {
    // Create a new user
    user = new User({
      email,
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
      lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
      isVerified: true,
      socialLogin: {
        [`${provider}Id`]: profile.id
      }
    });
    await user.save();
  } else if (!user.socialLogin?.[`${provider}Id`]) {
    // Update existing user with the social ID
    user.socialLogin = {
      ...user.socialLogin,
      [`${provider}Id`]: profile.id
    };
    await user.save();
  }
  
  return user;
};

// Configure Passport.js
export const configurePassport = () => {
  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/api/v1/auth/google/callback`,
    passReqToCallback: true
  }, async (req: Request, accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, 'google');
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: `${BASE_URL}/api/v1/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name'],
    passReqToCallback: true
  }, async (req: Request, accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, 'facebook');
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // Apple Strategy
  passport.use(new AppleStrategy({
    clientID: APPLE_CLIENT_ID,
    teamID: APPLE_TEAM_ID,
    keyID: APPLE_KEY_ID,
    privateKeyString: APPLE_PRIVATE_KEY,
    callbackURL: `${BASE_URL}/api/v1/auth/apple/callback`,
    passReqToCallback: true
  }, async (req: Request, accessToken, refreshToken, idToken, profile, done) => {
    try {
      // Apple returns limited profile info, extract from idToken if needed
      const user = await findOrCreateUser(profile, 'apple');
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // Serialize & Deserialize User
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

export default configurePassport;