// Netlify Function: chat
// Path: /.netlify/functions/chat
// Hybrid Routing: /video -> Direct n8n Cloud Webhook, /chat -> Real Claude Sonnet 5 Relay

import { getDb } from './db.js';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';
const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://api.llmsrelay.com';

const CLAUDE_KEYS = [
  process.env.CLAUDE_API_KEY_1 || 'sk-cs4-13029e38c50d4d22f101da2230b9877fa84b1c7f27c8792a',
  process.env.CLAUDE_API_KEY_2 || 'sk-cs4-db2641233a8fbbd2e619a57ddd3acd8a1fb8fddf163b1923'
];

async function callClaudeAI(systemPrompt, conversationHistory, maxTokens = 1000) {
  const messages = conversationHistory.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content || m.text || ''
  }));

  let lastError = null;

  for (let i = 0; i < CLAUDE_KEYS.length; i++) {
    const key = CLAUDE_KEYS[i];
    try {
      // 1. Try OpenAI-compatible endpoint
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

      // 2. Fallback to native Anthropic messages endpoint
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
    } catch (err) {
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

    // Detect language preference from user text or settings (Default to English)
    const rawLower = (message || '').toLowerCase();
    let detectedLanguage = settings.language || 'English';
    if (rawLower.includes('in english') || rawLower.includes('english only') || rawLower.includes('only english')) {
      detectedLanguage = 'English';
    } else if (rawLower.includes('in hindi') || rawLower.includes('hindi only') || rawLower.includes('only hindi')) {
      detectedLanguage = 'Hindi';
    } else if (rawLower.includes('in hinglish') || rawLower.includes('hinglish only')) {
      detectedLanguage = 'Hinglish';
    }

    // 1. Connect to MongoDB Atlas
    let db = null;
    try {
      db = await getDb();
    } catch (e) {
      console.warn('MongoDB connection notice:', e.message);
    }

    if (db) {
      try {
        const userMsgObj = {
          threadId: currentThreadId,
          sessionId: currentSessionId,
          role: 'user',
          content: message.trim(),
          mode,
          timestamp: now
        };

        await db.collection('messages').insertOne(userMsgObj);

        await db.collection('threads').updateOne(
          { threadId: currentThreadId },
          {
            $set: {
              threadId: currentThreadId,
              sessionId: currentSessionId,
              rawUserInput: message.trim(),
              lastPrompt: message.trim(),
              mode,
              language: detectedLanguage,
              updatedAt: now
            },
            $push: {
              messages: userMsgObj
            },
            $setOnInsert: {
              createdAt: now,
              status: mode === 'VIDEO_GENERATION' ? 'GENERATING' : 'IDLE',
              title: message.trim().length > 35 ? (message.trim().substring(0, 35) + '...') : message.trim()
            }
          },
          { upsert: true }
        );
      } catch (e) {
        console.warn('MongoDB user message persistence error:', e.message);
      }
    }

    // 2. Fetch conversation history for Claude context
    let conversationHistory = [];
    if (db) {
      try {
        const pastDocs = await db.collection('messages')
          .find({ threadId: currentThreadId })
          .sort({ timestamp: 1 })
          .limit(10)
          .toArray();

        conversationHistory = pastDocs.map(d => ({
          role: d.role === 'user' ? 'user' : 'assistant',
          content: d.content || d.text || ''
        }));
      } catch (e) {}
    }

    if (conversationHistory.length === 0) {
      conversationHistory = [{ role: 'user', content: message.trim() }];
    }

    // ─── MODE A: SCRIPT DOCTOR / STORY REFINEMENT (Claude Refines Story) ───
    if (mode === 'REFINE_STORY') {
      const systemPrompt = `You are ShortsAI Master Script Doctor. 
A creator is refining an existing 75-second YouTube Short story.
Analyze their feedback / instructions and return a refined story brief in ${detectedLanguage}.

CRITICAL RULES:
1. Return ONLY a valid JSON object formatted EXACTLY as:
{
  "message": "Brief 1-sentence summary of changes made",
  "suggestedTitle": "Catchy YouTube Shorts title (max 50 chars) with 1 emoji",
  "viralHook": "Shocking 3-second opening hook line",
  "storyBrief": "Detailed 5-scene story summary reflecting creator requested changes",
  "genre": "Content genre/category",
  "tags": ["tag1", "tag2", "tag3", "tag4", "shorts", "viral"]
}
2. All text MUST be in ${detectedLanguage}. ${detectedLanguage === 'English' ? 'Pure English only — no Hindi or Romanized Hindi.' : ''}
3. Do NOT wrap in markdown code blocks or add preamble. Return ONLY the raw JSON object.`;

      const aiRaw = await callClaudeAI(systemPrompt, conversationHistory, 1200);

      let parsed = null;
      try {
        const cleanJson = aiRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch (err) {
        parsed = {
          message: 'Story refined according to your instructions.',
          suggestedTitle: message.trim().substring(0, 45),
          viralHook: `What you never knew about ${message.trim()}.`,
          storyBrief: aiRaw,
          genre: 'Viral Short',
          tags: ['shorts', 'viral', 'trending']
        };
      }

      const updatedStory = {
        suggestedTitle: parsed.suggestedTitle,
        viralHook: parsed.viralHook,
        storyBrief: parsed.storyBrief,
        genre: parsed.genre || 'Viral Short',
        tags: parsed.tags || ['shorts', 'viral'],
        language: detectedLanguage,
        status: 'READY_FOR_APPROVAL',
        approveUrl: null,
        timestamp: now.toISOString()
      };

      const assistantMsgObj = {
        threadId: currentThreadId,
        sessionId: currentSessionId,
        role: 'assistant',
        content: `✍️ **Script Doctor Refinement:**\n${parsed.message || 'Story adjusted.'}\n\n**New Hook:** "${parsed.viralHook}"`,
        story: updatedStory,
        status: 'READY_FOR_APPROVAL',
        mode: 'REFINE_STORY',
        timestamp: now
      };

      if (db) {
        try {
          await db.collection('messages').insertOne(assistantMsgObj);

          await db.collection('threads').updateOne(
            { threadId: currentThreadId },
            {
              $set: {
                title: parsed.suggestedTitle || message.trim(),
                story: updatedStory,
                status: 'READY_FOR_APPROVAL',
                updatedAt: now
              },
              $push: {
                messages: assistantMsgObj
              }
            },
            { upsert: true }
          );
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

      const assistantMsgObj = {
        threadId: currentThreadId,
        sessionId: currentSessionId,
        role: 'assistant',
        content: aiReplyText,
        mode: 'CHAT',
        timestamp: now
      };

      if (db) {
        try {
          await db.collection('messages').insertOne(assistantMsgObj);

          await db.collection('threads').updateOne(
            { threadId: currentThreadId },
            {
              $set: {
                updatedAt: now
              },
              $push: {
                messages: assistantMsgObj
              }
            },
            { upsert: true }
          );
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

    // ─── MODE C: VIDEO GENERATION (DISPATCH DIRECTLY TO N8N CLOUD) ────
    const host = event.headers?.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    let n8nRes;
    try {
      n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message.trim(),
          rawUserInput: message.trim(),
          voiceId: settings.voiceId || 'adam',
          visualStyle: settings.visualStyle || 'Cinematic Realistic',
          language: detectedLanguage,
          autoUploadToYouTube: !!settings.autoUploadToYouTube,
          callbackUrl,
          threadId: currentThreadId,
          sessionId: currentSessionId,
          timestamp: now.toISOString()
        })
      });
    } catch (e) {
      console.error('[Netlify] n8n Webhook Network Error:', e.message);

      if (db) {
        try {
          await db.collection('threads').updateOne(
            { threadId: currentThreadId },
            {
              $set: {
                status: 'WORKFLOW_INACTIVE',
                errorMessage: `Could not reach n8n Cloud webhook: ${e.message}`,
                updatedAt: now
              }
            }
          );
        } catch (dbErr) {}
      }

      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'N8N_UNREACHABLE',
          message: `Failed to connect to n8n Cloud webhook (${e.message}). Please verify n8n is online and active.`,
          threadId: currentThreadId
        })
      };
    }

    const n8nStatus = n8nRes.status;
    const n8nResponse = await n8nRes.text();
    console.log('[Netlify] n8n Cloud Webhook HTTP Status:', n8nStatus, 'Body:', n8nResponse);

    if (!n8nRes.ok) {
      let errorDetail = 'The workflow must be active / published in n8n Cloud to receive video generation requests.';
      try {
        const errJson = JSON.parse(n8nResponse);
        if (errJson.message) errorDetail = errJson.message;
        if (errJson.hint) errorDetail += ' (' + errJson.hint + ')';
      } catch (parseErr) {}

      const inactiveMsg = {
        threadId: currentThreadId,
        sessionId: currentSessionId,
        role: 'assistant',
        content: `⚠️ **n8n Autonomous Pipeline Inactive:** ${errorDetail}\n\nPlease verify that workflow \`u8vcVLc00wPp2AAI\` is Published and Active in n8n Cloud.`,
        status: 'WORKFLOW_INACTIVE',
        timestamp: now
      };

      if (db) {
        try {
          await db.collection('messages').insertOne(inactiveMsg);
          await db.collection('threads').updateOne(
            { threadId: currentThreadId },
            {
              $set: {
                status: 'WORKFLOW_INACTIVE',
                errorMessage: errorDetail,
                updatedAt: now
              },
              $push: { messages: inactiveMsg }
            }
          );
        } catch (dbErr) {}
      }

      return {
        statusCode: 503,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'WORKFLOW_INACTIVE',
          message: errorDetail,
          threadId: currentThreadId
        })
      };
    }

    // Success: n8n workflow execution started
    if (db) {
      try {
        await db.collection('threads').updateOne(
          { threadId: currentThreadId },
          {
            $set: {
              status: 'GENERATING',
              executionStarted: true,
              updatedAt: now
            }
          }
        );
      } catch (dbErr) {}
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        status: 'GENERATING',
        message: 'Video generation dispatched to n8n Cloud',
        threadId: currentThreadId,
        executionStarted: true
      })
    };

  } catch (err) {
    console.error('Chat Handler Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
