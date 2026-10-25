// Netlify Function: template-series.js
// Path: /.netlify/functions/template-series
// Bang AI — Reads BangAI Master Google Sheet via Service Account to find eligible continuation series

import crypto from 'crypto';
import { verifyToken } from './google-oauth.js';

const BANGAI_MASTER_SPREADSHEET_ID = '1qQmicPbz4RKqNAWfXjr-LgOKSAthPMWqreqr3JskcIc';

// In-memory cache: Google OAuth service account token (valid up to 1 hr)
let serviceAccountTokenCache = {
  token: null,
  expiresAt: 0
};

// In-memory cache: Sheets data for up to 60 seconds
let sheetDataCache = {
  timestamp: 0,
  seriesRows: null,
  storiesRows: null
};

/**
 * Parses the Google Service Account credentials from environment variable.
 * Handles raw JSON or base64-encoded JSON, plus escaped newlines in private_key.
 */
export function parseServiceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw || !raw.trim()) return null;

  try {
    let jsonStr = raw.trim();
    if (!jsonStr.startsWith('{')) {
      jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8');
    }
    const parsed = JSON.parse(jsonStr);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (err) {
    console.warn('[template-series] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', err.message);
    return null;
  }
}

/**
 * Generates an OAuth2 assertion JWT and exchanges it for a Google Service Account Access Token
 * Scope: https://www.googleapis.com/auth/spreadsheets.readonly
 */
export async function getServiceAccountAccessToken() {
  const sa = parseServiceAccountKey();
  if (!sa || !sa.client_email || !sa.private_key) {
    return null;
  }

  // Reuse cached token if valid for more than 5 minutes
  if (serviceAccountTokenCache.token && Date.now() < serviceAccountTokenCache.expiresAt - 5 * 60 * 1000) {
    return serviceAccountTokenCache.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${encodedHeader}.${encodedClaim}`);
  const signature = signer.sign(sa.private_key, 'base64url');
  const jwtAssertion = `${encodedHeader}.${encodedClaim}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google OAuth token exchange failed (${res.status}): ${errorText}`);
  }

  const tokenData = await res.json();
  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in || 3600;

  serviceAccountTokenCache = {
    token: accessToken,
    expiresAt: Date.now() + expiresIn * 1000
  };

  return accessToken;
}

/**
 * Fetches Series and Stories tabs from BangAI Master Sheet with 60-second in-memory caching.
 */
export async function getSheetRows(spreadsheetId, accessToken) {
  const now = Date.now();
  if (sheetDataCache.seriesRows && sheetDataCache.storiesRows && (now - sheetDataCache.timestamp < 60000)) {
    return {
      seriesRows: sheetDataCache.seriesRows,
      storiesRows: sheetDataCache.storiesRows
    };
  }

  const [seriesRes, storiesRes] = await Promise.all([
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Series!A:J`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Stories!A:Z`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  ]);

  if (!seriesRes.ok) {
    const errText = await seriesRes.text();
    throw new Error(`Failed to fetch Series tab (${seriesRes.status}): ${errText}`);
  }
  if (!storiesRes.ok) {
    const errText = await storiesRes.text();
    throw new Error(`Failed to fetch Stories tab (${storiesRes.status}): ${errText}`);
  }

  const seriesJson = await seriesRes.json();
  const storiesJson = await storiesRes.json();

  const seriesRows = seriesJson.values || [];
  const storiesRows = storiesJson.values || [];

  sheetDataCache = {
    timestamp: now,
    seriesRows,
    storiesRows
  };

  return { seriesRows, storiesRows };
}

/**
 * Server-side check to verify that a seriesId belongs to the authenticated user.
 */
export async function verifySeriesOwnership(seriesId, user) {
  if (!seriesId || !user) return false;
  const sa = parseServiceAccountKey();
  if (!sa) {
    // If service account is not yet configured, skip check so workflow isn't blocked
    return true;
  }
  try {
    const accessToken = await getServiceAccountAccessToken();
    if (!accessToken) return true;
    const spreadsheetId = process.env.BANGAI_MASTER_SHEET_ID || BANGAI_MASTER_SPREADSHEET_ID;
    const { seriesRows } = await getSheetRows(spreadsheetId, accessToken);
    const authUserId = String(user.userId || user.id || '').trim();
    const authUserEmail = String(user.email || '').trim().toLowerCase();

    for (let i = 1; i < seriesRows.length; i++) {
      const row = seriesRows[i];
      const rowSeriesId = String(row[0] || '').trim();
      if (rowSeriesId === String(seriesId).trim()) {
        const rowUserId = String(row[1] || '').trim();
        const matches = (rowUserId === authUserId) || (authUserEmail && rowUserId.toLowerCase() === authUserEmail);
        return matches;
      }
    }
    return false;
  } catch (err) {
    console.warn('[template-series] verifySeriesOwnership check error:', err.message);
    return true;
  }
}

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Authenticate user via JWT in Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const user = verifyToken(token);

  if (!user) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized. Valid Bearer token required.' })
    };
  }

  const channelId = event.queryStringParameters?.channelId;
  if (!channelId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Query parameter channelId is required.' })
    };
  }

  const authUserId = String(user.userId || user.id || '').trim();
  const authUserEmail = String(user.email || '').trim().toLowerCase();
  const targetChannelId = String(channelId).trim();

  // If service account is not yet configured, return empty list gracefully
  const sa = parseServiceAccountKey();
  if (!sa) {
    console.warn('[template-series] GOOGLE_SERVICE_ACCOUNT_JSON is not configured in environment.');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify([])
    };
  }

  try {
    const accessToken = await getServiceAccountAccessToken();
    if (!accessToken) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify([])
      };
    }

    const spreadsheetId = process.env.BANGAI_MASTER_SHEET_ID || BANGAI_MASTER_SPREADSHEET_ID;
    const { seriesRows, storiesRows } = await getSheetRows(spreadsheetId, accessToken);

    // Build map of Stories to look up part1 logline: story_id -> logline
    const storiesHeader = storiesRows[0] || [];
    let storyIdColIdx = storiesHeader.findIndex(h => String(h || '').trim().toLowerCase() === 'story_id');
    let loglineColIdx = storiesHeader.findIndex(h => String(h || '').trim().toLowerCase() === 'logline');

    if (storyIdColIdx === -1) storyIdColIdx = 0;
    if (loglineColIdx === -1) loglineColIdx = 3;

    const storiesMap = new Map();
    for (let i = 1; i < storiesRows.length; i++) {
      const row = storiesRows[i];
      const storyId = String(row[storyIdColIdx] || '').trim();
      const logline = String(row[loglineColIdx] || '').trim();
      if (storyId) {
        storiesMap.set(storyId, logline);
      }
    }

    // Filter Series tab:
    // A (0): series_id | B (1): user_id | C (2): channel_id | D (3): part1_story_id | E (4): part2_story_id
    // F (5): part1_status | G (6): part2_status | H (7): character_image_url | I (8): created_at | J (9): updated_at
    // Criteria:
    // - user_id equals authenticated user's id (or email)
    // - channel_id equals requested channelId
    // - part1_status equals "done"
    // - part2_status is empty
    const eligibleSeries = [];

    for (let i = 1; i < seriesRows.length; i++) {
      const row = seriesRows[i];
      const rowSeriesId = String(row[0] || '').trim();
      const rowUserId = String(row[1] || '').trim();
      const rowChannelId = String(row[2] || '').trim();
      const part1StoryId = String(row[3] || '').trim();
      const part1Status = String(row[5] || '').trim().toLowerCase();
      const part2Status = String(row[6] || '').trim();
      const characterImageUrl = String(row[7] || '').trim();
      const createdAt = String(row[8] || '').trim();
      const updatedAt = String(row[9] || '').trim();

      const isUserMatch = (rowUserId === authUserId) || (authUserEmail && rowUserId.toLowerCase() === authUserEmail);
      const isChannelMatch = (rowChannelId === targetChannelId);
      const isPart1Done = (part1Status === 'done');
      const isPart2Empty = (!part2Status || part2Status === '');

      if (isUserMatch && isChannelMatch && isPart1Done && isPart2Empty) {
        const title = storiesMap.get(part1StoryId) || `Series ${rowSeriesId}`;
        eligibleSeries.push({
          seriesId: rowSeriesId,
          title,
          part1CompletedAt: createdAt || updatedAt,
          characterImageUrl
        });
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(eligibleSeries)
    };
  } catch (err) {
    console.error('[template-series] Error querying Google Sheets:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Failed to read series data from Google Sheet' })
    };
  }
};
