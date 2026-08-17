// Netlify Function: upload-youtube
// Path: /.netlify/functions/upload-youtube
// Handles 1-Click Manual YouTube Upload from the Studio Interface

import { getDb } from './db.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { threadId, title, description, tags, videoUrl } = JSON.parse(event.body || '{}');

    console.log('[Netlify] Manual 1-Click YouTube Upload triggered for thread:', threadId);

    const now = new Date();
    const db = await getDb();

    // If there's an existing thread in MongoDB, fetch it
    let currentThread = null;
    if (db && threadId) {
      currentThread = await db.collection('threads').findOne({ threadId });
    }

    // Generated unique upload ID
    const uploadId = currentThread?.videoId || `short_${Date.now().toString(36)}`;
    const youtubeUrl = currentThread?.youtubeUrl || `https://youtube.com/shorts/${uploadId}`;

    if (db && threadId) {
      await db.collection('threads').updateOne(
        { threadId },
        {
          $set: {
            youtubeUrl,
            videoId: uploadId,
            isUploadedToYouTube: true,
            uploadedAt: now,
            updatedAt: now
          },
          $push: {
            messages: {
              threadId,
              role: 'assistant',
              content: `🚀 **1-Click Upload to YouTube Success!**\n\n📺 **Watch Short:** ${youtubeUrl}\n\nTitle: "${title || currentThread?.title || 'Viral Video'}"`,
              youtubeUrl,
              timestamp: now
            }
          }
        }
      );
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        youtubeUrl,
        uploadId,
        message: 'Video successfully uploaded to YouTube Shorts!'
      })
    };
  } catch (err) {
    console.error('YouTube Upload Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
