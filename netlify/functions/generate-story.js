// Netlify Function: generate-story
// Path: /.netlify/functions/generate-story

const N8N_WEBHOOK_URL = 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';

export const handler = async (event, context) => {
  // Handle CORS Preflight
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const prompt = payload.prompt || payload.rawUserInput || '';

    if (!prompt.trim()) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    // Determine host to build the callback URL
    const host = event.headers.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    console.log(`[Netlify] Sending prompt to n8n cloud webhook: "${prompt.substring(0, 50)}..."`);
    console.log(`[Netlify] Callback URL: ${callbackUrl}`);

    const postData = JSON.stringify({
      prompt: prompt.trim(),
      voiceId: payload.voiceId || 'adam',
      visualStyle: payload.visualStyle || 'Cinematic Realistic',
      language: payload.language || 'Hinglish',
      callbackUrl: callbackUrl,
      timestamp: new Date().toISOString()
    });

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: postData
    });

    const respText = await res.text();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        status: 'PROCESSING',
        message: 'Prompt dispatched to n8n autonomous video pipeline.',
        n8nStatus: res.status,
        callbackUrl: callbackUrl,
        response: respText.substring(0, 200)
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
