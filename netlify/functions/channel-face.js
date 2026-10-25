// netlify/functions/channel-face.js
// Bang AI — Permanent YouTube Channel Face Management
// Allows saving or removing a recurring character face (image URL, name, gender) per connected YouTube channel.

import { getDb } from './db.js';
import { verifyToken } from './google-oauth.js';

const VALID_GENDERS = ['female', 'male', 'auto'];

function sanitizeChannel(channel) {
  if (!channel) return null;
  return {
    channelId: channel.channelId,
    channelTitle: channel.channelTitle || '',
    customUrl: channel.customUrl || '',
    avatarUrl: channel.avatarUrl || '',
    subscriberCount: channel.subscriberCount || '0',
    videoCount: channel.videoCount || '0',
    defaultPrivacy: channel.defaultPrivacy || 'public',
    isDefault: !!channel.isDefault,
    connectedAt: channel.connectedAt || '',
    characterImageUrl: channel.characterImageUrl || '',
    characterName: channel.characterName || '',
    characterGender: channel.characterGender || 'auto'
  };
}

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
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

  const userId = user.userId || user.id;
  const userEmail = (user.email || '').toLowerCase();

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

  const action = (body.action || 'set').toLowerCase().trim();
  const channelId = String(body.channelId || '').trim();

  if (!channelId) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'channelId is required.' })
    };
  }

  try {
    const db = await getDb();
    if (!db) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Database connection unavailable.' })
      };
    }

    // Find the user document
    const queryList = [];
    if (userId) queryList.push({ id: userId }, { _id: userId }, { userId });
    if (userEmail) queryList.push({ email: userEmail });

    const userDoc = await db.collection('users').findOne({ $or: queryList });
    if (!userDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User record not found.' })
      };
    }

    const channels = userDoc.youtubeChannels || [];
    const channelIndex = channels.findIndex(c => c.channelId === channelId);

    if (channelIndex === -1) {
      return {
        statusCode: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden. This channel does not belong to your account.' })
      };
    }

    // 2. Action: REMOVE
    if (action === 'remove') {
      const updatePathPrefix = `youtubeChannels.${channelIndex}`;
      await db.collection('users').updateOne(
        { _id: userDoc._id },
        {
          $set: {
            [`${updatePathPrefix}.characterImageUrl`]: '',
            [`${updatePathPrefix}.characterName`]: '',
            [`${updatePathPrefix}.characterGender`]: 'auto',
            updatedAt: new Date().toISOString()
          }
        }
      );

      const target = channels[channelIndex];
      target.characterImageUrl = '';
      target.characterName = '';
      target.characterGender = 'auto';

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          action: 'remove',
          channel: sanitizeChannel(target)
        })
      };
    }

    // 3. Action: SET
    const rawUrl = String(body.characterImageUrl || '').trim();
    const rawName = String(body.characterName || '').trim().slice(0, 40);
    const rawGender = String(body.characterGender || 'auto').toLowerCase().trim();

    if (!rawUrl) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'characterImageUrl is required to set channel face.' })
      };
    }

    if (rawUrl.length > 2048) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'characterImageUrl exceeds maximum length of 2048 characters.' })
      };
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch (_) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'characterImageUrl must be a valid URL.' })
      };
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'characterImageUrl must use http or https protocol.' })
      };
    }

    const gender = VALID_GENDERS.includes(rawGender) ? rawGender : 'auto';

    const updatePathPrefix = `youtubeChannels.${channelIndex}`;
    await db.collection('users').updateOne(
      { _id: userDoc._id },
      {
        $set: {
          [`${updatePathPrefix}.characterImageUrl`]: rawUrl,
          [`${updatePathPrefix}.characterName`]: rawName,
          [`${updatePathPrefix}.characterGender`]: gender,
          updatedAt: new Date().toISOString()
        }
      }
    );

    const target = channels[channelIndex];
    target.characterImageUrl = rawUrl;
    target.characterName = rawName;
    target.characterGender = gender;

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'set',
        channel: sanitizeChannel(target)
      })
    };
  } catch (err) {
    console.error('[channel-face] Error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
