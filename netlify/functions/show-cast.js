// netlify/functions/show-cast.js
// Bang AI — Show Cast Character Photos Management
// Allows creators to view, save, or remove reference photos for Ghar Ki Kahani (GKK-001) characters.

import { getDb } from './db.js';
import { verifyToken } from './google-oauth.js';

export const ALLOWED_SHOW_IDS = ['GKK-001'];
export const VALID_CHARACTERS = ['DADI', 'PAPA', 'MUMMY', 'DIDI', 'CHHOTA', 'NEIGHBOUR', 'GUEST'];
export const REQUIRED_CHARACTERS = ['DADI', 'PAPA', 'MUMMY', 'DIDI', 'CHHOTA'];

let indexEnsured = false;
async function ensureShowCastIndex(db) {
  if (indexEnsured || !db) return;
  try {
    if (typeof db.collection('show_cast').createIndex === 'function') {
      await db.collection('show_cast').createIndex(
        { userId: 1, showId: 1, characterId: 1 },
        { unique: true }
      );
    }
    indexEnsured = true;
  } catch (e) {
    indexEnsured = true;
  }
}

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // 1. Authenticate user via JWT
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const user = verifyToken(token);

  if (!user) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized. Valid token required.' })
    };
  }

  // Never take userId from the body
  const userId = String(user.userId || user.id || user.sub || '');
  if (!userId) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized. Missing user ID in token.' })
    };
  }

  let db;
  try {
    db = await getDb();
    if (!db) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Database connection unavailable.' })
      };
    }
    await ensureShowCastIndex(db);
  } catch (dbErr) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Database connection failed: ' + dbErr.message })
    };
  }

  // --------------------------------------------------------------------------
  // GET: Fetch signed-in user's photos for show
  // --------------------------------------------------------------------------
  if (event.httpMethod === 'GET') {
    const showId = (event.queryStringParameters?.showId || '').trim();
    if (!ALLOWED_SHOW_IDS.includes(showId)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Invalid or missing showId. Supported shows: ${ALLOWED_SHOW_IDS.join(', ')}` })
      };
    }

    try {
      const docs = await db.collection('show_cast').find({ userId, showId }).toArray();
      const photosMap = {};
      for (const cid of VALID_CHARACTERS) {
        photosMap[cid] = null;
      }
      const photosList = [];

      for (const doc of docs) {
        if (VALID_CHARACTERS.includes(doc.characterId)) {
          photosMap[doc.characterId] = doc.imageUrl || null;
          photosList.push({
            characterId: doc.characterId,
            imageUrl: doc.imageUrl
          });
        }
      }

      const hasRequiredCast = REQUIRED_CHARACTERS.every(cid => Boolean(photosMap[cid]));

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          showId,
          photos: photosList,
          characters: photosMap,
          hasRequiredCast
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to retrieve cast photos: ' + err.message })
      };
    }
  }

  // --------------------------------------------------------------------------
  // POST: Save one character photo
  // --------------------------------------------------------------------------
  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON request body.' })
      };
    }

    const showId = String(body.showId || '').trim();
    if (!ALLOWED_SHOW_IDS.includes(showId)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Invalid showId "${showId}". Supported shows: ${ALLOWED_SHOW_IDS.join(', ')}` })
      };
    }

    const characterId = String(body.characterId || '').trim().toUpperCase();
    if (!VALID_CHARACTERS.includes(characterId)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Invalid characterId "${characterId}". Must be one of: ${VALID_CHARACTERS.join(', ')}` })
      };
    }

    const rawUrl = (typeof body.imageUrl === 'string' ? body.imageUrl : '').trim();
    if (!rawUrl || rawUrl.length > 2048) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'imageUrl is required and must not exceed 2048 characters.' })
      };
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'imageUrl must be a valid, well-formed URL.' })
      };
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'imageUrl must use http or https protocol.' })
      };
    }

    try {
      await db.collection('show_cast').updateOne(
        { userId, showId, characterId },
        {
          $set: {
            userId,
            showId,
            characterId,
            imageUrl: rawUrl,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          showId,
          characterId,
          imageUrl: rawUrl
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to save character photo: ' + err.message })
      };
    }
  }

  // --------------------------------------------------------------------------
  // DELETE: Remove one character photo
  // --------------------------------------------------------------------------
  if (event.httpMethod === 'DELETE') {
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        body = {};
      }
    }

    const showId = String(body.showId || event.queryStringParameters?.showId || '').trim();
    if (!ALLOWED_SHOW_IDS.includes(showId)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Invalid showId "${showId}". Supported shows: ${ALLOWED_SHOW_IDS.join(', ')}` })
      };
    }

    const characterId = String(body.characterId || event.queryStringParameters?.characterId || '').trim().toUpperCase();
    if (!VALID_CHARACTERS.includes(characterId)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Invalid characterId "${characterId}". Must be one of: ${VALID_CHARACTERS.join(', ')}` })
      };
    }

    try {
      const result = await db.collection('show_cast').deleteOne({ userId, showId, characterId });
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          showId,
          characterId,
          deleted: result.deletedCount > 0
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to remove character photo: ' + err.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Method Not Allowed. Use GET, POST, or DELETE.' })
  };
};
