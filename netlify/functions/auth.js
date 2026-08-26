// auth.js — Production Serverless Authentication Endpoint
// Supports: Register, Login, Verify Session (Me), Update Profile
// Backed by: MongoDB Atlas 'users' collection + PBKDF2 Password Hashing + HMAC-SHA256 JWT

import crypto from 'crypto';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'shortsai-prod-jwt-secret-9948271a0b3c4d5e6f7a8b9c0';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

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
    name: userDoc.name || 'Creator',
    email: userDoc.email,
    channel: userDoc.channel || `${userDoc.name || 'Creator'}'s Shorts Studio`,
    niche: userDoc.niche || 'General',
    plan: userDoc.plan || 'Creator Pro Plan',
    credits: typeof userDoc.credits === 'number' ? userDoc.credits : 100,
    avatar: userDoc.avatar || null,
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
    const body = event.body ? JSON.parse(event.body) : {};

    // ────────────────────────────────────────────────────────────────
    // 1. REGISTER (Sign Up)
    // ────────────────────────────────────────────────────────────────
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
        channel: channel || `${name}'s Viral Shorts Studio`,
        niche,
        salt,
        hash,
        plan,
        credits: initialCredits,
        createdAt: now,
        updatedAt: now
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
    // 2. LOGIN (Sign In)
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
          body: JSON.stringify({ error: 'Session expired or invalid token.' })
        };
      }

      const userDoc = await usersCol.findOne({ email: payload.email });
      if (!userDoc) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User account not found.' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          user: sanitizeUser(userDoc)
        })
      };
    }

    // ────────────────────────────────────────────────────────────────
    // 4. UPDATE PROFILE
    // ────────────────────────────────────────────────────────────────
    if (action === 'profile' && event.httpMethod === 'POST') {
      const authHeader = event.headers.authorization || event.headers.Authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const payload = verifyToken(token);

      if (!payload || !payload.email) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized.' })
        };
      }

      const updates = {};
      if (body.name) updates.name = String(body.name).trim();
      if (body.channel) updates.channel = String(body.channel).trim();
      if (body.niche) updates.niche = String(body.niche).trim();
      updates.updatedAt = new Date().toISOString();

      await usersCol.updateOne({ email: payload.email }, { $set: updates });
      const freshUser = await usersCol.findOne({ email: payload.email });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Profile updated successfully!',
          user: sanitizeUser(freshUser)
        })
      };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Unknown action: ${action}` })
    };

  } catch (err) {
    console.error('[auth.js] Error handling request:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error: ' + err.message })
    };
  }
};
