// Netlify Function: story-approval
// Path: /.netlify/functions/story-approval
// Methods:
//   POST: n8n cloud posts the generated story here
//   GET: website frontend polls or checks the latest generated story

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

export const handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  // GET: Website checks for new story
  if (event.httpMethod === 'GET') {
    const story = getCachedStory();
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
      console.log('[Netlify] Received Story Approval callback from n8n cloud:', data.suggestedTitle);

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
          timestamp: new Date().toISOString()
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
