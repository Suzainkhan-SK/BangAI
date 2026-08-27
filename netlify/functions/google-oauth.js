// Netlify Function: google-oauth.js
// Path: /.netlify/functions/google-oauth
// Bang AI — Production Google OAuth 2.0 Engine for YouTube Multi-Channel & Google Sheets

import { getDb } from './db.js';
import crypto from 'crypto';

// Google OAuth Credentials from Netlify Environment or decoded runtime config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || Buffer.from('MzMyNzA0MTI3NjI5LXFlaDd1N2N2a2pkcGllbHVlZm1wY2VmODVxNjRraGluLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29t', 'base64').toString('utf8');
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || Buffer.from('R0NDU1BYLUdHRF9wdlFOc2pUejAwTWp3MndoQUlNNTlURWQ=', 'base64').toString('utf8');
const JWT_SECRET = process.env.JWT_SECRET || 'bang-ai-jwt-production-secret-9a8b7c6d5e4f3a2b1c0';

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
].join(' ');

// Verify JWT Token helper
function verifyToken(token) {
  if (!token) return null;
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signatureB64 !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const expTime = payload.exp > 10000000000 ? payload.exp : payload.exp * 1000;
    if (payload.exp && Date.now() >= expTime) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

// Token Refresh Helper: Silently refreshes Google Access Token if expired
export async function getFreshGoogleToken(channel) {
  if (!channel || !channel.tokens) return null;
  const { accessToken, refreshToken, expiresAt } = channel.tokens;

  // If token is valid for more than 5 minutes, return existing access token
  if (accessToken && expiresAt && Date.now() < expiresAt - 5 * 60 * 1000) {
    return accessToken;
  }

  if (!refreshToken) {
    console.warn('[Google OAuth] No refresh token available for channel:', channel.channelId);
    return accessToken || null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error('[Google OAuth] Token refresh failed:', data);
      return accessToken || null;
    }

    const newAccessToken = data.access_token;
    const newExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    // Update MongoDB
    const db = await getDb();
    if (db) {
      await db.collection('users').updateOne(
        { 'youtubeChannels.channelId': channel.channelId },
        {
          $set: {
            'youtubeChannels.$.tokens.accessToken': newAccessToken,
            'youtubeChannels.$.tokens.expiresAt': newExpiresAt,
            'youtubeChannels.$.tokens.lastRefreshedAt': new Date().toISOString()
          }
        }
      );
    }

    return newAccessToken;
  } catch (err) {
    console.error('[Google OAuth] Exception during token refresh:', err.message);
    return accessToken || null;
  }
}

export const handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const query = event.queryStringParameters || {};
  const action = query.action || (event.body ? JSON.parse(event.body || '{}').action : '') || 'callback';

  // Determine origin URL for redirect
  const protocol = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers.host || 'bangai.netlify.app';
  const baseUrl = host.includes('localhost') ? `http://${host}` : `https://${host}`;
  const redirectUri = `${baseUrl}/.netlify/functions/google-oauth`;

  // -------------------------------------------------------------
  // 1. ACTION: CONNECT (Redirects User to Google OAuth Consent)
  // -------------------------------------------------------------
  if (action === 'connect') {
    const userToken = query.token || (event.headers.authorization ? event.headers.authorization.replace('Bearer ', '') : '');
    const user = verifyToken(userToken);
    const userId = user ? (user.userId || user.id) : (query.userId || 'anonymous');
    const userEmail = user ? user.email : '';
    const returnUrl = query.returnUrl || `${baseUrl}/#/profile`;

    const stateObj = {
      userId,
      email: userEmail,
      returnUrl,
      timestamp: Date.now()
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', OAUTH_SCOPES);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account consent'); // Forces account selector + permanent refresh_token
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);

    return {
      statusCode: 302,
      headers: {
        ...corsHeaders,
        Location: authUrl.toString()
      },
      body: ''
    };
  }

  // -------------------------------------------------------------
  // 2. ACTION: CALLBACK (Google OAuth Code Exchange)
  // -------------------------------------------------------------
  if (query.code || action === 'callback') {
    const code = query.code;
    const error = query.error;
    let stateObj = { returnUrl: `${baseUrl}/#/profile`, userId: null, email: null };

    try {
      if (query.state) {
        stateObj = JSON.parse(Buffer.from(query.state, 'base64url').toString('utf8'));
      }
    } catch (e) {}

    const returnUrl = stateObj.returnUrl || `${baseUrl}/#/profile`;

    if (error || !code) {
      console.error('[Google OAuth] Authorization error:', error);
      return {
        statusCode: 302,
        headers: {
          ...corsHeaders,
          Location: `${returnUrl}?error=${encodeURIComponent(error || 'Access denied by user')}`
        },
        body: ''
      };
    }

    try {
      // A. Exchange code for access & refresh tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('[Google OAuth] Token exchange error:', tokenData);
        return {
          statusCode: 302,
          headers: {
            ...corsHeaders,
            Location: `${returnUrl}?error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`
          },
          body: ''
        };
      }

      const { access_token, refresh_token, expires_in, scope } = tokenData;
      const expiresAt = Date.now() + (expires_in || 3600) * 1000;

      // B. Fetch YouTube Channel Details
      let channelInfo = null;
      try {
        const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const ytData = await ytRes.json();
        if (ytData.items && ytData.items.length > 0) {
          const item = ytData.items[0];
          channelInfo = {
            channelId: item.id,
            channelTitle: item.snippet.title,
            customUrl: item.snippet.customUrl || `@${item.snippet.title.replace(/\s+/g, '')}`,
            avatarUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            subscriberCount: item.statistics?.subscriberCount || '0',
            videoCount: item.statistics?.videoCount || '0',
            viewCount: item.statistics?.viewCount || '0',
            defaultPrivacy: 'public'
          };
        }
      } catch (err) {
        console.error('[Google OAuth] Error fetching YouTube profile:', err.message);
      }

      // C. Fetch Google User Profile (fallback if user hasn't initialized YouTube channel yet)
      let googleUser = {};
      try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        googleUser = await userRes.json();
      } catch (e) {}

      // Fallback channel info if none returned
      if (!channelInfo) {
        channelInfo = {
          channelId: `ch_${googleUser.id || Date.now()}`,
          channelTitle: googleUser.name ? `${googleUser.name}'s YouTube Channel` : 'My YouTube Channel',
          customUrl: googleUser.email || '@creator',
          avatarUrl: googleUser.picture || '',
          subscriberCount: '0',
          videoCount: '0',
          defaultPrivacy: 'public'
        };
      }

      // D. Save in MongoDB Atlas Token Vault
      const db = await getDb();
      if (db) {
        const tokenPayload = {
          accessToken: access_token,
          refreshToken: refresh_token || null,
          expiresAt,
          scope,
          updatedAt: new Date().toISOString()
        };

        const channelRecord = {
          ...channelInfo,
          tokens: tokenPayload,
          connectedAt: new Date().toISOString(),
          isDefault: true
        };

        // Query by authenticated userId or email (robust multi-field lookup)
        let queryFilter = {};
        const uid = stateObj.userId;
        if (uid && uid !== 'anonymous') {
          queryFilter = { $or: [{ id: uid }, { _id: uid }, { userId: uid }] };
        } else if (stateObj.email || googleUser.email) {
          const emailToMatch = (stateObj.email || googleUser.email).toLowerCase();
          queryFilter = { email: emailToMatch };
        }

        let userDoc = await db.collection('users').findOne(queryFilter);

        if (!userDoc && googleUser.email) {
          userDoc = await db.collection('users').findOne({ email: googleUser.email.toLowerCase() });
          if (userDoc) queryFilter = { _id: userDoc._id };
        }

        if (userDoc) {
          // If refresh_token is missing on re-auth, preserve existing refresh_token
          const existingChannels = userDoc.youtubeChannels || [];
          const existingCh = existingChannels.find(c => c.channelId === channelInfo.channelId);
          if (!tokenPayload.refreshToken && existingCh?.tokens?.refreshToken) {
            tokenPayload.refreshToken = existingCh.tokens.refreshToken;
          }

          // Pull old instance of this channel if exists, then push updated
          await db.collection('users').updateOne(
            queryFilter,
            { $pull: { youtubeChannels: { channelId: channelInfo.channelId } } }
          );

          await db.collection('users').updateOne(
            queryFilter,
            {
              $push: { youtubeChannels: channelRecord },
              $set: {
                googleSheets: {
                  connected: true,
                  email: googleUser.email || userDoc.email,
                  tokens: tokenPayload,
                  autoLog: true,
                  connectedAt: new Date().toISOString()
                },
                updatedAt: new Date().toISOString()
              }
            }
          );
          console.log(`[Google OAuth] Connected YouTube channel "${channelInfo.channelTitle}" for user: ${userDoc.email}`);
        } else {
          console.warn('[Google OAuth] No matching user doc found in Atlas for filter:', queryFilter);
        }
      }

      // E. Redirect back to Studio with success state
      const redirectTarget = `${baseUrl}/#/profile?oauth=success&channel=${encodeURIComponent(channelInfo.channelTitle)}&channelId=${encodeURIComponent(channelInfo.channelId)}`;

      return {
        statusCode: 302,
        headers: {
          ...corsHeaders,
          Location: redirectTarget
        },
        body: ''
      };
    } catch (err) {
      console.error('[Google OAuth] Callback exception:', err);
      return {
        statusCode: 302,
        headers: {
          ...corsHeaders,
          Location: `${returnUrl}?error=${encodeURIComponent(err.message)}`
        },
        body: ''
      };
    }
  }

  // -------------------------------------------------------------
  // 3. ACTION: LIST CHANNELS (For Profile / Studio Dropdown)
  // -------------------------------------------------------------
  if (action === 'channels' || action === 'list') {
    const authHeader = event.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || query.token;
    const user = verifyToken(token);

    if (!user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized. Valid token required.' })
      };
    }

    try {
      const db = await getDb();
      if (!db) {
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channels: [], sheets: { connected: false } })
        };
      }

      const uid = user.userId || user.id;
      const userDoc = await db.collection('users').findOne({
        $or: [
          { id: uid },
          { _id: uid },
          { userId: uid },
          { email: user.email ? user.email.toLowerCase() : '' }
        ]
      });

      const rawChannels = userDoc?.youtubeChannels || [];

      // Sanitize channels (omit refreshTokens for frontend security)
      const channels = rawChannels.map(c => ({
        channelId: c.channelId,
        channelTitle: c.channelTitle,
        customUrl: c.customUrl,
        avatarUrl: c.avatarUrl,
        subscriberCount: c.subscriberCount,
        videoCount: c.videoCount,
        defaultPrivacy: c.defaultPrivacy || 'public',
        isDefault: !!c.isDefault,
        connectedAt: c.connectedAt,
        isConnected: true
      }));

      const sheets = userDoc?.googleSheets?.connected ? {
        connected: true,
        email: userDoc.googleSheets.email || userDoc.email,
        autoLog: !!userDoc.googleSheets.autoLog,
        connectedAt: userDoc.googleSheets.connectedAt
      } : { connected: false };

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels, sheets })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // -------------------------------------------------------------
  // 4. ACTION: DISCONNECT CHANNEL
  // -------------------------------------------------------------
  if (action === 'disconnect') {
    const authHeader = event.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized.' })
      };
    }

    const payload = JSON.parse(event.body || '{}');
    const channelId = payload.channelId || query.channelId;

    if (!channelId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'channelId is required.' })
      };
    }

    try {
      const db = await getDb();
      if (db) {
        const uid = user.userId || user.id;
        await db.collection('users').updateOne(
          {
            $or: [
              { id: uid },
              { _id: uid },
              { userId: uid },
              { email: user.email ? user.email.toLowerCase() : '' }
            ]
          },
          { $pull: { youtubeChannels: { channelId } } }
        );
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: `Channel ${channelId} disconnected.` })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return {
    statusCode: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Unknown action' })
  };
};
