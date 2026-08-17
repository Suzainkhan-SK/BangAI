// Netlify Function: story-approval
// Path: /.netlify/functions/story-approval
// Methods:
//   POST: n8n cloud posts the generated story here
//   GET: website frontend polls with ?since=<timestamp> to avoid stale cache
//   DELETE: website clears cached story before starting a new run

import fs from 'fs';
import path from 'path';

let latestStory = null;
const CACHE_FILE = path.join('/tmp', 'latest_story.json');

function getCachedStory() {
  if (latestStory) return latestStory;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {}
  return null;
}

function saveCachedStory(data) {
  latestStory = data;
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
  } catch (e) {}
}

function clearCachedStory() {
  latestStory = null;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  } catch (e) {}
}

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

  // DELETE: Clear cached story before new generation
  if (event.httpMethod === 'DELETE' || event.queryStringParameters?.clear === 'true') {
    clearCachedStory();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cleared: true })
    };
  }

  // GET: Website checks for new story
  if (event.httpMethod === 'GET') {
    const story = getCachedStory();
    const since = Number(event.queryStringParameters?.since || 0);

    if (story) {
      const storyTime = new Date(story.timestamp || 0).getTime();
      // If the cached story was created before this generation request started, ignore it!
      if (since > 0 && storyTime > 0 && storyTime < since) {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          },
          body: JSON.stringify({
            hasStory: false,
            story: null,
            ignoredOldStory: true
          })
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
      body: JSON.stringify({
        hasStory: !!story,
        story: story
      })
    };
  }

  // POST: n8n cloud posts the story for approval
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body || '{}');
      console.log('[Netlify] Received Story Approval callback from n8n cloud:', data.suggestedTitle || data.status);

      // Ensure timestamp exists
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }

      saveCachedStory(data);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          received: true,
          status: 'SUCCESS',
          timestamp: data.timestamp
        })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: e.message })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' })
  };
};
