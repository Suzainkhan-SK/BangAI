// Netlify Function: chat
// Path: /.netlify/functions/chat
// Dedicated Separation:
// - /video: Pure n8n Autonomous Workflow Pipeline (Topic Analyzer -> Strategy Engine -> Approval -> 5 Scenes -> Rendering)
// - /chat: Bang AI Conversational AI Assistant (Powered by xKiro Qwen3.8 Max with Live Web Search)
// - /refine: Bang AI Script Doctor Refinement

import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg25.app.n8n.cloud/webhook/viral-shorts-ai';
const XKIRO_BASE_URL = process.env.XKIRO_BASE_URL || 'https://api.xkiro.com/v1';
const XKIRO_DEFAULT_MODEL = 'minimax/minimax-m3:free';

// Curated Top Free Models on xKiro for Bang AI Dropdown
export const BANG_AI_MODELS = {
  'bang-ai-ultra': {
    id: 'minimax/minimax-m3:free',
    name: 'Bang AI Ultra 4.0',
    tag: '1M Context • 65K Output',
    desc: 'Multimodal foundation model with 1M context, 65K output, video, vision & reasoning.',
    maxTokens: 65536
  },
  'bang-ai-max': {
    id: 'qwen/qwen3.8-max:free',
    name: 'Bang AI Max Strategist',
    tag: 'Viral Master • Web Search',
    desc: 'Flagship viral storytelling, 5-scene golden blueprint generator, and deep web citations.',
    maxTokens: 65536
  },
  'bang-ai-reasoning': {
    id: 'mistralai/mistral-large-2512',
    name: 'Bang AI Enterprise Reasoning',
    tag: 'Mistral Large • Deep Logic',
    desc: 'High-end frontier reasoning model for complex script structures, research, and analysis.',
    maxTokens: 32768
  },
  'bang-ai-omni': {
    id: 'qwen/qwen3.8-omni-flash:free',
    name: 'Bang AI Omni Flash',
    tag: 'Sub-Second Speed',
    desc: 'Ultra-fast response engine for instant hook variations, quick tag generation, and rapid Q&A.',
    maxTokens: 16384
  },
  'bang-ai-vision': {
    id: 'qwen/qwen3-vl-plus:free',
    name: 'Bang AI Vision Specialist',
    tag: 'Visual & Thumbnail Audit',
    desc: 'Specialized visual inspection model for analyzing thumbnails, screenshots, and artwork.',
    maxTokens: 16384
  },
  'bang-ai-coder': {
    id: 'mistralai/codestral-2508',
    name: 'Bang AI Automation Architect',
    tag: 'Code & JSON Mode',
    desc: 'Structured output master for n8n automations, JSON payloads, and technical scripts.',
    maxTokens: 32768
  }
};

// Smart Router: Intelligently select best model based on prompt complexity, vision, code, or speed
export function autoRouteModel({ message, images = [], webSearch = true, reasoning = false }) {
  const text = (message || '').toLowerCase();

  // 1. Vision / Image attachments
  if (Array.isArray(images) && images.length > 0) {
    return {
      key: 'bang-ai-vision',
      id: BANG_AI_MODELS['bang-ai-vision'].id,
      name: BANG_AI_MODELS['bang-ai-vision'].name,
      reason: 'Image attached — Routed to Vision Specialist',
      maxTokens: 16384
    };
  }

  // 2. Coding, JSON schemas, automated webhooks, technical tasks
  const codePatterns = [
    /\b(json|code|function|api|webhook|regex|script|python|javascript|typescript|curl|payload|schema|error|bug|sql)\b/i,
    /```/,
    /\b(html|css|react|node|docker)\b/i
  ];
  if (codePatterns.some(p => p.test(text))) {
    return {
      key: 'bang-ai-coder',
      id: BANG_AI_MODELS['bang-ai-coder'].id,
      name: BANG_AI_MODELS['bang-ai-coder'].name,
      reason: 'Technical content — Routed to Automation Architect',
      maxTokens: 32768
    };
  }

  // 3. Deep reasoning / Complex analysis / Philosophy / Deep thinking
  const reasoningPatterns = [
    /\b(analyze|compare|contrast|why|psychology|audit|critique|evaluate|deep dive|retention curve|strategy breakdown)\b/i,
    /\b(explain why|pros and cons|difference between|in depth)\b/i
  ];
  if (reasoning || reasoningPatterns.some(p => p.test(text))) {
    return {
      key: 'bang-ai-reasoning',
      id: BANG_AI_MODELS['bang-ai-reasoning'].id,
      name: BANG_AI_MODELS['bang-ai-reasoning'].name,
      reason: 'Deep analytical query — Routed to Enterprise Reasoning',
      maxTokens: 32768
    };
  }

  // 4. Quick brainstorms, short casual questions, instant answers
  const isShortQuick = text.length < 50 && !text.includes('script') && !text.includes('blueprint');
  if (isShortQuick && !webSearch) {
    return {
      key: 'bang-ai-omni',
      id: BANG_AI_MODELS['bang-ai-omni'].id,
      name: BANG_AI_MODELS['bang-ai-omni'].name,
      reason: 'Quick query — Routed to Omni Flash for sub-second speed',
      maxTokens: 16384
    };
  }

  // 5. Default Flagship: 1M Context + 65K Output (MiniMax M3 / Qwen Max)
  return {
    key: 'bang-ai-ultra',
    id: BANG_AI_MODELS['bang-ai-ultra'].id,
    name: BANG_AI_MODELS['bang-ai-ultra'].name,
    reason: 'Frontier multimodal engine — 1M Context & 65K Output',
    maxTokens: 65536
  };
}

// xKiro API Key Rotation Pool
const XKIRO_KEYS = [
  process.env.XKIRO_API_KEY_1 || 'sk-xt-e2786f0d32f17f1a0211ec5f1333c45379691ec0d6f9c954',
  process.env.XKIRO_API_KEY_2 || 'sk-xt-450bf12af511af1eceb44dd398886c93a08b8bc52341e623'
];

let currentKeyIndex = 0;

async function callBangAI(systemPrompt, conversationHistory, options = {}) {
  // Ultra-High Ceiling: 1M token context window and up to 65,536 max output tokens
  const {
    model = XKIRO_DEFAULT_MODEL,
    maxTokens = 65536,
    timeoutMs = 120000,
    jsonMode = false,
    webSearch = true,
    reasoning = false
  } = options;

  const rawList = Array.isArray(conversationHistory) ? conversationHistory : [];
  const messages = rawList
    .filter(m => m && (m.content || m.text))
    .map(m => {
      const role = m.role === 'user' ? 'user' : 'assistant';
      // Support multi-modal vision content (array of text + image_url)
      if (Array.isArray(m.content)) {
        return { role, content: m.content };
      }
      return {
        role,
        content: typeof m.content === 'string' ? m.content : (typeof m.text === 'string' ? m.text : JSON.stringify(m.content || m.text || ''))
      };
    })
    .filter(m => Array.isArray(m.content) ? m.content.length > 0 : (typeof m.content === 'string' && m.content.trim().length > 0));

  if (messages.length === 0) {
    messages.push({ role: 'user', content: 'Generate response' });
  }

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    max_tokens: maxTokens,
    temperature: reasoning ? 0.4 : 0.7
  };

  if (webSearch) {
    payload.web_search = { enable: true, count: 5 };
  }

  if (jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  let lastError = null;
  const pool = XKIRO_KEYS;
  const startIndex = currentKeyIndex;

  for (let attempt = 0; attempt < pool.length; attempt++) {
    const keyIdx = (startIndex + attempt) % pool.length;
    const apiKey = pool[keyIdx];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${XKIRO_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          currentKeyIndex = (keyIdx + 1) % pool.length;
          return {
            content: content.trim(),
            webSearch: json.web_search || null,
            usage: json.usage || null
          };
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[chat.js:xkiro] Key ${keyIdx} HTTP ${res.status}: ${errText.substring(0, 100)}`);
        lastError = new Error(`HTTP ${res.status}: ${errText.substring(0, 100)}`);
      }
    } catch (err) {
      console.warn(`[chat.js:xkiro] Key ${keyIdx} error: ${err.message}`);
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
        const aiRes = await callBangAI(systemPrompt, [{ role: 'user', content: `Refine this story according to: ${message.trim()}` }], {
          maxTokens: 1500,
          jsonMode: true,
          webSearch: false
        });
        const cleanJson = aiRes.content.replace(/```json/g, '').replace(/```/g, '').trim();
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

    // ─── MODE B: CONVERSATIONAL AI CHAT (Bang AI with Live Web Search) ───────────
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

      // Build conversation history from client-provided messages or the thread's stored messages
      let conversationHistory = [];
      const clientMessages = Array.isArray(payload?.messages) ? payload.messages : (Array.isArray(payload?.conversationHistory) ? payload.conversationHistory : null);
      const incomingImages = Array.isArray(payload?.images) ? payload.images : [];

      if (clientMessages && clientMessages.length > 0) {
        conversationHistory = clientMessages
          .filter(d => d && d.role && (d.content || d.text))
          .map(d => ({
            role: d.role === 'user' ? 'user' : 'assistant',
            content: Array.isArray(d.content) ? d.content : (typeof d.content === 'string' ? d.content : String(d.content || d.text || ''))
          }));
      } else if (db) {
        try {
          const thread = await db.collection('threads').findOne({ threadId: currentThreadId });
          const rawMsgs = thread?.messages || [];
          conversationHistory = rawMsgs
            .filter(d => d && d.role && (d.content || d.text))
            .map(d => ({
              role: d.role === 'user' ? 'user' : 'assistant',
              content: typeof d.content === 'string' ? d.content
                : typeof d.text === 'string' ? d.text
                : String(d.content || d.text || '')
            }))
            .filter(d => d.content.trim().length > 0);
        } catch (e) {
          console.warn('[CHAT] History fetch error:', e.message);
        }
      }

      // Format current user message with text + vision images if supplied
      let currentUserContent = cleanMessage;
      if (incomingImages.length > 0) {
        currentUserContent = [
          { type: 'text', text: cleanMessage || 'Analyze this image and assist with viral content strategy.' },
          ...incomingImages.map(img => ({
            type: 'image_url',
            image_url: { url: typeof img === 'string' ? img : img.url || img.data }
          }))
        ];
      }

      // Always ensure the new user message is at the end
      const lastMsg = conversationHistory[conversationHistory.length - 1];
      if (!lastMsg || lastMsg.role !== 'user') {
        conversationHistory = [...conversationHistory, { role: 'user', content: currentUserContent }];
      } else if (typeof lastMsg.content === 'string' && lastMsg.content !== cleanMessage) {
        conversationHistory = [...conversationHistory, { role: 'user', content: currentUserContent }];
      }

      // Must start with user role
      while (conversationHistory.length > 0 && conversationHistory[0].role !== 'user') {
        conversationHistory.shift();
      }

      if (conversationHistory.length === 0) {
        conversationHistory = [{ role: 'user', content: currentUserContent }];
      }

      const systemPrompt = `You are Bang AI (BangAI) — the creator's elite AI Co-Producer, creative director, and master viral strategist built directly inside the Bang AI Studio platform.

## STRICT IDENTITY & BRAND RULES (ABSOLUTE NON-NEGOTIABLE)
1. YOUR NAME IS EXCLUSIVELY "Bang AI" (or "BangAI").
2. NEVER mention Qwen, Alibaba, xKiro, Claude, Anthropic, Sonnet, OpenAI, ChatGPT, LLMs, or any underlying model name or external provider.
3. If the user asks "What model are you?", "Who made you?", "Which AI is this?", or anything similar, reply enthusiastically and firmly:
   "I am Bang AI — your dedicated viral studio co-producer and creative director built directly into the Bang AI platform!"
4. You are not a generic text assistant. You are an expert YouTube Shorts & Reels producer sitting right beside the creator in the Bang AI studio.

## SUPERCHARGED LIVE WEB SEARCH & RESEARCH CAPABILITIES
- REAL-TIME LIVE WEB SEARCH: You have live web search built directly into your core! When the user asks about real-time news, trending topics, recent events, viral YouTube Shorts trends, historical facts, or technical details, you can answer with real-time accuracy and cite live web sources ([1], [2]).
- LIVE VIRAL RESEARCH POWER: You can identify the freshest viral trends, audio styles, retention hooks, and real-time audience psychology to give creators an unfair advantage.

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

      const requestWebSearch = typeof payload?.webSearch === 'boolean' ? payload.webSearch : (typeof payload?.enableSearch === 'boolean' ? payload.enableSearch : true);
      const requestReasoning = payload?.reasoning === true || payload?.deepThink === true;

      // Dynamic Model Resolution: Auto-Routing or Manual Selection
      const requestedModelKey = payload?.modelKey || payload?.model || 'bang-ai-auto';
      let resolvedModelId = null;
      let resolvedMaxTokens = 65536;
      let routingInfo = null;

      if (requestedModelKey === 'bang-ai-auto' || requestedModelKey === 'auto') {
        const route = autoRouteModel({
          message: cleanMessage,
          images: incomingImages,
          webSearch: requestWebSearch,
          reasoning: requestReasoning
        });
        resolvedModelId = route.id;
        resolvedMaxTokens = route.maxTokens;
        routingInfo = { isAuto: true, key: route.key, name: route.name, reason: route.reason };
      } else {
        const resolvedConfig = BANG_AI_MODELS[requestedModelKey] || BANG_AI_MODELS['bang-ai-ultra'];
        resolvedModelId = resolvedConfig?.id || (requestedModelKey.includes('/') ? requestedModelKey : BANG_AI_MODELS['bang-ai-ultra'].id);
        resolvedMaxTokens = resolvedConfig?.maxTokens || 65536;
        routingInfo = { isAuto: false, key: requestedModelKey, name: resolvedConfig?.name || requestedModelKey, reason: 'Manually selected' };
      }

      const aiResult = await callBangAI(systemPrompt, conversationHistory, {
        model: resolvedModelId,
        maxTokens: resolvedMaxTokens,
        timeoutMs: 120000,
        webSearch: requestWebSearch,
        reasoning: requestReasoning
      });
      const aiReplyText = aiResult.content;

      const assistantMsgObj = {
        threadId: currentThreadId,
        sessionId: currentSessionId,
        role: 'assistant',
        content: aiReplyText,
        webSearch: aiResult.webSearch,
        routing: routingInfo,
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
          webSearch: aiResult.webSearch,
          routing: routingInfo,
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
