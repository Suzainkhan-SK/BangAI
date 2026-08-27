// Netlify Function: generate-story
// Path: /.netlify/functions/generate-story

import fs from 'fs';
import path from 'path';

const N8N_WEBHOOK_URL = 'https://cmpunktg23.app.n8n.cloud/webhook/viral-shorts-ai';
const CACHE_FILE = path.join('/tmp', 'latest_story.json');

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

    // Clear previous story cache before triggering new n8n workflow
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
      }
    } catch (e) {}

    // Determine host to build the callback URL
    const host = event.headers.host || 'bangai.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    console.log(`[Netlify] Sending prompt to n8n cloud webhook: "${prompt.substring(0, 50)}..."`);
    console.log(`[Netlify] Callback URL: ${callbackUrl}`);

    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';
    const postData = JSON.stringify({
      prompt: prompt.trim(),
      voiceId: payload.voiceId || 'adam',
      visualStyle: payload.visualStyle || 'Cinematic Realistic',
      language: payload.language || 'Hinglish',
      callbackUrl: callbackUrl,
      threadId: payload.threadId || '',
      sessionId: payload.sessionId || '',
      webhookSecret: webhookSecret,
      timestamp: new Date().toISOString()
    });

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret
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
