// Netlify Function: story-approval
// Path: /.netlify/functions/story-approval
// MongoDB Atlas integrated callback & polling handler for 2-Stage Story & Scenes Approval

import { getDb } from './db.js';

export const handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const db = await getDb();
    const threadsCol = db.collection('threads');
    const messagesCol = db.collection('messages');

    // 1. DELETE: Reset active story cache or clear thread
    if (event.httpMethod === 'DELETE' || event.queryStringParameters?.clear === 'true') {
      const { threadId } = event.queryStringParameters || {};
      if (threadId) {
        await threadsCol.updateOne({ threadId }, { $set: { story: null, status: 'GENERATING' } });
      }
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleared: true })
      };
    }

    // 2. GET: Frontend checks for fresh story or final 5 scenes from MongoDB
    if (event.httpMethod === 'GET') {
      const { threadId, since } = event.queryStringParameters || {};
      const sinceTime = Number(since || 0);

      let query = {};
      if (threadId) {
        query.threadId = threadId;
      } else {
        query.status = { $in: ['READY_FOR_APPROVAL', 'SCENES_READY_FOR_APPROVAL', 'CANCELLED', 'DUPLICATE_TOPIC'] };
      }

      const thread = await threadsCol.find(query).sort({ updatedAt: -1 }).limit(1).toArray();
      const latest = thread?.[0] || null;

      if (latest && (latest.story || latest.scenes)) {
        const storyTimestamp = new Date(latest.story?.timestamp || latest.updatedAt || 0).getTime();
        if (sinceTime > 0 && storyTimestamp > 0 && storyTimestamp < sinceTime) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate'
            },
            body: JSON.stringify({ hasStory: false, story: null, ignoredOldStory: true })
          };
        }

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          },
          body: JSON.stringify({
            hasStory: true,
            story: latest.story,
            scenes: latest.scenes || (latest.story && latest.story.scenes) || null,
            threadId: latest.threadId,
            status: latest.status
          })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({ hasStory: false, story: null })
      };
    }

    // 3. POST: n8n Cloud posts the story / final scenes / cancel / duplicate callback
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      console.log('[Netlify] Callback from n8n cloud. Status:', data.status, 'Title:', data.title || data.suggestedTitle);

      const now = new Date();
      if (!data.timestamp) data.timestamp = now.toISOString();

      const threadId = data.threadId || `thread-${Date.now()}`;
      const status = data.status === 'CANCELLED' ? 'CANCELLED' : 
                     data.status === 'DUPLICATE_TOPIC' ? 'DUPLICATE_TOPIC' : 
                     data.status === 'SCENES_READY_FOR_APPROVAL' ? 'SCENES_READY_FOR_APPROVAL' :
                     'READY_FOR_APPROVAL';

      // Persist to MongoDB threads
      await threadsCol.updateOne(
        { threadId },
        {
          $set: {
            threadId,
            story: data,
            scenes: data.scenes || null,
            status,
            title: data.title || data.suggestedTitle || data.matchedTitle || 'Viral Video',
            updatedAt: now
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );

      // Persist to MongoDB messages
      await messagesCol.insertOne({
        threadId,
        role: 'assistant',
        content: data.status === 'CANCELLED' ? 'Video generation was cancelled.' :
                 data.status === 'DUPLICATE_TOPIC' ? `Topic already covered: ${data.matchedTitle}` :
                 data.status === 'SCENES_READY_FOR_APPROVAL' ? `Final 5 scenes ready for review: "${data.title || data.suggestedTitle}"` :
                 `Story ready for review: "${data.suggestedTitle}"`,
        story: data,
        scenes: data.scenes || null,
        status,
        timestamp: now
      });

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, status: 'SUCCESS', threadId })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  } catch (err) {
    console.error('Story Approval Function Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
