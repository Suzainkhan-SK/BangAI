// Netlify Function: approve-story
// Path: /.netlify/functions/approve-story
// Master 5-Scene Screenplay Writer + n8n Video Pipeline Trigger

import { getDb } from './db.js';

const N8N_MAIN_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';
const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://api.llmsrelay.com';

const CLAUDE_KEYS = [
  process.env.CLAUDE_API_KEY_1 || 'sk-cs4-13029e38c50d4d22f101da2230b9877fa84b1c7f27c8792a',
  process.env.CLAUDE_API_KEY_2 || 'sk-cs4-db2641233a8fbbd2e619a57ddd3acd8a1fb8fddf163b1923'
];

async function callClaudeAI(systemPrompt, userPrompt, maxTokens = 2500, timeoutMs = 12000) {
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
            { role: 'user', content: userPrompt }
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
    const { 
      approveUrl, 
      threadId, 
      sessionId, 
      action = 'APPROVE', 
      story, 
      refinedStory,
      language = 'English',
      voiceId = 'adam',
      visualStyle = 'Cinematic Realistic',
      autoUploadToYouTube = false
    } = payload;
    
    const storyToPass = refinedStory || story || null;
    const effectiveLanguage = storyToPass?.language || language || 'English';
    const effectiveTitle = storyToPass?.suggestedTitle || storyToPass?.title || 'Viral Short';
    const effectiveBrief = storyToPass?.storyBrief || storyToPass?.viralHook || 'Viral Story';
    const effectiveStyle = storyToPass?.visualStyle || visualStyle || 'Cinematic Realistic';

    const now = new Date();
    const host = event.headers?.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    let db = null;
    try {
      db = await getDb();
    } catch (e) {}

    // ─── 1. HANDLE CANCEL ACTION ──────────────────────────────────────
    if (action === 'CANCEL') {
      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const cancelTarget = approveUrl.includes('approval=') 
          ? approveUrl.replace('approval=yes', 'approval=no')
          : `${approveUrl}${sep}approval=no`;
        try { fetch(cancelTarget).catch(() => {}); } catch (e) {}
      }

      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'CANCELLED', 
              'story.approveUrl': null,
              updatedAt: now 
            } 
          }
        );
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, action: 'CANCEL', threadId })
      };
    }

    // ─── 2. HANDLE STAGE 2: APPROVE SCENES & RENDER VIDEO ─────────────
    if (action === 'APPROVE_SCENES' || action === 'RENDER_VIDEO') {
      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'RENDERING_VIDEO', 
              updatedAt: now 
            } 
          }
        );
      }

      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const targetUrl = approveUrl.includes('approval=') ? approveUrl : `${approveUrl}${sep}approval=yes`;
        fetch(targetUrl).catch(() => {});
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          action: 'RENDER_VIDEO',
          status: 'RENDERING_VIDEO',
          threadId
        })
      };
    }

    // ─── 3. HANDLE STAGE 1: APPROVE STORY -> GENERATE 5 SCENES ────────
    // Generate Master 5-Scene Screenplay with Claude Sonnet 5
    const isEnglish = (effectiveLanguage || '').toLowerCase().includes('eng');

    const systemPrompt = `You are Viral Shorts AI Master Screenplay Writer.
Generate a complete 5-scene viral YouTube Shorts script (75 seconds total, exactly 5 scenes of 15s each).

CRITICAL RULES:
1. Title: 60-90 characters including emoji.
2. corePlot: 1 powerful sentence capturing the full arc.
3. youtubeDescription: 300-500 words structured overview.
4. tags: 8-10 viral tags.
5. scenes: Array of EXACTLY 5 scenes:
   - sceneNumber: 1 to 5
   - duration: 15
   - voiceoverText: EXACTLY 190-200 characters in ${effectiveLanguage}. ${isEnglish ? 'Pure English only — no Hindi or Romanized Hindi.' : ''}
   - videoPrompt: 300-500 characters in PURE ENGLISH specifying "${effectiveStyle} aesthetic" with dramatic cinematic lighting, photorealistic details, 9:16 vertical.
   - Scene 5 MUST include a subtle curiosity/engagement question at the end.

Return ONLY a valid JSON object matching this schema:
{
  "title": "${effectiveTitle}",
  "corePlot": "One sentence plot",
  "category": "${storyToPass?.genre || 'Documentary'}",
  "youtubeDescription": "Full structured YouTube description",
  "tags": ["shorts", "viral", "trending"],
  "scenes": [
    {
      "sceneNumber": 1,
      "voiceoverText": "190-200 chars voiceover in ${effectiveLanguage}",
      "videoPrompt": "300-500 chars prompt in English ending with 9:16 vertical",
      "duration": 15
    },
    {
      "sceneNumber": 2,
      "voiceoverText": "190-200 chars voiceover in ${effectiveLanguage}",
      "videoPrompt": "300-500 chars prompt in English ending with 9:16 vertical",
      "duration": 15
    },
    {
      "sceneNumber": 3,
      "voiceoverText": "190-200 chars voiceover in ${effectiveLanguage}",
      "videoPrompt": "300-500 chars prompt in English ending with 9:16 vertical",
      "duration": 15
    },
    {
      "sceneNumber": 4,
      "voiceoverText": "190-200 chars voiceover in ${effectiveLanguage}",
      "videoPrompt": "300-500 chars prompt in English ending with 9:16 vertical",
      "duration": 15
    },
    {
      "sceneNumber": 5,
      "voiceoverText": "190-200 chars voiceover in ${effectiveLanguage}",
      "videoPrompt": "300-500 chars prompt in English ending with 9:16 vertical",
      "duration": 15
    }
  ]
}
Do NOT wrap in markdown code blocks. Return ONLY the raw JSON object.`;

    const userPrompt = `Write the 5-scene screenplay for:
Title: "${effectiveTitle}"
Story Brief: "${effectiveBrief}"
Language: "${effectiveLanguage}"
Visual Style: "${effectiveStyle}"`;

    let scenesData = null;
    try {
      const rawAi = await callClaudeAI(systemPrompt, userPrompt, 2500, 10000);
      const cleanJson = rawAi.replace(/```json/g, '').replace(/```/g, '').trim();
      scenesData = JSON.parse(cleanJson);
    } catch (err) {
      console.warn('Claude Screenplay generation fallback:', err.message);
    }

    if (!scenesData || !scenesData.scenes || scenesData.scenes.length === 0) {
      scenesData = {
        title: effectiveTitle,
        corePlot: effectiveBrief,
        category: 'Viral Short',
        youtubeDescription: `The untold story of ${effectiveTitle}.`,
        tags: ['shorts', 'viral', 'trending'],
        scenes: [
          {
            sceneNumber: 1,
            voiceoverText: `It began as an ordinary day, but what happened next would defy everything we thought we knew about ${effectiveTitle}.`,
            videoPrompt: `${effectiveStyle} aesthetic. Cinematic dramatic opening scene, hyper-detailed environment, mysterious atmosphere, volumetric lighting, 8k resolution, 9:16 vertical.`,
            duration: 15
          },
          {
            sceneNumber: 2,
            voiceoverText: `Witnesses reported strange occurrences that nobody could explain. Instruments failed and communication was cut off instantly.`,
            videoPrompt: `${effectiveStyle} aesthetic. Intense close up of vintage analog gauges malfunctioning, glowing amber lights, dramatic shadows, 9:16 vertical.`,
            duration: 15
          },
          {
            sceneNumber: 3,
            voiceoverText: `When investigators arrived at the scene, they uncovered clues that only deepened the mystery rather than solving it.`,
            videoPrompt: `${effectiveStyle} aesthetic. Aerial cinematic sweeping shot over vast atmospheric landscape at dusk, high tension cinematic composition, 9:16 vertical.`,
            duration: 15
          },
          {
            sceneNumber: 4,
            voiceoverText: `Classified documents released decades later revealed the chilling truth that authorities tried to conceal from the public.`,
            videoPrompt: `${effectiveStyle} aesthetic. Secret archives room illuminated by single desk lamp, dusty classified dossiers, moody chiaroscuro lighting, 9:16 vertical.`,
            duration: 15
          },
          {
            sceneNumber: 5,
            voiceoverText: `To this day, the real question remains unanswered. What do you think really happened? Tell us your thoughts in the comments below.`,
            videoPrompt: `${effectiveStyle} aesthetic. Eerie fading silhouette against a dramatic sunset horizon, reflective water, cinematic ending shot, 9:16 vertical.`,
            duration: 15
          }
        ]
      };
    }

    const finalScenes = scenesData.scenes;
    const finalTitle = scenesData.title || effectiveTitle;

    const scenesMsg = {
      threadId,
      sessionId: sessionId || 'default-session',
      role: 'assistant',
      content: `🎬 **5 Scenes Generated:** "${finalTitle}"\n\nReview each scene script and visual prompt below before rendering 4K video.`,
      scenes: finalScenes,
      status: 'SCENES_READY_FOR_APPROVAL',
      timestamp: now
    };

    // Update MongoDB with SCENES_READY_FOR_APPROVAL
    if (db && threadId) {
      try {
        await db.collection('messages').insertOne(scenesMsg);
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              title: finalTitle,
              corePlot: scenesData.corePlot,
              youtubeDescription: scenesData.youtubeDescription,
              tags: scenesData.tags,
              scenes: finalScenes,
              status: 'SCENES_READY_FOR_APPROVAL',
              updatedAt: now
            },
            $push: { messages: scenesMsg }
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.warn('MongoDB save scenes error:', dbErr.message);
      }
    }

    // Resume n8n Wait node in background if approveUrl exists
    if (approveUrl) {
      const sep = approveUrl.includes('?') ? '&' : '?';
      const targetUrl = approveUrl.includes('approval=') ? approveUrl : `${approveUrl}${sep}approval=yes`;
      fetch(targetUrl).catch(() => {});
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'APPROVE',
        status: 'SCENES_READY_FOR_APPROVAL',
        title: finalTitle,
        scenes: finalScenes,
        threadId
      })
    };

  } catch (err) {
    console.error('Approve Story Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
