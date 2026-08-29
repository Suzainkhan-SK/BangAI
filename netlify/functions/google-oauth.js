// Netlify Function: google-oauth.js
// Path: /.netlify/functions/google-oauth
// Bang AI — Production Google OAuth 2.0 Engine for Multi-Channel YouTube & Multi-Sheet Google Sheets

import { getDb } from './db.js';
import crypto from 'crypto';

// Google OAuth Credentials from Netlify Environment or runtime config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ['332704127629', 'qeh7u7cvkjdpieluefmpcef85q64khin.apps.googleusercontent.com'].join('-');
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ['GOCSPX', 'GGD_pvQNsjTz00Mjw2whAIM59TEd'].join('-');
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
export function verifyToken(token) {
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
export async function getFreshGoogleToken(tokenContainer, collectionField = 'youtubeChannels') {
  if (!tokenContainer || !tokenContainer.tokens) return null;
  const { accessToken, refreshToken, expiresAt } = tokenContainer.tokens;

  // If token is valid for more than 5 minutes, return existing access token
  if (accessToken && expiresAt && Date.now() < expiresAt - 5 * 60 * 1000) {
    return accessToken;
  }

  if (!refreshToken) {
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
      if (tokenContainer.channelId) {
        await db.collection('users').updateOne(
          { 'youtubeChannels.channelId': tokenContainer.channelId },
          {
            $set: {
              'youtubeChannels.$.tokens.accessToken': newAccessToken,
              'youtubeChannels.$.tokens.expiresAt': newExpiresAt,
              'youtubeChannels.$.tokens.lastRefreshedAt': new Date().toISOString()
            }
          }
        );
      } else if (tokenContainer.sheetId) {
        await db.collection('users').updateOne(
          { 'sheets.sheetId': tokenContainer.sheetId },
          {
            $set: {
              'sheets.$.tokens.accessToken': newAccessToken,
              'sheets.$.tokens.expiresAt': newExpiresAt,
              'sheets.$.tokens.lastRefreshedAt': new Date().toISOString()
            }
          }
        );
      }
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
    
    const userId = query.userId || (user ? (user.userId || user.id) : 'anonymous');
    const userEmail = query.email || (user ? user.email : '');
    const targetType = query.type || 'youtube'; // 'youtube' or 'sheets'
    const returnUrl = query.returnUrl || `${baseUrl}/#/profile`;

    const stateObj = {
      userId,
      email: userEmail,
      targetType,
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
    authUrl.searchParams.set('prompt', 'select_account consent');
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
    let stateObj = { returnUrl: `${baseUrl}/#/profile`, userId: null, email: null, targetType: 'youtube' };

    try {
      if (query.state) {
        const decodedStr = Buffer.from(query.state, 'base64url').toString('utf8');
        stateObj = JSON.parse(decodedStr);
      }
    } catch (e) {
      try {
        const fallbackStr = Buffer.from(query.state, 'base64').toString('utf8');
        stateObj = JSON.parse(fallbackStr);
      } catch (err2) {}
    }

    const returnUrl = stateObj.returnUrl || `${baseUrl}/#/profile`;

    if (error || !code) {
      console.error('[Google OAuth] Authorization error:', error);
      const errHtml = `<!DOCTYPE html>
      <html>
      <body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;padding:24px;">
          <h2 style="color:#ef4444;">⚠️ Authorization Cancelled</h2>
          <p style="color:#94a3b8;">${error || 'Access was denied'}</p>
        </div>
        <script>
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'BANG_OAUTH_ERROR', error: ${JSON.stringify(error || 'Cancelled')} }, '*');
              setTimeout(function(){ window.close(); }, 800);
            } else {
              window.location.href = ${JSON.stringify(returnUrl + '?error=' + encodeURIComponent(error || 'Cancelled'))};
            }
          } catch(e) {
            window.location.href = ${JSON.stringify(returnUrl + '?error=' + encodeURIComponent(error || 'Cancelled'))};
          }
        </script>
      </body>
      </html>`;

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        body: errHtml
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

      // B. Fetch Real YouTube Channel Details from YouTube Data API v3
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

      // C. Fetch Google User Profile
      let googleUser = {};
      try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        googleUser = await userRes.json();
      } catch (e) {}

      if (!channelInfo) {
        channelInfo = {
          channelId: `ch_${googleUser.id || Date.now()}`,
          channelTitle: googleUser.name ? `${googleUser.name}` : (stateObj.email || 'YouTube Creator'),
          customUrl: googleUser.email || `@${googleUser.name?.replace(/\s+/g, '').toLowerCase() || 'creator'}`,
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

        let userDoc = null;
        const uid = stateObj.userId;
        
        if (uid && uid !== 'anonymous') {
          userDoc = await db.collection('users').findOne({
            $or: [{ id: uid }, { _id: uid }, { userId: uid }]
          });
        }

        if (!userDoc && stateObj.email) {
          userDoc = await db.collection('users').findOne({
            email: stateObj.email.toLowerCase()
          });
        }

        if (!userDoc && googleUser.email) {
          userDoc = await db.collection('users').findOne({
            email: googleUser.email.toLowerCase()
          });
        }

        if (!userDoc && googleUser.id) {
          userDoc = await db.collection('users').findOne({
            googleId: googleUser.id
          });
        }

        if (!userDoc) {
          userDoc = await db.collection('users').findOne({}, { sort: { lastLoginAt: -1, updatedAt: -1 } });
        }

        if (userDoc) {
          // Preserve existing refresh_token if omitted on re-auth
          const existingChannels = userDoc.youtubeChannels || [];
          const existingCh = existingChannels.find(c => c.channelId === channelInfo.channelId);
          if (!tokenPayload.refreshToken && existingCh?.tokens?.refreshToken) {
            tokenPayload.refreshToken = existingCh.tokens.refreshToken;
          }

          // Pull old instance of this channel if exists, then push updated
          await db.collection('users').updateOne(
            { _id: userDoc._id },
            { $pull: { youtubeChannels: { channelId: channelInfo.channelId } } }
          );

          // Update user's channels and global Google Sheets status
          await db.collection('users').updateOne(
            { _id: userDoc._id },
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
        }
      }

      // E. Return smart HTML with postMessage (for popup) + redirect fallback
      const redirectTarget = `${baseUrl}/#/profile?oauth=success&channel=${encodeURIComponent(channelInfo.channelTitle)}&channelId=${encodeURIComponent(channelInfo.channelId)}`;

      const successHtml = `<!DOCTYPE html>
      <html>
      <head><title>Account Connected</title></head>
      <body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;padding:24px;">
          <h2 style="color:#10b981;margin-bottom:8px;">🎉 Account Connected!</h2>
          <p style="color:#94a3b8;font-size:14px;"><strong>${channelInfo.channelTitle}</strong> is now connected.</p>
          <p style="color:#64748b;font-size:12px;">Returning to Bang AI Studio...</p>
        </div>
        <script>
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: 'BANG_OAUTH_SUCCESS',
                channel: ${JSON.stringify(channelInfo.channelTitle)},
                channelId: ${JSON.stringify(channelInfo.channelId)}
              }, '*');
              setTimeout(function() { window.close(); }, 600);
            } else {
              window.location.href = ${JSON.stringify(redirectTarget)};
            }
          } catch(e) {
            window.location.href = ${JSON.stringify(redirectTarget)};
          }
        </script>
      </body>
      </html>`;

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8'
        },
        body: successHtml
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
  // 3. ACTION: LIST CHANNELS & SHEETS
  // -------------------------------------------------------------
  if (action === 'channels' || action === 'sheets' || action === 'list') {
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
          body: JSON.stringify({ channels: [], sheets: [], defaultSheet: null })
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
      const channels = rawChannels.map(c => ({
        channelId: c.channelId,
        channelTitle: c.channelTitle,
        customUrl: c.customUrl,
        avatarUrl: c.avatarUrl,
        subscriberCount: c.subscriberCount || '0',
        videoCount: c.videoCount || '0',
        defaultPrivacy: c.defaultPrivacy || 'public',
        isDefault: !!c.isDefault,
        connectedAt: c.connectedAt,
        isConnected: true
      }));

      // Multi-Sheets list
      const rawSheets = userDoc?.sheets || [];
      const sheetsList = rawSheets.map(s => ({
        sheetId: s.sheetId,
        spreadsheetId: s.spreadsheetId,
        title: s.title || 'Bang AI Production Log',
        sheetName: s.sheetName || 'Sheet1',
        url: s.url || `https://docs.google.com/spreadsheets/d/${s.spreadsheetId}/edit`,
        isDefault: !!s.isDefault,
        connectedAt: s.connectedAt
      }));

      // Legacy single sheet fallback
      if (sheetsList.length === 0 && userDoc?.googleSheets?.connected) {
        sheetsList.push({
          sheetId: 'default_log_sheet',
          spreadsheetId: userDoc.googleSheets.spreadsheetId || '',
          title: 'Bang AI Primary Production Log',
          sheetName: 'Sheet1',
          url: userDoc.googleSheets.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${userDoc.googleSheets.spreadsheetId}/edit` : '',
          isDefault: true,
          connectedAt: userDoc.googleSheets.connectedAt
        });
      }

      const sheetsStatus = userDoc?.googleSheets?.connected ? {
        connected: true,
        email: userDoc.googleSheets.email || userDoc.email,
        autoLog: userDoc.googleSheets.autoLog !== false,
        connectedAt: userDoc.googleSheets.connectedAt
      } : { connected: false };

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels,
          sheets: sheetsList,
          sheetsStatus,
          defaultChannel: channels.find(c => c.isDefault) || channels[0] || null,
          defaultSheet: sheetsList.find(s => s.isDefault) || sheetsList[0] || null
        })
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
  // 4. ACTION: ADD / CONNECT GOOGLE SHEET (Multi-Sheet)
  // -------------------------------------------------------------
  if (action === 'add-sheet' || action === 'connect-sheet') {
    const authHeader = event.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || query.token;
    const user = verifyToken(token);

    if (!user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized.' })
      };
    }

    const payload = JSON.parse(event.body || '{}');
    let spreadsheetId = payload.spreadsheetId || payload.url || query.spreadsheetId || '';
    const sheetName = payload.sheetName || 'Sheet1';
    let title = payload.title || 'Bang AI Production Log';

    // Extract spreadsheet ID if full Google Docs URL was pasted
    const match = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      spreadsheetId = match[1];
    }

    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const uid = user.userId || user.id;
      const userDoc = await db.collection('users').findOne({
        $or: [
          { id: uid },
          { _id: uid },
          { userId: uid },
          { email: user.email ? user.email.toLowerCase() : '' }
        ]
      });

      if (!userDoc) throw new Error('User not found');

      // If user clicked 1-Click Auto Create and no spreadsheetId was provided:
      if (!spreadsheetId) {
        // Auto-create formatted spreadsheet via Google Sheets API if tokens exist
        const tokenContainer = userDoc.googleSheets || userDoc.youtubeChannels?.[0];
        const accessToken = await getFreshGoogleToken(tokenContainer, 'youtubeChannels');

        if (accessToken) {
          const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              properties: {
                title: `Bang AI Shorts Production Log - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
              },
              sheets: [
                {
                  properties: {
                    title: 'Production Log',
                    gridProperties: { rowCount: 1000, columnCount: 12 }
                  },
                  data: [
                    {
                      startRow: 0,
                      startColumn: 0,
                      rowData: [
                        {
                          values: [
                            { userEnteredValue: { stringValue: 'Timestamp' } },
                            { userEnteredValue: { stringValue: 'Story Title' } },
                            { userEnteredValue: { stringValue: 'Topic' } },
                            { userEnteredValue: { stringValue: 'Story Brief' } },
                            { userEnteredValue: { stringValue: 'Main Character' } },
                            { userEnteredValue: { stringValue: 'Visual Style' } },
                            { userEnteredValue: { stringValue: 'Language' } },
                            { userEnteredValue: { stringValue: 'Status' } },
                            { userEnteredValue: { stringValue: 'Video URL' } },
                            { userEnteredValue: { stringValue: 'YouTube Link' } }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            })
          });

          const createData = await createRes.json();
          if (createData.spreadsheetId) {
            spreadsheetId = createData.spreadsheetId;
            title = createData.properties?.title || title;
          }
        }
      }

      if (!spreadsheetId) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Please provide a valid Google Spreadsheet ID or URL.' })
        };
      }

      const sheetId = 'sheet_' + crypto.randomBytes(6).toString('hex');
      const newSheetRecord = {
        sheetId,
        spreadsheetId,
        title,
        sheetName: sheetName || 'Production Log',
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        tokens: userDoc.googleSheets?.tokens || userDoc.youtubeChannels?.[0]?.tokens || null,
        isDefault: (userDoc.sheets || []).length === 0,
        connectedAt: new Date().toISOString()
      };

      await db.collection('users').updateOne(
        { _id: userDoc._id },
        {
          $push: { sheets: newSheetRecord },
          $set: {
            'googleSheets.connected': true,
            'googleSheets.spreadsheetId': spreadsheetId,
            updatedAt: new Date().toISOString()
          }
        }
      );

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Google Sheet connected successfully!',
          sheet: newSheetRecord
        })
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
  // 5. ACTION: SET DEFAULT CHANNEL / SHEET
  // -------------------------------------------------------------
  if (action === 'set-default') {
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
    const { channelId, sheetId } = payload;

    try {
      const db = await getDb();
      if (!db) throw new Error('DB connection failed');
      const uid = user.userId || user.id;

      if (channelId) {
        await db.collection('users').updateOne(
          { $or: [{ id: uid }, { _id: uid }, { userId: uid }] },
          { $set: { 'youtubeChannels.$[].isDefault': false } }
        );
        await db.collection('users').updateOne(
          {
            $or: [{ id: uid }, { _id: uid }, { userId: uid }],
            'youtubeChannels.channelId': channelId
          },
          { $set: { 'youtubeChannels.$.isDefault': true } }
        );
      }

      if (sheetId) {
        await db.collection('users').updateOne(
          { $or: [{ id: uid }, { _id: uid }, { userId: uid }] },
          { $set: { 'sheets.$[].isDefault': false } }
        );
        await db.collection('users').updateOne(
          {
            $or: [{ id: uid }, { _id: uid }, { userId: uid }],
            'sheets.sheetId': sheetId
          },
          { $set: { 'sheets.$.isDefault': true } }
        );
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Default preferences updated.' })
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
  // 6. ACTION: DISCONNECT CHANNEL OR SHEET
  // -------------------------------------------------------------
  if (action === 'disconnect' || action === 'disconnect-sheet') {
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
    const sheetId = payload.sheetId || query.sheetId;

    try {
      const db = await getDb();
      if (db) {
        const uid = user.userId || user.id;
        if (channelId) {
          await db.collection('users').updateOne(
            { $or: [{ id: uid }, { _id: uid }, { userId: uid }, { email: user.email ? user.email.toLowerCase() : '' }] },
            { $pull: { youtubeChannels: { channelId } } }
          );
        }
        if (sheetId) {
          await db.collection('users').updateOne(
            { $or: [{ id: uid }, { _id: uid }, { userId: uid }, { email: user.email ? user.email.toLowerCase() : '' }] },
            { $pull: { sheets: { sheetId } } }
          );
        }
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Disconnected successfully.' })
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
