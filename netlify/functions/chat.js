// Netlify Function: chat.js
// Path: /.netlify/functions/chat
// 100% REAL Claude Sonnet 5 API Integration with Dual-Key Rotation & MongoDB Atlas Memory

import { getDb } from './db.js';

const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://api.llmsrelay.com';

const CLAUDE_KEYS = [
  process.env.CLAUDE_API_KEY_1 || 'sk-cs4-13029e38c50d4d22f101da2230b9877fa84b1c7f27c8792a',
  process.env.CLAUDE_API_KEY_2 || 'sk-cs4-db2641233a8fbbd2e619a57ddd3acd8a1fb8fddf163b1923'
];

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';

// Real Claude API Caller with Automatic Dual-Key Rotation
async function callClaudeAI(systemPrompt, messages, maxTokens = 1200) {
  let lastError = null;

  for (let i = 0; i < CLAUDE_KEYS.length; i++) {
    const key = CLAUDE_KEYS[i];
    try {
      // 1. Primary: OpenAI-compatible endpoint on api.llmsrelay.com
      const res = await fetch(`${CLAUDE_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content.trim();
        }
      }

      // 2. Secondary: Anthropic /v1/messages endpoint on api.llmsrelay.com
      const anthropicRes = await fetch(`${CLAUDE_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          system: systemPrompt,
          messages: messages,
          max_tokens: maxTokens
        })
      });

      if (anthropicRes.ok) {
        const json = await anthropicRes.json();
        const content = json.content?.[0]?.text;
        if (content && content.trim()) {
          return content.trim();
        }
      }

      console.warn(`Claude Key ${i + 1} returned non-200. Rotating to next key...`);
    } catch (err) {
      console.warn(`Claude Key ${i + 1} request error: ${err.message}. Rotating to next key...`);
      lastError = err;
    }
  }

  throw new Error(`All Claude API keys failed: ${lastError ? lastError.message : 'Unknown error'}`);
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { threadId, sessionId, message, mode = 'CHAT', settings = {} } = payload;

    if (!message || !message.trim()) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    const currentThreadId = threadId || `thread-${Date.now()}`;
    const currentSessionId = sessionId || 'default-session';
    const now = new Date();

    // 1. Connect to MongoDB Atlas and persist user message
    let db = null;
    try {
      db = await getDb();
    } catch (e) {
      console.warn('MongoDB connection notice:', e.message);
    }

    if (db) {
      try {
        await db.collection('messages').insertOne({
          threadId: currentThreadId,
          sessionId: currentSessionId,
          role: 'user',
          content: message.trim(),
          mode,
          timestamp: now
        });
      } catch (e) {}
    }

    // 2. Fetch conversational context from MongoDB
    let conversationHistory = [];
    if (db) {
      try {
        const historyDocs = await db.collection('messages')
          .find({ threadId: currentThreadId })
          .sort({ timestamp: 1 })
          .limit(10)
          .toArray();

        conversationHistory = historyDocs.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));
      } catch (e) {}
    }

    if (conversationHistory.length === 0) {
      conversationHistory = [{ role: 'user', content: message.trim() }];
    }

    // ─── MODE A: REFINE_STORY (Real Claude Screenplay Refinement) ──────
    if (mode === 'REFINE_STORY') {
      let currentStory = null;
      if (db) {
        try {
          const t = await db.collection('threads').findOne({ threadId: currentThreadId });
          currentStory = t?.story || null;
        } catch (e) {}
      }

      const systemPrompt = `You are ShortsAI Screenplay Expert. The creator has an existing 75-second YouTube Short story brief and wants to improve/refine it based on their instructions.

Current Story:
- Title: "${currentStory?.suggestedTitle || 'Unknown'}"
- Viral Hook: "${currentStory?.viralHook || 'None'}"
- Story Brief: "${currentStory?.storyBrief || 'None'}"
- Language: "${settings.language || 'Hinglish'}"
- Visual Style: "${settings.visualStyle || 'Cinematic Realistic'}"

Creator's Instruction: "${message}"

Output ONLY a valid JSON object formatted EXACTLY as:
{
  "message": "Direct, professional explanation of what changes you made",
  "suggestedTitle": "New catchy title (max 50 chars)",
  "viralHook": "Shocking 3-second opening hook in ${settings.language || 'Hinglish'}",
  "storyBrief": "5-Scene detailed narrative brief covering 0-15s, 15-30s, 30-45s, 45-60s, 60-75s",
  "genre": "Genre or viral niche"
}
Do NOT wrap in markdown code fences or add extraneous text. Return raw JSON.`;

      const aiReplyText = await callClaudeAI(systemPrompt, conversationHistory, 1500);

      let parsed = null;
      try {
        const clean = aiReplyText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch (e) {
        parsed = {
          message: aiReplyText,
          suggestedTitle: (currentStory?.suggestedTitle || message).substring(0, 45),
          viralHook: `Hook refined: ${message.substring(0, 40)}...`,
          storyBrief: aiReplyText,
          genre: currentStory?.genre || 'Viral Short'
        };
      }

      const updatedStory = {
        ...(currentStory || {}),
        suggestedTitle: parsed.suggestedTitle,
        viralHook: parsed.viralHook,
        storyBrief: parsed.storyBrief,
        genre: parsed.genre,
        timestamp: now.toISOString()
      };

      if (db) {
        try {
          await db.collection('threads').updateOne(
            { threadId: currentThreadId },
            {
              $set: {
                story: updatedStory,
                title: parsed.suggestedTitle,
                status: 'READY_FOR_APPROVAL',
                updatedAt: now
              }
            },
            { upsert: true }
          );

          await db.collection('messages').insertOne({
            threadId: currentThreadId,
            sessionId: currentSessionId,
            role: 'assistant',
            content: parsed.message,
            storyUpdate: updatedStory,
            mode: 'REFINE_STORY',
            timestamp: now
          });
        } catch (e) {}
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'STORY_REFINED',
          mode: 'REFINE_STORY',
          message: parsed.message,
          story: updatedStory,
          threadId: currentThreadId
        })
      };
    }

    // ─── MODE B: GENERAL CONVERSATIONAL AI CHAT (Real Claude Reply) ───
    if (mode === 'CHAT') {
      const systemPrompt = `You are ShortsAI, a professional viral YouTube Shorts and Reels AI strategist and producer. 
Answer creator questions about viral video creation, retention hooks, pacing, YouTube algorithms, storytelling psychology, scripts, and video marketing.
Be intelligent, engaging, helpful, and concise. Use clean formatting and tasteful emojis.`;

      const aiReplyText = await callClaudeAI(systemPrompt, conversationHistory, 1000);

      if (db) {
        try {
          await db.collection('messages').insertOne({
            threadId: currentThreadId,
            sessionId: currentSessionId,
            role: 'assistant',
            content: aiReplyText,
            mode: 'CHAT',
            timestamp: now
          });
        } catch (e) {}
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CHAT_REPLY',
          mode: 'CHAT',
          message: aiReplyText,
          threadId: currentThreadId
        })
      };
    }

    // ─── MODE C: VIDEO GENERATION (DISPATCH TO N8N) ────────────────────
    const host = event.headers?.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    if (db) {
      try {
        await db.collection('threads').updateOne(
          { threadId: currentThreadId },
          {
            $set: {
              threadId: currentThreadId,
              sessionId: currentSessionId,
              rawUserInput: message.trim(),
              title: message.trim(),
              status: 'GENERATING',
              settings,
              updatedAt: now
            },
            $setOnInsert: { createdAt: now }
          },
          { upsert: true }
        );
      } catch (e) {}
    }

    // Dispatch to n8n Cloud Webhook
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message.trim(),
        voiceId: settings.voiceId || 'adam',
        visualStyle: settings.visualStyle || 'Cinematic Realistic',
        language: settings.language || 'Hinglish',
        callbackUrl,
        threadId: currentThreadId,
        sessionId: currentSessionId,
        timestamp: now.toISOString()
      })
    }).catch(e => console.warn('n8n dispatch warning:', e.message));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'PROCESSING',
        mode: 'VIDEO_GENERATION',
        message: 'Prompt dispatched to autonomous video pipeline.',
        threadId: currentThreadId
      })
    };

  } catch (err) {
    console.error('Chat API Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
