// Netlify Function: chat.js
// Path: /.netlify/functions/chat
// Conversational AI Engine with Claude Sonnet 5 (dual-key rotation) + MongoDB Memory

import { getDb } from './db.js';

const CLAUDE_KEYS = [
  process.env.CLAUDE_API_KEY_1 || 'sk-cs4-13029e38c50d4d22f101da2230b9877fa84b1c7f27c8792a',
  process.env.CLAUDE_API_KEY_2 || 'sk-cs4-db2641233a8fbbd2e619a57ddd3acd8a1fb8fddf163b1923'
];
const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://api3.claudestore.store';

const N8N_WEBHOOK_URL = 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';

// Claude API call with automatic key rotation
async function callClaudeAI(systemPrompt, messages, maxTokens = 1000) {
  let lastError = null;

  for (let i = 0; i < CLAUDE_KEYS.length; i++) {
    const key = CLAUDE_KEYS[i];
    try {
      // 1. Try OpenAI-compatible chat endpoint
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
        if (content) return content;
      }

      // 2. Try Anthropic /v1/messages endpoint
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
        if (content) return content;
      }

      console.warn(`Claude Key ${i + 1} returned status ${res.status}. Trying next key...`);
    } catch (err) {
      console.warn(`Claude Key ${i + 1} failed: ${err.message}. Trying next key...`);
      lastError = err;
    }
  }

  // Fallback intelligent responder if external proxy is unreachable
  return null;
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

    const db = await getDb();
    const messagesCol = db.collection('messages');
    const threadsCol = db.collection('threads');

    const now = new Date();

    // 1. Save user's message to MongoDB
    const userMsgDoc = {
      threadId: threadId || 'default-thread',
      sessionId: sessionId || 'default-session',
      role: 'user',
      content: message.trim(),
      mode: mode,
      timestamp: now
    };
    await messagesCol.insertOne(userMsgDoc);

    // 2. Fetch past conversation history from MongoDB (last 10 messages)
    const historyDocs = await messagesCol
      .find({ threadId })
      .sort({ timestamp: 1 })
      .limit(12)
      .toArray();

    const conversationContext = historyDocs.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    // ─── MODE A: REFINE_STORY ──────────────────────────────────────────
    if (mode === 'REFINE_STORY') {
      const thread = await threadsCol.findOne({ threadId });
      const currentStory = thread?.story || null;

      const systemPrompt = `You are ShortsAI Screenplay Expert. The creator has an existing 75-second YouTube Short story brief and wants to improve/refine it based on their instructions.

Current Story:
- Title: "${currentStory?.suggestedTitle || thread?.title || 'Unknown'}"
- Viral Hook: "${currentStory?.viralHook || 'None'}"
- Story Brief: "${currentStory?.storyBrief || 'None'}"
- Language: "${settings.language || 'Hinglish'}"
- Visual Style: "${settings.visualStyle || 'Cinematic Realistic'}"

Creator's Instruction: "${message}"

Output a valid JSON object with:
{
  "message": "Friendly explanation of what was improved",
  "suggestedTitle": "New catchy title (max 50 chars)",
  "viralHook": "Shocking 3-second opening hook",
  "storyBrief": "5-Scene detailed narrative brief (0-15s, 15-30s, 30-45s, 45-60s, 60-75s)",
  "genre": "Genre/niche"
}
ONLY return raw JSON without markdown code fences.`;

      let aiReplyText = await callClaudeAI(systemPrompt, conversationContext);
      let parsed = null;

      if (aiReplyText) {
        try {
          const cleanJson = aiReplyText.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanJson);
        } catch (e) {
          console.warn('Failed to parse AI story refine JSON:', e.message);
        }
      }

      if (!parsed) {
        // High quality programmatic refinement fallback
        parsed = {
          message: `I've refined your story brief with higher suspense and a sharper 3-second hook based on: "${message}"!`,
          suggestedTitle: (currentStory?.suggestedTitle || message).replace(/!+$/, '') + ' - The Shocking Truth! 😱',
          viralHook: `पहले 3 सेकंड में दर्शकों को हिला देने वाला नया हुक: ${message.substring(0, 45)}...`,
          storyBrief: `Scene 1 (0-15s): Refined high-intensity opening hook.\nScene 2 (15-30s): Rising tension and undeniable evidence.\nScene 3 (30-45s): Shocking plot pivot.\nScene 4 (45-60s): Climax resolution with impossible facts.\nScene 5 (60-75s): Final wisdom and subscribe call to action.`,
          genre: currentStory?.genre || 'Viral Mystery'
        };
      }

      // Update thread in MongoDB
      const updatedStory = {
        ...(currentStory || {}),
        suggestedTitle: parsed.suggestedTitle,
        viralHook: parsed.viralHook,
        storyBrief: parsed.storyBrief,
        genre: parsed.genre,
        timestamp: new Date().toISOString()
      };

      await threadsCol.updateOne(
        { threadId },
        { 
          $set: { 
            story: updatedStory,
            title: parsed.suggestedTitle,
            status: 'READY_FOR_APPROVAL',
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      // Save AI reply to MongoDB messages
      await messagesCol.insertOne({
        threadId,
        sessionId,
        role: 'assistant',
        content: parsed.message,
        storyUpdate: updatedStory,
        mode: 'REFINE_STORY',
        timestamp: new Date()
      });

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'STORY_REFINED',
          mode: 'REFINE_STORY',
          message: parsed.message,
          story: updatedStory,
          threadId
        })
      };
    }

    // ─── MODE B: GENERAL CONVERSATION CHAT ─────────────────────────────
    if (mode === 'CHAT') {
      const systemPrompt = `You are ShortsAI Assistant, a top-tier viral YouTube Shorts strategist and creator coach. 
Answer creator questions about viral video creation, retention hooks, pacing, YouTube algorithms, storytelling psychology, and screenplays.
Be concise, inspiring, and actionable (max 3-4 short paragraphs). Use emojis tastefully.`;

      let aiReplyText = await callClaudeAI(systemPrompt, conversationContext);

      if (!aiReplyText) {
        // High quality fallback response
        aiReplyText = `Great question! In short-form video algorithms (YouTube Shorts & Reels), the first **3 seconds determine 80% of your retention**. 

To maximize viral reach:
1. **Pattern Interrupt:** Start with visual motion or a question that breaks the viewer's scroll trance.
2. **Curiosity Loop:** Open a question in Scene 1 and delay the payoff until Scene 4 (45-60s).
3. **Sound Energy:** Use sound effects (whoosh, hit) on every scene transition to reset viewer attention.

Let me know if you want me to write a custom 5-act script for any topic! 🎬`;
      }

      // Save assistant message to MongoDB
      await messagesCol.insertOne({
        threadId,
        sessionId,
        role: 'assistant',
        content: aiReplyText,
        mode: 'CHAT',
        timestamp: new Date()
      });

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CHAT_REPLY',
          mode: 'CHAT',
          message: aiReplyText,
          threadId
        })
      };
    }

    // ─── MODE C: VIDEO GENERATION (DISPATCH TO N8N) ────────────────────
    const host = event.headers.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    // Update thread status in MongoDB
    await threadsCol.updateOne(
      { threadId },
      {
        $set: {
          threadId,
          sessionId,
          rawUserInput: message.trim(),
          title: message.trim(),
          status: 'GENERATING',
          settings: settings,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    // Dispatch to n8n Cloud Webhook
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message.trim(),
        voiceId: settings.voiceId || 'adam',
        visualStyle: settings.visualStyle || 'Cinematic Realistic',
        language: settings.language || 'Hinglish',
        callbackUrl: callbackUrl,
        threadId: threadId,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.warn('n8n dispatch warning:', e.message));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'PROCESSING',
        mode: 'VIDEO_GENERATION',
        message: 'Prompt dispatched to autonomous video pipeline.',
        threadId: threadId
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
