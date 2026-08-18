// Netlify Function: chat
// Path: /.netlify/functions/chat
// Hybrid Routing: /video -> Claude Story Engine + n8n Webhook, /chat -> Claude Sonnet 5 Relay, /refine -> Script Doctor

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

    // ─── MODE C: VIDEO GENERATION (CLAUDE STORY ENGINE + N8N 4K PIPELINE) ────
    const host = event.headers?.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    // 1. Generate deep, engaging, high-retention 5-act story brief with Claude
    let generatedStory = null;
    try {
      const storyGenPrompt = `You are ShortsAI Master Screenplay Writer. Analyze the creator's video topic and generate a gripping, viral 75-second YouTube Short story strategy in ${detectedLanguage}.

Topic / Prompt: "${message.trim()}"
Language: "${detectedLanguage}"
Visual Style: "${settings.visualStyle || 'Cinematic Realistic'}"

CRITICAL RULES:
1. All text (title, hook, story brief) MUST be written in ${detectedLanguage}. ${detectedLanguage === 'English' ? 'Pure English only — no Hindi or Romanized Hindi.' : ''}
2. suggestedTitle: High-CTR, curiosity-driven YouTube Shorts title (max 50 chars) with 1 emoji.
3. viralHook: High-impact 3-second opening hook that stops the scroll.
4. storyBrief: Detailed 5-scene narrative breakdown:
   - Act 1 (0-15s): The Hook & Setup
   - Act 2 (15-30s): The Investigation / Escalation
   - Act 3 (30-45s): The Turning Point / Hidden Truth
   - Act 4 (45-60s): The Climax / Peak Tension
   - Act 5 (60-75s): The Resolution & Mind-Bending Question

Output ONLY a valid JSON object formatted as:
{
  "suggestedTitle": "Catchy Title with Emoji",
  "viralHook": "Shocking opening hook in ${detectedLanguage}",
  "storyBrief": "Detailed 5-act narrative brief in ${detectedLanguage}",
  "genre": "Documentary / Mystery / History / Science",
  "tags": ["shorts", "viral", "documentary", "mystery"]
}
Do NOT wrap in markdown code fences. Return raw JSON.`;

      const aiStoryRaw = await callClaudeAI(storyGenPrompt, conversationHistory, 1500);
      try {
        const cleanJson = aiStoryRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        generatedStory = JSON.parse(cleanJson);
      } catch(e) {}
    } catch (err) {
      console.warn('Claude Story pre-generation notice:', err.message);
    }

    if (!generatedStory) {
      generatedStory = {
        suggestedTitle: `${message.trim()} 😱 #Shorts`,
        viralHook: `What you never knew about ${message.trim()}.`,
        storyBrief: `The untold story and shocking secrets of ${message.trim()} across 5 dramatic perspectives.`,
        genre: 'Documentary',
        tags: ['shorts', 'viral', 'mystery']
      };
    }

    generatedStory.language = detectedLanguage;
    generatedStory.visualStyle = settings.visualStyle || 'Cinematic Realistic';
    generatedStory.status = 'READY_FOR_APPROVAL';
    generatedStory.timestamp = now.toISOString();

    const storyReviewMsg = {
      threadId: currentThreadId,
      sessionId: currentSessionId,
      role: 'assistant',
      content: `Story ready for review: "${generatedStory.suggestedTitle}"`,
      story: generatedStory,
      status: 'READY_FOR_APPROVAL',
      timestamp: now
    };

    // Immediately save READY_FOR_APPROVAL to MongoDB
    if (db) {
      try {
        await db.collection('messages').insertOne(storyReviewMsg);
        await db.collection('threads').updateOne(
          { threadId: currentThreadId },
          {
            $set: {
              title: generatedStory.suggestedTitle,
              story: generatedStory,
              status: 'READY_FOR_APPROVAL',
              updatedAt: now
            },
            $push: { messages: storyReviewMsg }
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.warn('MongoDB story review save notice:', dbErr.message);
      }
    }

    // Fire-and-forget / non-blocking dispatch to n8n Cloud webhook
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: generatedStory.storyBrief || message.trim(),
        rawUserInput: message.trim(),
        refinedStory: generatedStory,
        isRefined: true,
        voiceId: settings.voiceId || 'adam',
        visualStyle: settings.visualStyle || 'Cinematic Realistic',
        language: detectedLanguage,
        autoUploadToYouTube: !!settings.autoUploadToYouTube,
        callbackUrl,
        threadId: currentThreadId,
        sessionId: currentSessionId,
        timestamp: now.toISOString()
      })
    }).catch(e => console.warn('n8n Webhook background dispatch notice:', e.message));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        status: 'READY_FOR_APPROVAL',
        message: 'Story generated and ready for review',
        story: generatedStory,
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
