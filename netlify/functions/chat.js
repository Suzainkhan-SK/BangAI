// Netlify Function: chat
// Path: /.netlify/functions/chat
// Dedicated Separation:
// - /video: Pure n8n Autonomous Workflow Pipeline (Topic Analyzer -> Strategy Engine -> Approval -> 5 Scenes -> Rendering)
// - /chat: Claude Conversational AI
// - /refine: Claude Script Doctor Refinement

import { getDb } from './db.js';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';
const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://api.llmsrelay.com';

const CLAUDE_KEYS = [
  process.env.CLAUDE_API_KEY_1 || 'sk-cs4-13029e38c50d4d22f101da2230b9877fa84b1c7f27c8792a',
  process.env.CLAUDE_API_KEY_2 || 'sk-cs4-db2641233a8fbbd2e619a57ddd3acd8a1fb8fddf163b1923'
];

async function callClaudeAI(systemPrompt, conversationHistory, maxTokens = 1500, timeoutMs = 8000) {
  const rawList = Array.isArray(conversationHistory) ? conversationHistory : [];
  const messages = rawList
    .filter(m => m && (m.content || m.text))
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: typeof m.content === 'string' ? m.content : (typeof m.text === 'string' ? m.text : JSON.stringify(m.content || m.text || ''))
    }))
    .filter(m => m.content.trim().length > 0);

  if (messages.length === 0) {
    messages.push({ role: 'user', content: 'Generate response' });
  }

  let lastError = null;

  for (let i = 0; i < CLAUDE_KEYS.length; i++) {
    const key = CLAUDE_KEYS[i];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

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
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
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

    // Detect language preference
    const rawLower = (message || '').toLowerCase();
    let detectedLanguage = settings.language || 'English';
    if (rawLower.includes('in english') || rawLower.includes('english only') || rawLower.includes('only english')) {
      detectedLanguage = 'English';
    } else if (rawLower.includes('in hindi') || rawLower.includes('hindi only') || rawLower.includes('only hindi')) {
      detectedLanguage = 'Hindi';
    } else if (rawLower.includes('in hinglish') || rawLower.includes('hinglish only')) {
      detectedLanguage = 'Hinglish';
    }

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
      } catch (e) {}
    }

    // ─── MODE A: SCRIPT DOCTOR / REFINEMENT (Claude Refines Story) ─────
    if (mode === 'REFINE_STORY') {
      let existingStory = null;
      if (db) {
        try {
          const t = await db.collection('threads').findOne({ threadId: currentThreadId });
          if (t && t.story) existingStory = t.story;
        } catch(e) {}
      }

      const systemPrompt = `You are ShortsAI Master Script Doctor. 
A creator is refining an existing 75-second YouTube Short story.
${existingStory ? `Current Story Title: "${existingStory.suggestedTitle || ''}"\nCurrent Story Brief: "${existingStory.storyBrief || ''}"\nCurrent Hook: "${existingStory.viralHook || ''}"` : ''}

Creator Refinement Instructions: "${message.trim()}"

CRITICAL RULES:
1. Return ONLY a valid JSON object formatted EXACTLY as:
{
  "message": "Brief 1-sentence summary of changes made",
  "suggestedTitle": "Catchy YouTube Shorts title (max 50 chars) with 1 emoji",
  "viralHook": "Shocking 3-second opening hook line in ${detectedLanguage}",
  "storyBrief": "Detailed 5-scene story summary in ${detectedLanguage} reflecting creator requested changes",
  "genre": "Content genre/category",
  "tags": ["tag1", "tag2", "tag3", "tag4", "shorts", "viral"]
}
2. All text MUST be in ${detectedLanguage}. ${detectedLanguage === 'English' ? 'Pure English only — no Hindi or Romanized Hindi.' : ''}
3. Do NOT wrap in markdown code blocks or add preamble. Return ONLY the raw JSON object.`;

      let parsed = null;
      try {
        const aiRaw = await callClaudeAI(systemPrompt, [{ role: 'user', content: `Refine this story according to: ${message.trim()}` }], 1500);
        const cleanJson = aiRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch (err) {
        parsed = {
          message: 'Story refined according to your instructions.',
          suggestedTitle: (existingStory?.suggestedTitle || message.trim()).substring(0, 45),
          viralHook: `What you never knew about ${message.trim()}.`,
          storyBrief: `Refined story: ${message.trim()}`,
          genre: existingStory?.genre || 'Viral Short',
          tags: ['shorts', 'viral', 'trending']
        };
      }

      const updatedStory = {
        suggestedTitle: parsed.suggestedTitle || existingStory?.suggestedTitle || message.trim(),
        viralHook: parsed.viralHook || existingStory?.viralHook || '',
        storyBrief: parsed.storyBrief || existingStory?.storyBrief || '',
        genre: parsed.genre || existingStory?.genre || 'Viral Short',
        tags: parsed.tags || existingStory?.tags || ['shorts', 'viral'],
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
                title: updatedStory.suggestedTitle,
                story: updatedStory,
                status: 'READY_FOR_APPROVAL',
                updatedAt: now
              },
              $push: { messages: assistantMsgObj }
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

    // ─── MODE B: CONVERSATIONAL AI CHAT (Pure Claude Reply) ───────────
    if (mode === 'CHAT') {
      // Build conversation history from the thread's stored messages
      // Sanitize all content to plain strings — complex objects break Claude API
      let conversationHistory = [];
      if (db) {
        try {
          const thread = await db.collection('threads').findOne({ threadId: currentThreadId });
          const rawMsgs = thread?.messages || [];
          conversationHistory = rawMsgs
            .filter(d => d && d.role && (d.content || d.text))
            .slice(-12) // last 12 messages for context
            .map(d => ({
              role: d.role === 'user' ? 'user' : 'assistant',
              // Force to plain string — strip any objects that might sneak in
              content: typeof d.content === 'string' ? d.content
                : typeof d.text === 'string' ? d.text
                : String(d.content || d.text || '')
            }))
            .filter(d => d.content.trim().length > 0 && d.content.length < 4000);
        } catch (e) {
          console.warn('[CHAT] History fetch error:', e.message);
        }
      }

      // Always ensure the new user message is at the end
      const lastMsg = conversationHistory[conversationHistory.length - 1];
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== message.trim()) {
        conversationHistory = [...conversationHistory, { role: 'user', content: message.trim() }];
      }

      // Must start with user role — Claude requires alternating roles
      while (conversationHistory.length > 0 && conversationHistory[0].role !== 'user') {
        conversationHistory.shift();
      }

      if (conversationHistory.length === 0) {
        conversationHistory = [{ role: 'user', content: message.trim() }];
      }

      const systemPrompt = `You are ShortsAI, a professional viral YouTube Shorts and Reels AI strategist and producer.
Answer creator questions about viral video creation, retention hooks, pacing, YouTube algorithms, storytelling psychology, scripts, and video marketing.
Be intelligent, engaging, helpful, and genuinely useful. Use clean formatting with markdown bold and bullet points. Add tasteful emojis.
Language: ${detectedLanguage}. If the creator writes in Hindi or Hinglish, reply in that language naturally.`;

      const aiReplyText = await callClaudeAI(systemPrompt, conversationHistory, 1200, 25000);

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
          await db.collection('threads').updateOne(
            { threadId: currentThreadId },
            {
              $set: { updatedAt: now, status: 'CHAT', mode: 'CHAT' },
              $push: { messages: assistantMsgObj }
            },
            { upsert: true }
          );
        } catch (e) {
          console.warn('[CHAT] DB update error:', e.message);
        }
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

    // ─── MODE C: VIDEO GENERATION (PURE N8N AUTONOMOUS WORKFLOW) ───────
    // User requested: Let n8n RapidAPI key rotation generate EVERYTHING!
    // No Claude pre-generation. Directly dispatch to n8n Cloud webhook!
    const callbackUrl = 'https://viral-shorts-ai-studio.netlify.app/.netlify/functions/story-approval';

    console.log(`[Netlify] Dispatching /video prompt to n8n Cloud Webhook: "${message.trim()}" (Thread: ${currentThreadId})`);

    const n8nPayload = {
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
    };

    let n8nResponseOk = false;
    let n8nResponseStatus = 200;

    try {
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });

      n8nResponseOk = n8nRes.ok;
      n8nResponseStatus = n8nRes.status;
      console.log(`[Netlify] n8n Cloud webhook responded with HTTP ${n8nRes.status}`);
    } catch (dispatchErr) {
      console.error('[Netlify] n8n Webhook dispatch error:', dispatchErr.message);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'N8N_UNREACHABLE',
          message: `Could not connect to n8n Cloud: ${dispatchErr.message}`
        })
      };
    }

    if (!n8nResponseOk) {
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'WORKFLOW_INACTIVE',
          message: `n8n Cloud returned HTTP ${n8nResponseStatus}. Please ensure workflow u8vcVLc00wPp2AAI is Active.`
        })
      };
    }

    // Seed thread in persistent store immediately so polling works from the first second
    if (db) {
      try {
        await db.collection('threads').updateOne(
          { threadId: currentThreadId },
          {
            $set: {
              threadId: currentThreadId,
              sessionId: currentSessionId,
              status: 'GENERATING',
              title: message.trim().substring(0, 60),
              rawUserInput: message.trim(),
              mode: 'VIDEO_GENERATION',
              language: detectedLanguage,
              updatedAt: now
            },
            $setOnInsert: { createdAt: now }
          },
          { upsert: true }
        );
      } catch (e) {
        console.warn('[Netlify] Could not seed thread in store:', e.message);
      }
    }

    // Return GENERATING status so frontend begins polling and displays live progress
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        status: 'GENERATING',
        message: 'Prompt dispatched to n8n Cloud pipeline',
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
