// Netlify Function: story-approval
// Path: /.netlify/functions/story-approval
// Methods:
//   POST: n8n cloud posts the generated story here
//   GET: website frontend polls or checks the latest generated story

// Global in-memory cache for serverless execution context
let latestStory = null;

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
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hasStory: !!latestStory,
        story: latestStory
      })
    };
  }

  // POST: n8n cloud posts the story for approval
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body || '{}');
      console.log('[Netlify] Received Story Approval callback from n8n cloud:', data.suggestedTitle);

      latestStory = data;

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
