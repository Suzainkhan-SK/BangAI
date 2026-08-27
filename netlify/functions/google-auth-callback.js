// google-auth-callback.js — Dedicated Clean Google OAuth 2.0 Auth Callback
// Clean Google-Compliant URL: https://bangai.netlify.app/.netlify/functions/google-auth-callback
// No query strings in Redirect URI to guarantee 100% Google Cloud Console compliance

import crypto from 'crypto';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bang-ai-jwt-production-secret-9a8b7c6d5e4f3a2b1c0';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

// Google OAuth Credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || Buffer.from('MzMyNzA0MTI3NjI5LXFlaDd1N2N2a2pkcGllbHVlZm1wY2VmODVxNjRraGluLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29t', 'base64').toString('utf8');
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || Buffer.from('R0NDU1BYLUdHRF9wdlFOc2pUejAwTWp3MndoQUlNNTlURWQ=', 'base64').toString('utf8');

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Date.now() + TOKEN_EXPIRY_MS
  })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  return {
    id: userDoc.id || userDoc._id,
    name: userDoc.name || 'Bang Creator',
    email: userDoc.email,
    channel: userDoc.channel || `${userDoc.name || 'Creator'}'s Bang AI Studio`,
    niche: userDoc.niche || 'General',
    plan: userDoc.plan || 'Creator Pro Plan',
    credits: typeof userDoc.credits === 'number' ? userDoc.credits : 100,
    avatar: userDoc.avatar || null,
    authProvider: userDoc.authProvider || (userDoc.hash ? 'email' : 'google'),
    createdAt: userDoc.createdAt || new Date().toISOString()
  };
}

export const handler = async (event, context) => {
  const host = event.headers?.host || 'bangai.netlify.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  const code = event.queryStringParameters?.code;
  const error = event.queryStringParameters?.error;
  const state = event.queryStringParameters?.state;

  let returnUrl = `${protocol}://${host}/#/dashboard`;
  if (state) {
    try {
      const parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (parsedState.returnUrl) returnUrl = parsedState.returnUrl;
    } catch (e) {}
  }

  if (error || !code) {
    return {
      statusCode: 302,
      headers: {
        Location: `${protocol}://${host}/#/login?error=${encodeURIComponent(error || 'Google sign-in was cancelled')}`
      },
      body: ''
    };
  }

  try {
    const db = await getDb();
    const usersCol = db.collection('users');

    // Clean Redirect URI exactly matching the one registered in Google Cloud Console
    const redirectUri = `${protocol}://${host}/.netlify/functions/google-auth-callback`;

    // Exchange code for Google tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[google-auth-callback] Token exchange error:', tokenData);
      return {
        statusCode: 302,
        headers: {
          Location: `${protocol}://${host}/#/login?error=${encodeURIComponent(tokenData.error_description || 'Failed to authenticate with Google')}`
        },
        body: ''
      };
    }

    // Fetch Google User Profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();

    if (!profile || !profile.email) {
      return {
        statusCode: 302,
        headers: {
          Location: `${protocol}://${host}/#/login?error=Could+not+retrieve+Google+profile`
        },
        body: ''
      };
    }

    const email = profile.email.toLowerCase();
    const now = new Date().toISOString();

    let userDoc = await usersCol.findOne({ email });

    if (userDoc) {
      // Existing user: Link Google ID and update avatar
      await usersCol.updateOne(
        { _id: userDoc._id },
        {
          $set: {
            googleId: profile.sub,
            avatar: profile.picture || userDoc.avatar,
            authProvider: userDoc.authProvider || 'google',
            lastLoginAt: now,
            updatedAt: now
          }
        }
      );
      userDoc = await usersCol.findOne({ _id: userDoc._id });
      console.log(`[google-auth-callback] Logged in existing user: ${email}`);
    } else {
      // New Google User: Auto-register with 100 credits
      const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
      const newUserDoc = {
        id: userId,
        _id: userId,
        name: profile.name || 'Bang Creator',
        email,
        avatar: profile.picture || null,
        googleId: profile.sub,
        authProvider: 'google',
        channel: `${profile.name || 'Creator'}'s Bang AI Studio`,
        niche: 'General',
        plan: 'Creator Pro Plan',
        credits: 100,
        youtubeChannels: [],
        googleSheets: { connected: false },
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      await usersCol.insertOne(newUserDoc);
      userDoc = newUserDoc;
      console.log(`[google-auth-callback] Registered new user: ${email} (${userId})`);
    }

    const sanitized = sanitizeUser(userDoc);
    const jwtToken = createToken({ userId: userDoc.id || userDoc._id, email: userDoc.email });

    // Redirect to dashboard with session token and sanitized user
    const redirectTarget = `${protocol}://${host}/?auth=google_success&token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(sanitized))}#/dashboard`;

    return {
      statusCode: 302,
      headers: {
        Location: redirectTarget,
        'Cache-Control': 'no-cache'
      },
      body: ''
    };

  } catch (err) {
    console.error('[google-auth-callback] Error:', err);
    return {
      statusCode: 302,
      headers: {
        Location: `${protocol}://${host}/#/login?error=${encodeURIComponent(err.message || 'Internal server error during Google login')}`
      },
      body: ''
    };
  }
};
