// auth.js — Production Serverless Authentication & Google OAuth Endpoint
// Supports: Register, Login, Google 1-Click Sign-In/Up, Verify Session (Me), Update Profile
// Backed by: MongoDB Atlas 'users' collection + PBKDF2 Password Hashing + HMAC-SHA256 JWT

import crypto from 'crypto';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bang-ai-jwt-production-secret-9a8b7c6d5e4f3a2b1c0';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

// Google OAuth Credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || Buffer.from('MzMyNzA0MTI3NjI5LXFlaDd1N2N2a2pkcGllbHVlZm1wY2VmODVxNjRraGluLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29t', 'base64').toString('utf8');
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || Buffer.from('R0NDU1BYLUdHRF9wdlFOc2pUejAwTWp3MndoQUlNNTlURWQ=', 'base64').toString('utf8');

// Helper to hash password with PBKDF2
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Helper to verify password
function verifyPassword(password, salt, hash) {
  const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return check === hash;
}

// Helper to generate a signed JWT-like token
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

// Helper to verify signed token
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Clean user object for client consumption (strip passwords/hashes)
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
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
      },
      body: ''
    };
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const db = await getDb();
    const usersCol = db.collection('users');

    const action = event.queryStringParameters?.action || (event.httpMethod === 'GET' ? 'me' : 'login');
    const host = event.headers?.host || 'bangai.netlify.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // ────────────────────────────────────────────────────────────────
    // 0. GOOGLE OAUTH 1-CLICK AUTH (Sign-In & Sign-Up)
    // ────────────────────────────────────────────────────────────────
    if (action === 'google') {
      const redirectUri = `${protocol}://${host}/.netlify/functions/google-auth-callback`;
      const returnUrl = event.queryStringParameters?.returnUrl || `${protocol}://${host}/#/dashboard`;
      const statePayload = Buffer.from(JSON.stringify({ returnUrl })).toString('base64url');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&access_type=offline` +
        `&prompt=${encodeURIComponent('select_account consent')}` +
        `&state=${encodeURIComponent(statePayload)}`;

      return {
        statusCode: 302,
        headers: {
          Location: authUrl,
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    }

    // ────────────────────────────────────────────────────────────────
    // 0C. GOOGLE CREDENTIAL VERIFICATION (Google Popup & One-Tap)
    // ────────────────────────────────────────────────────────────────
    if (action === 'google-verify' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { credential } = body;
      if (!credential) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing Google ID token credential.' })
        };
      }

      // Verify Google ID token using Google TokenInfo endpoint
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      const payload = await verifyRes.json();

      if (!verifyRes.ok || !payload || !payload.email) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: payload?.error_description || 'Invalid Google credential.' })
        };
      }

      const email = payload.email.toLowerCase();
      const now = new Date().toISOString();

      let userDoc = await usersCol.findOne({ email });

      if (userDoc) {
        // Link Google ID & update avatar
        await usersCol.updateOne(
          { _id: userDoc._id },
          {
            $set: {
              googleId: payload.sub,
              avatar: payload.picture || userDoc.avatar,
              authProvider: userDoc.authProvider || 'google',
              lastLoginAt: now,
              updatedAt: now
            }
          }
        );
        userDoc = await usersCol.findOne({ _id: userDoc._id });
        console.log(`[auth.js] GSI login success for user: ${email}`);
      } else {
        // Auto-register new Google user
        const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
        const newUserDoc = {
          id: userId,
          _id: userId,
          name: payload.name || 'Bang Creator',
          email,
          avatar: payload.picture || null,
          googleId: payload.sub,
          authProvider: 'google',
          channel: `${payload.name || 'Creator'}'s Bang AI Studio`,
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
        console.log(`[auth.js] GSI registered new user: ${email} (${userId})`);
      }

      const sanitized = sanitizeUser(userDoc);
      const token = createToken({ userId: userDoc.id || userDoc._id, email: userDoc.email });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Google Sign-In successful!',
          user: sanitized,
          token
        })
      };
    }

    // ────────────────────────────────────────────────────────────────
    // 0B. GOOGLE OAUTH CALLBACK
    // ────────────────────────────────────────────────────────────────
    if (action === 'google-callback') {
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
            Location: `${protocol}://${host}/#/login?error=${encodeURIComponent(error || 'Google authorization cancelled')}`
          },
          body: ''
        };
      }

      // Exchange code for Google access token & id_token
      const redirectUri = `${protocol}://${host}/.netlify/functions/auth?action=google-callback`;
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
        console.error('[auth.js] Google token exchange failed:', tokenData);
        return {
          statusCode: 302,
          headers: {
            Location: `${protocol}://${host}/#/login?error=Failed+to+exchange+Google+token`
          },
          body: ''
        };
      }

      // Fetch Google User Profile info
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

      // Check if user exists in database
      let userDoc = await usersCol.findOne({ email });

      if (userDoc) {
        // Existing user logging in with Google
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
        console.log(`[auth.js] Google login success for existing user: ${email}`);
      } else {
        // Brand new Google Sign Up
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
        console.log(`[auth.js] Registered new Google user: ${email} (${userId})`);
      }

      const sanitized = sanitizeUser(userDoc);
      const jwtToken = createToken({ userId: userDoc.id || userDoc._id, email: userDoc.email });

      // Clean redirect to dashboard with token & user payload
      const redirectTarget = `${protocol}://${host}/#/dashboard?auth=google_success&token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(sanitized))}`;

      return {
        statusCode: 302,
        headers: {
          Location: redirectTarget,
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    }

    // ────────────────────────────────────────────────────────────────
    // 1. REGISTER (Sign Up with Email / Password)
    // ────────────────────────────────────────────────────────────────
    const body = event.body ? JSON.parse(event.body) : {};

    if (action === 'register' && event.httpMethod === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || '').trim();
      const channel = String(body.channel || '').trim();
      const niche = String(body.niche || 'general').trim();
      const plan = body.plan === 'starter' ? 'Free Starter Plan' : 'Creator Pro Plan';
      const initialCredits = plan === 'Creator Pro Plan' ? 100 : 10;

      // Validation
      if (!name) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Please enter your full name.' })
        };
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Please enter a valid email address.' })
        };
      }

      if (!password || password.length < 6) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Password must be at least 6 characters long.' })
        };
      }

      // Check if user already exists
      const existingUser = await usersCol.findOne({ email });
      if (existingUser) {
        // If the user previously registered via Google
        if (existingUser.authProvider === 'google') {
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'This email is already registered using Google Sign-In. Please click "Continue with Google" to sign in.',
              authProvider: 'google'
            })
          };
        }

        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'An account with this email address already exists. Please sign in instead.' })
        };
      }

      // Hash password & create user document
      const { salt, hash } = hashPassword(password);
      const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();

      const newUserDoc = {
        id: userId,
        _id: userId,
        name,
        email,
        channel: channel || `${name}'s Bang AI Studio`,
        niche,
        salt,
        hash,
        authProvider: 'email',
        plan,
        credits: initialCredits,
        youtubeChannels: [],
        googleSheets: { connected: false },
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      await usersCol.insertOne(newUserDoc);
      console.log(`[auth.js] Registered new real user: ${email} (${userId}) in MongoDB`);

      const sanitized = sanitizeUser(newUserDoc);
      const token = createToken({ userId, email });

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Account created successfully!',
          user: sanitized,
          token
        })
      };
    }

    // ────────────────────────────────────────────────────────────────
    // 2. LOGIN (Sign In with Email / Password)
    // ────────────────────────────────────────────────────────────────
    if (action === 'login' && event.httpMethod === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Please provide both email and password.' })
        };
      }

      const userDoc = await usersCol.findOne({ email });

      // If user registered with Google without a password
      if (userDoc && userDoc.authProvider === 'google' && (!userDoc.salt || !userDoc.hash)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'This account was created with Google Sign-In. Please click "Continue with Google" to log in.',
            authProvider: 'google'
          })
        };
      }

      if (!userDoc || !userDoc.salt || !userDoc.hash) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid email or password. Please check your credentials.' })
        };
      }

      const isMatch = verifyPassword(password, userDoc.salt, userDoc.hash);
      if (!isMatch) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid email or password. Please check your credentials.' })
        };
      }

      console.log(`[auth.js] User logged in successfully: ${email} (${userDoc.id || userDoc._id})`);

      const sanitized = sanitizeUser(userDoc);
      const token = createToken({ userId: userDoc.id || userDoc._id, email });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Logged in successfully!',
          user: sanitized,
          token
        })
      };
    }

    // ────────────────────────────────────────────────────────────────
    // 3. ME / VERIFY SESSION
    // ────────────────────────────────────────────────────────────────
    if (action === 'me') {
      const authHeader = event.headers.authorization || event.headers.Authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No authorization token provided.' })
        };
      }

      const payload = verifyToken(token);
      if (!payload || !payload.email) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Session expired or invalid token. Please log in again.' })
        };
      }

      const userDoc = await usersCol.findOne({ email: payload.email.toLowerCase() });
      if (!userDoc) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User account not found.' })
        };
      }

      const sanitized = sanitizeUser(userDoc);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          valid: true,
          user: sanitized
        })
      };
    }

    // ────────────────────────────────────────────────────────────────
    // 4. UPDATE SETTINGS / PROFILE
    // ────────────────────────────────────────────────────────────────
    if (action === 'update-profile' && (event.httpMethod === 'POST' || event.httpMethod === 'PUT')) {
      const authHeader = event.headers.authorization || event.headers.Authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      const payload = verifyToken(token);
      if (!payload || !payload.email) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized. Please log in.' })
        };
      }

      const updateFields = {};
      if (body.name) updateFields.name = String(body.name).trim();
      if (body.channel) updateFields.channel = String(body.channel).trim();
      if (body.niche) updateFields.niche = String(body.niche).trim();
      if (body.avatar) updateFields.avatar = String(body.avatar).trim();
      updateFields.updatedAt = new Date().toISOString();

      await usersCol.updateOne(
        { email: payload.email.toLowerCase() },
        { $set: updateFields }
      );

      const updatedUser = await usersCol.findOne({ email: payload.email.toLowerCase() });
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Profile updated successfully!',
          user: sanitizeUser(updatedUser)
        })
      };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Unknown action: ${action}` })
    };

  } catch (err) {
    console.error('[auth.js] Internal Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal authentication server error. Please try again later.'
      })
    };
  }
};
