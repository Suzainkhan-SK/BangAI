// Netlify Function: story-approval
// Path: /.netlify/functions/story-approval
// MongoDB Atlas integrated callback & polling handler for 2-Stage Story, Scenes & Final Video Completion

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

    // 2. GET: Frontend checks for fresh story, 5 scenes, or final rendered video from MongoDB
    if (event.httpMethod === 'GET') {
      const { threadId, since } = event.queryStringParameters || {};
      const sinceTime = Number(since || 0);

      let query = {};
      if (threadId) {
        query.threadId = threadId;
      } else {
        query.status = { $in: ['READY_FOR_APPROVAL', 'SCENES_READY_FOR_APPROVAL', 'COMPLETED', 'RENDER_FAILED', 'CANCELLED', 'DUPLICATE_TOPIC'] };
      }

      const thread = await threadsCol.find(query).sort({ updatedAt: -1 }).limit(1).toArray();
      const latest = thread?.[0] || null;

      if (latest && (latest.story || latest.scenes || latest.videoUrl || latest.status === 'COMPLETED' || latest.status === 'RENDER_FAILED')) {
        const timestampVal = new Date(latest.story?.timestamp || latest.updatedAt || 0).getTime();
        if (sinceTime > 0 && timestampVal > 0 && timestampVal < sinceTime) {
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
            videoUrl: latest.videoUrl || (latest.story && latest.story.videoUrl) || null,
            youtubeUrl: latest.youtubeUrl || null,
            videoId: latest.videoId || null,
            threadId: latest.threadId,
            status: latest.status,
            title: latest.title,
            youtubeDescription: latest.youtubeDescription,
            tags: latest.tags,
            errorMessage: latest.errorMessage || null
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

    // 3. POST: n8n Cloud posts the story / final scenes / video completed / render failed callback
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      console.log('[Netlify] Callback from n8n cloud. Status:', data.status, 'Title:', data.title || data.suggestedTitle);

      const now = new Date();
      if (!data.timestamp) data.timestamp = now.toISOString();

      const threadId = data.threadId || `thread-${Date.now()}`;
      
      let status = 'READY_FOR_APPROVAL';
      let messageContent = `Story ready for review: "${data.suggestedTitle || data.title}"`;

      if (data.status === 'CANCELLED') {
        status = 'CANCELLED';
        messageContent = 'Video generation was cancelled.';
      } else if (data.status === 'DUPLICATE_TOPIC') {
        status = 'DUPLICATE_TOPIC';
        messageContent = `Topic already covered: ${data.matchedTitle}`;
      } else if (data.status === 'SCENES_READY_FOR_APPROVAL') {
        status = 'SCENES_READY_FOR_APPROVAL';
        messageContent = `🎬 Final 5 scenes ready for review: "${data.title || data.suggestedTitle}"`;
      } else if (data.status === 'VIDEO_COMPLETED' || data.status === 'VIDEO_UPLOADED_SUCCESS') {
        status = 'COMPLETED';
        messageContent = data.youtubeUrl 
          ? `🎉 **Video Rendered & Uploaded to YouTube!**\n\n📺 **Watch Short:** ${data.youtubeUrl}\n🎬 Direct MP4 Video Ready.` 
          : `🎉 **Video Rendering Complete!**\n\n🎬 75-Second 4K video rendered and ready for download or 1-Click YouTube Upload.`;
      } else if (data.status === 'RENDER_FAILED') {
        status = 'RENDER_FAILED';
        messageContent = `❌ Video rendering error: ${data.errorMessage || 'Render failed in media engine'}`;
      }

      const updateDoc = {
        threadId,
        status,
        updatedAt: now
      };

      if (data.title || data.suggestedTitle) updateDoc.title = data.title || data.suggestedTitle;
      if (data.story) updateDoc.story = data.story;
      else updateDoc.story = data;

      if (data.scenes && Array.isArray(data.scenes)) updateDoc.scenes = data.scenes;
      if (data.videoUrl) updateDoc.videoUrl = data.videoUrl;
      if (data.youtubeUrl) updateDoc.youtubeUrl = data.youtubeUrl;
      if (data.videoId) updateDoc.videoId = data.videoId;
      if (data.youtubeDescription) updateDoc.youtubeDescription = data.youtubeDescription;
      if (data.tags) updateDoc.tags = data.tags;
      if (data.errorMessage) updateDoc.errorMessage = data.errorMessage;
      if (status === 'COMPLETED') updateDoc.criticScore = 99;

      const msgObj = {
        threadId,
        role: 'assistant',
        content: messageContent,
        story: data,
        scenes: data.scenes || null,
        videoUrl: data.videoUrl || null,
        youtubeUrl: data.youtubeUrl || null,
        status,
        timestamp: now
      };

      // Persist to MongoDB threads
      await threadsCol.updateOne(
        { threadId },
        {
          $set: updateDoc,
          $push: {
            messages: msgObj
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );

      // Persist to MongoDB messages
      await messagesCol.insertOne(msgObj);

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
