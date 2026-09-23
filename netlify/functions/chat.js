// Netlify Function: chat
// Path: /.netlify/functions/chat
// Dedicated Separation:
// - /video: Pure n8n Autonomous Workflow Pipeline (Topic Analyzer -> Strategy Engine -> Approval -> 5 Scenes -> Rendering)
// - /chat: Bang AI Conversational AI Assistant
// - /refine: Bang AI Script Doctor Refinement

import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg25.app.n8n.cloud/webhook/viral-shorts-ai';
const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://api.llmsrelay.com';
const CLAUDE_MODEL = 'claude-sonnet-5';

// Key Rotation Pool for llmsrelay (Key 2 verified 200 OK prioritized first)
const CLAUDE_KEYS = [
  process.env.CLAUDE_API_KEY_2 || 'sk-cs4-db2641233a8fbbd2e619a57ddd3acd8a1fb8fddf163b1923',
  process.env.CLAUDE_API_KEY_1 || 'sk-cs4-13029e38c50d4d22f101da2230b9877fa84b1c7f27c8792a'
];

async function callClaudeAI(systemPrompt, conversationHistory, maxTokens = 1500, timeoutMs = 25000) {
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
          model: CLAUDE_MODEL,
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
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[chat.js:llmsrelay] Key ${i} HTTP ${res.status}: ${errText.substring(0, 100)}`);
        lastError = new Error(`HTTP ${res.status}: ${errText.substring(0, 100)}`);
      }
    } catch (err) {
      console.warn(`[chat.js:llmsrelay] Key ${i} error: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`All Bang AI keys failed: ${lastError ? lastError.message : 'Unknown error'}`);
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

    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const userToken = authHeader.replace('Bearer ', '') || settings.token;
    const user = verifyToken(userToken);

    const threadIdentity = {};
    const resolvedUserId = user?.userId || user?.id || settings.userId || '';
    const resolvedEmail  = (user?.email || settings.email || '').toLowerCase();
    if (resolvedUserId) threadIdentity.userId = resolvedUserId;
    if (resolvedEmail)  { threadIdentity.email = resolvedEmail; threadIdentity.userEmail = resolvedEmail; }

    let safePrivacyStatus = 'public';

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
              ...threadIdentity,
              threadId: currentThreadId,
              sessionId: currentSessionId,
              rawUserInput: message.trim(),
              lastPrompt: message.trim(),
              mode,
              language: detectedLanguage,
              privacyStatus: safePrivacyStatus,
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

      const systemPrompt = `You are BangAI Master Script Doctor. 
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

    // ─── MODE B: CONVERSATIONAL AI CHAT (Bang AI Conversational AI) ───────────
    if (mode === 'CHAT') {
      // Clean command prefixes if user typed /chat, /hook, /tags, etc.
      let cleanMessage = message.trim();
      if (cleanMessage.startsWith('/chat')) {
        cleanMessage = cleanMessage.replace(/^\/chat\s*/i, '').trim();
      } else if (cleanMessage.startsWith('/hook')) {
        cleanMessage = cleanMessage.replace(/^\/hook\s*/i, '').trim();
      } else if (cleanMessage.startsWith('/tags')) {
        cleanMessage = cleanMessage.replace(/^\/tags\s*/i, '').trim();
      } else if (cleanMessage.startsWith('/script')) {
        cleanMessage = cleanMessage.replace(/^\/script\s*/i, '').trim();
      }
      if (!cleanMessage) cleanMessage = message.trim();

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
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== cleanMessage) {
        conversationHistory = [...conversationHistory, { role: 'user', content: cleanMessage }];
      }

      // Must start with user role — Claude requires alternating roles
      while (conversationHistory.length > 0 && conversationHistory[0].role !== 'user') {
        conversationHistory.shift();
      }

      if (conversationHistory.length === 0) {
        conversationHistory = [{ role: 'user', content: cleanMessage }];
      }

      const systemPrompt = `You are Bang AI (BangAI) — the creator's elite AI Co-Producer, creative director, and master viral strategist built directly inside the Bang AI Studio platform.

## STRICT IDENTITY & BRAND RULES (ABSOLUTE NON-NEGOTIABLE)
1. YOUR NAME IS EXCLUSIVELY "Bang AI" (or "BangAI").
2. NEVER mention Claude, Anthropic, Sonnet, Haiku, OpenAI, ChatGPT, LLMs, or any underlying model name or provider.
3. If the user asks "What model are you?", "Who made you?", "Which AI is this?", or anything similar, reply enthusiastically and firmly:
   "I am Bang AI — your dedicated viral studio co-producer and creative director built directly into the Bang AI platform!"
4. You are not a generic text assistant. You are an expert YouTube Shorts & Reels producer sitting right beside the creator in the Bang AI studio.

## COMPLETE PLATFORM KNOWLEDGE BASE (BANG AI ECOSYSTEM)

### 1. THE 75-SECOND 5-SCENE GOLDEN BLUEPRINT:
Bang AI videos are engineered around the high-retention 75-second multi-scene format:
- Scene 1 (0–15s): The Cold Open Hook. Stops the scroll in the first 1.5 seconds. Uses high-stakes curiosity gaps, unexpected visual statements, pattern interrupts, or shocking paradoxes.
- Scene 2 (15–30s): Context & Escalation. Fast narrative build, establishes emotional stakes, sharp visual pacing (1.10x–1.20x narration speed).
- Scene 3 (30–45s): Peak Climax / Turning Point. The central shocking reveal, terrifying twist, or unbelievable fact.
- Scene 4 (45–60s): Aftermath & Mystery. The consequences, inexplicable phenomena, or chilling aftermath.
- Scene 5 (60–75s): The Infinite Viral Loop & Interactive CTA. Loops seamlessly back into Scene 1's opening line so the viewer re-watches without noticing; delivers high-engagement comment triggers ("What would you do? Comment below!") and subscribe prompts.

### 2. STUDIOLAB & CANVAS TIMELINE EDITOR:
- 1080x1920 9:16 vertical canvas (24fps high-framerate rendering).
- 5-Scene Interactive Timeline with scene-by-scene script editor, visual prompt generator, and cinematic camera direction cues.
- Live Voice Studio: 21+ ElevenLabs studio voices:
  * Adam: Deep, raspy, authoritative (best for Horror, Mystery, True Crime, Thriller).
  * Rachel: Emotional, clear, warm, engaging (best for Drama, Inspirational, Last 24 Hours).
  * George: Deep historical narrator, authoritative documentary style.
  * Charlie: Fast, energetic, hype, modern viral style.
  * Voice speed slider: 1.10x to 1.20x recommended default (supported range 0.5x–4.0x).
  * Audio Ducking: Background music automatically ducks to -18dB when voice narration speaks.
- Dynamic Subtitle Engine: Real-time phrase chunking (4–8 words per card) with 6 high-retention presets:
  * Hormozi (Bold yellow/green uppercase with black shadow).
  * Electric Gold (Luminescent yellow with glow).
  * Neon Cyan (Cyberpunk glow, modern tech).
  * Crimson Glow (Horror, high-intensity red glow).
  * Cinematic Noir (Minimalist white with elegant letterbox spacing).
  * Clean Minimalist (Subtle, sleek modern aesthetic).

### 3. THREE AUTONOMOUS 1-CLICK TEMPLATES:
- 🛸 World Mysteries & Paranormal (template-world-mysteries): Self-researches viral paranormal enigmas (Bermuda Triangle, Dyatlov Pass, Voynich Manuscript, Mariana Trench, ancient lost civilizations), generates 5 cinematic scenes, photorealistic AI video, and auto-uploads.
- ⏳ Last 24 Hours [True Stories] (template-last-24-hours): Poignant, dramatic emotional countdowns of the final 24 hours of iconic figures (Princess Diana, Steve Jobs, Titanic heroes, Chernobyl liquidators, Freddie Mercury).
- 👻 3-AM Horror & Paranormal (template-3am-horror): Bone-chilling suspense, eerie psychological dread, dark ambient sound design, and sudden narrative turns crafted for maximum nighttime watch time.

### 4. DIRECT YOUTUBE AUTO-PUBLISHING & GOOGLE SHEETS:
- Multi-channel YouTube OAuth2 integration with direct Shorts auto-publishing.
- Automated metadata generation: click-magnet titles, SEO descriptions, trending tags (#shorts #viral), and automated pinned comments.
- Connected Google Sheets production logging with blocklist tracking so topics never repeat.

## TONE MIRRORING & CONVERSATIONAL MASTERY (CRITICAL)
- TONE & DIALECT MIRRORING: Always mirror the user's language, dialect, and energy level!
  * If the user speaks in Hinglish / Hindi ("bhai ek viral hook de", "bro kya scene hai", "ek tagda script likh", "kya chal raha hai"):
    Reply in fluent, natural, high-energy Hinglish or Hindi! Use natural Indian creator slang like "Bhai", "Boss", "Tagda", "Ekdum killer", "Bilkul", "Scene set hai", "Pakka hit hai", "Mast idea hai".
  * If the user speaks in casual English ("yo bro", "give me a crazy hook", "what's up"):
    Reply with warm, enthusiastic, high-energy creator vibes ("Let's cook!", "Retention is king", "Here's the sauce").
  * If the user is formal or analytical:
    Reply with structured, executive, data-driven viral marketing precision.
- PROACTIVE & ACTIONABLE:
  * Never give lazy, generic 1-line responses.
  * When asked for hooks or scripts, provide 2–3 distinct, battle-tested viral angles (e.g. Curiosity Gap Angle vs Shocking Fact Angle vs First-Person POV Angle).
  * Include clear visual camera prompts, voice recommendations, and speed tips.
- CLEAN FORMATTING:
  * Use bold markdown, bullet points, numbered lists, blockquotes, and tasteful emojis.`;

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
    const host = event.headers?.host || 'bangai.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    // Dynamic Token Resolution
    let userYouTubeAccessToken = '';
    let userYouTubeChannelTitle = '';
    let userYouTubeChannelId = '';
    let userSheetAccessToken = '';
    let userSpreadsheetId = '';
    let userSheetName = 'Production Log';
    let targetChannel = null;

    if (user && db) {
      try {
        const uid = user.userId || user.id;
        const userDoc = await db.collection('users').findOne({
          $or: [
            { id: uid },
            { _id: uid },
            { userId: uid },
            { email: user.email ? user.email.toLowerCase() : '' }
          ]
        });

        if (userDoc) {
          // Channel
          const selectedChannelId = settings.selectedChannelId || settings.channelId;
          const channels = userDoc.youtubeChannels || [];
          targetChannel = selectedChannelId ? channels.find(c => c.channelId === selectedChannelId) : (channels.find(c => c.isDefault) || channels[0] || null);

          if (targetChannel && targetChannel.tokens) {
            userYouTubeAccessToken = await getFreshGoogleToken(targetChannel, 'youtubeChannels') || '';
            userYouTubeChannelTitle = targetChannel.channelTitle || '';
            userYouTubeChannelId = targetChannel.channelId || '';
          }

          // Sheet
          const selectedSheetId = settings.selectedSheetId || settings.sheetId;
          const sheets = userDoc.sheets || [];
          let targetSheet = selectedSheetId ? sheets.find(s => s.sheetId === selectedSheetId || s.spreadsheetId === selectedSheetId) : (sheets.find(s => s.isDefault) || sheets[0] || null);

          if (!targetSheet && userDoc.googleSheets?.connected) {
            targetSheet = {
              spreadsheetId: userDoc.googleSheets.spreadsheetId || '',
              sheetName: 'Production Log',
              tokens: userDoc.googleSheets.tokens || targetChannel?.tokens || null
            };
          }

          if (targetSheet) {
            const sheetTokenContainer = targetSheet.tokens ? targetSheet : targetChannel;
            if (sheetTokenContainer) {
              userSheetAccessToken = await getFreshGoogleToken(sheetTokenContainer, 'youtubeChannels') || '';
            }
            userSpreadsheetId = targetSheet.spreadsheetId || '';
            userSheetName = targetSheet.sheetName || 'Production Log';
          }
        }
      } catch (tokenErr) {
        console.warn('[chat.js] Token lookup warning:', tokenErr.message);
      }
    }

    if (settings.autoUploadToYouTube !== false && !userYouTubeAccessToken && targetChannel && settings.forceWithoutUpload !== true) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'YOUTUBE_TOKEN_EXPIRED',
          message: `Your YouTube connection for "${targetChannel.channelTitle || 'YouTube'}" has expired. Please reconnect your channel on BangAI before starting generation.`
        })
      };
    }

    const autoUploadToYouTube = settings.autoUploadToYouTube !== false && !!userYouTubeAccessToken;
    const autoLogToSheet = settings.autoLogToSheet !== false;

    const rawSettings = settings || {};
    const rawPrivacy = rawSettings.privacyStatus || rawSettings.privacy || '';
    const requestedPrivacy = String(rawPrivacy).toLowerCase();
    safePrivacyStatus = ['public', 'private', 'unlisted'].includes(requestedPrivacy)
      ? requestedPrivacy
      : (['public', 'private', 'unlisted'].includes(String(targetChannel?.defaultPrivacy || '').toLowerCase())
          ? String(targetChannel.defaultPrivacy).toLowerCase()
          : 'public');

    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';
    const n8nPayload = {
      prompt: message.trim(),
      rawUserInput: message.trim(),
      voiceId: settings.voiceId || 'adam',
      elevenLabsVoiceId: settings.elevenLabsVoiceId || '',
      voiceSpeed: (function () {
        const v = Number(settings.voiceSpeed);
        return isFinite(v) && v > 0 ? Math.max(0.5, Math.min(4, v)) : 1.10;
      })(),
      visualStyle: settings.visualStyle || 'Cinematic Realistic',
      language: detectedLanguage,
      autoUploadToYouTube: autoUploadToYouTube,
      userYouTubeAccessToken: userYouTubeAccessToken,
      userYouTubeChannelTitle: userYouTubeChannelTitle,
      userYouTubeChannelId: userYouTubeChannelId,
      autoLogToSheet: autoLogToSheet,
      userSheetAccessToken: userSheetAccessToken,
      userSpreadsheetId: userSpreadsheetId,
      userSheetName: userSheetName,
      subtitleSettings: settings.subtitleSettings || null,
      musicId: settings.musicId || 'mystery2',
      musicTrackUrl: settings.musicTrackUrl || '',
      musicVolume: (function () {
        const v = Number(settings.musicVolume);
        return isFinite(v) ? Math.max(0, Math.min(0.4, v)) : 0.08;
      })(),
      voiceVolume: (function () {
        const v = Number(settings.voiceVolume);
        return isFinite(v) ? Math.max(0, Math.min(2.0, v)) : 1.0;
      })(),
      privacyStatus: safePrivacyStatus,
      callbackUrl,
      threadId: currentThreadId,
      sessionId: currentSessionId,
      webhookSecret: webhookSecret,
      timestamp: now.toISOString()
    };

    let n8nResponseOk = false;
    let n8nResponseStatus = 200;

    try {
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret
        },
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
          message: `n8n Cloud returned HTTP ${n8nResponseStatus}. Please ensure workflow LPDivELTTv8QD24u is Published & Active in cmpunktg25.`
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
              ...threadIdentity,
              threadId: currentThreadId,
              sessionId: currentSessionId,
              status: 'GENERATING',
              title: message.trim().substring(0, 60),
              rawUserInput: message.trim(),
              mode: 'VIDEO_GENERATION',
              language: detectedLanguage,
              privacyStatus: safePrivacyStatus,
              finalSettings: {
                voiceId: n8nPayload.voiceId,
                elevenLabsVoiceId: n8nPayload.elevenLabsVoiceId,
                voiceSpeed: n8nPayload.voiceSpeed,
                musicId: n8nPayload.musicId,
                musicTrackUrl: n8nPayload.musicTrackUrl,
                musicVolume: n8nPayload.musicVolume,
                subtitleSettings: n8nPayload.subtitleSettings,
                visualStyle: n8nPayload.visualStyle,
                language: n8nPayload.language,
                privacyStatus: n8nPayload.privacyStatus
              },
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
