// Netlify Function: chat
// Path: /.netlify/functions/chat
// Dedicated Separation:
// - /video: Pure n8n Autonomous Workflow Pipeline (Topic Analyzer -> Strategy Engine -> Approval -> 5 Scenes -> Rendering)
// - /chat: Claude Conversational AI
// - /refine: Claude Script Doctor Refinement

import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg25.app.n8n.cloud/webhook/viral-shorts-ai';

// RapidAPI Double-GPT Provider & Key Rotation Pool
const RAPIDAPI_HOST = 'double-gpt.p.rapidapi.com';
const RAPIDAPI_MODEL = 'claude-haiku-4-5';

const RAPIDAPI_KEYS = [
  // 14 Verified 200 OK Active Keys (Prioritized)
  '93fa453252mshd676e411e75bd70p175580jsn4e69cd205b0a',
  'eebced792emsh92d38cce4af7791p1609cfjsnac6955346477',
  'c8f5a6205fmsh5591e0943624d73p1b06e3jsn23e0be485fcd',
  'efd0ea6a8bmshd24036c55d2bc71p10d162jsnd44d6a7c9341',
  '433d5ca5afmsh6f5ba24b66bb8a6p167149jsn3f23249d853b',
  'c000ff3ea0mshd743eaad4a39eb7p1f855ajsn6b303cb35381',
  '1e48160e7fmshfe1987e9ded3b88p16e690jsn8fe102065918',
  '341670e677msh3d1555d62941208p1af732jsnaf90c385408c',
  '750376d519msh570235a4fc31a85p192539jsn5e3ff7bf57c4',
  'c98d722d02msh30b1e3592e3e4aep151dc4jsnc4c068595520',
  'f5fcd4e2bdmshf7ebd4d55b32d16p1e0e9ajsnf8bf202ecbe0',
  '774158e8acmshaebdbbc9b6793abp163ed5jsn993ea29b5def',
  'a9966d64d7msh9f6fff09f298c25p143e62jsn038b8f1f2ea2',
  'b8b3e05c00msh7b3aa11da7ee786p16a604jsn56f8bac7c5c0',

  // Remaining Workflow LLM Keys in Rotation Pool (Auto-fallback)
  'e8dddcdad5msh80e5a3d80b70d34p15eeffjsn5954cc89f72f',
  'c822c4293emsh61f15bb9eeabb99p14956cjsn1fa2f74ad9f1',
  '2b015b49e7msha9808f1d1ae6654p178d39jsn886507cf88a8',
  '54df5cbe66msh5a2f44867ada346p18df76jsn336df21434a7',
  'c056caf42emsh31e2a3a34483eb4p19cccfjsn41c571dc31bd',
  'ab6f5348c2msh8281a24f8b505c4p1f6c25jsna9ee25a649d0',
  '848eb4ffddmsh58f9567b7db884cp1d1c54jsn60b88f0e3779',
  'f41ee35008msh5b19caf9c84272ap11798djsn512a89d21ed0',
  'a3d237de1fmsh49cacb3b6135a4ap103ea3jsn569e0a83226c',
  'fcbd945aadmsh112cce0a275d0eap124955jsn3220d403adce',
  '26e6d74486msh8320fe33886d72fp1e2b6djsnc9563257205d',
  '2c71f05f04msh66b504f108fbe83p18a27cjsn833047e221b7',
  '523d71d7bbmsh8c5854f3f38e4dep1aadbbjsn712216c12405',
  '89e676c1a8msh9edad37fea724f7p1c984djsn6dead39f1288',
  '13bba6f9d5msh43be67f9c2783bap10233ejsn982a87d14dc5',
  '305b028429msh1db3176b3254a35p1169aejsn772a12065497',
  '9ca5da259cmsh3a660d7ab6ba7d0p1087e8jsnbd892cff89c6',
  '1368f000e0msha6f2d86fee3d845p132daajsn2bf8c5dd920f',
  'd9845def61mshdacdb4007309c6fp195954jsned03446505ef',
  '6705f6c2aemsh5ebe51663051d47p11e343jsne4aeaa2a0469',
  'fd4b480f62msh914725249be31b0p15b789jsn9e23a9bf2dbb',
  '34d9f71051mshbz09cdba47ae257p15b690jsn6888e03c3b59',
  '08085db5dcmsh4ab0f8c4a2ffba7p14c403jsna3ad47bd9b7c',
  '74886c717bmsh9c3efd341f1c38ap138346jsn554d4efe16a6',
  'd7b825a9f9msh3e0cf5117fc0463p1573b1jsnc08624151a8d',
  'a69122327amsh011d464cbd5cc3ap1a0149jsn24a3001f96e6',
  '28a8590227msh433a6e2d2767e72p1398d7jsndad0cd01a825',
  '1c135d0e97msh801965027a8012bp1b9799jsnd5f63cb60f08',
  '9c2be1f9d0msh463b7f9ffdf5e35p191d3djsna4d7d99e3029',
  '9b4c2e70dfmsha02e0eb9a48802ap160f19jsn6963d913b753',
  'c8423adb0bmsh210ef1fe692aab0p136836jsn85739f0e8560',
  'b9cf30db25msh30c4a5ebb3891a0p1b276ejsn64bc71c36067',
  '0603a8dd87msh2cd2a3aa7e3e23bp11fac4jsn747c62e86fb4',
  '9d45f1a030msh02e966801dd9a49p1af4b0jsn28164501aad4',
  'bccd2ddec3msh8ee7b03233bfbffp1d3ef5jsn70ac2cfad714',
  '0128f6dca9mshd9a75d1921ca1a0p1f8bc4jsna171cb5c8e39',
  '4d52aa3a62mshc6fe5ecac31f752p1ca190jsn1201e61c5fbe',
  '9b6c00cd34msh48c26d1832306e0p14b20fjsneab8fc7ddb0a',
  '48d3bd8fcamsh6254cc646f90764p1472b0jsnb23772ef34ad',
  '4705b75321mshbf44c1f50689c5ep1cd333jsn4a0fbeced195',
  'f7b88a3fe6mshef7640e73ade68ep1a4f5ejsn9326bb9a64ae',
  '3f886e303amsh75d9deacc6179a8p10ef41jsn7d95e99fc8b6',
  'a9af273873msh79d1f17af6368f3p1580f8jsna1ada97ef51c',
  'a8f11ef94bmshfff7d5456d7ef86p11d93fjsn60358aedf8dd',
  '868586a2damsh1ceb2ad7c162472p197605jsn6ea5d60777d7',
  'b3410fb0b4mshdf7e2caff8489dap1bed6fjsn078d4c267f7b',
  '7179741192msh941d11078b15c4fp1fd8cfjsn8e343b3aff6a',
  '25469d08c4msha4ddc1c513c719cp1f1715jsndd0e53efbbcf',
  '1361fdbcf0mshb7bf56bb548dec8p12c88cjsnc529f74dfccc',
  'd2e61de399msh3b2a03ade1f08acp19e5a0jsn1d93cd78bd68',
  'ada447f606msh2ac7670407cca96p1f1b2bjsn28cd6aefd02a',
  'c0478a3036msh84ae27d52e661dbp1e455ejsnc0e2c0575533',
  '791f62e7abmsh7219bc240e5c73cp1245cbjsn29c1710433d9',
  'be07f05fcamshd5bf1bec1f29b50p1fd60ejsn05af15a26456',
  '9db7892bdcmshfa24b043c1a46d8p10a85ajsn9f027cbdf594',
  '2fbcedb97cmsh11f57f40d5bd69fp15aecajsnd7dc2accd744',
  '9f9916de13msh92b2e6359125492p1cbe4ejsn75679c90e20a',
  '87cbb50a70mshfcd8a9e31a3d5d5p1bb945jsnab37afeba946',
  '28b32ea28cmshadf965c5139813dp126e0ejsn769b5b29b2c9',
  '04f7285516mshde5392eab6ed456p1c123fjsne85987d89572',
  '025d07938dmsha6fa5bea1fa9e46p1379c9jsn51e2f405de04',
  'a1af45b1f9mshde4625b5bd8990ep115113jsn61b1e12c4266',
  '67d54d377emsh9d46f2a2331df07p1f2f22jsneb67449bc984',
  'd467326a2bmsh8e10cde01858e6ep150039jsnc97e4ae2c918',
  '23e23aa2e8msh559c10ba6470d55p1e0911jsn7cf57d45a41f',
  '18e9607da3msh77442d8ff7820c4p105dc2jsn49e56efcfcc8',
  '279203737amsh10bc9f6716cb3d8p1a0bbdjsnac8c113cd7bc',
  '80263a2b31msh3044eeb9d8b3943p1db6d0jsn32fe268e8909',
  '96cb417d05mshabdc4c4be964eeap195be5jsnfbb8ddaa46df',
  'a7bdae9706mshe40e21c7d10911cp118693jsna701c23e644f',
  'f24488741emsh749228e17e9b1acp11c597jsn9477fad7e589',
  'ee725f2476mshe5796e7806ca445p1b5011jsn7f9b25b3d396',
  '506c5d47c9mshd3d2240f7ad9ac0p1620f7jsncb9e12d15d7d',
  'dd361a0bd0msh907671be9777263p1d4cc9jsn6f2566ba5d92',
  '155d562730msh246f2c7fa69d3fap1c3b3cjsnaa47ef9ad919',
  '00a3bd445amsh0386b1a44ec3a71p18b350jsn186b357d92e3',
  '2da039d7b1mshab9a4a1b0de36f1p17d8b8jsnbf5147019048',
  'f0d6ab26e5mshb7da11650a3fdc5p1cde6ajsn26a9cefafa6b',
  'bdb7472a34msh9534ae7807b77b0p17afd3jsnd8c48c0e25e8',
  '8cff4c12c9msh74cc3a590e23846p1ed983jsn1181241c5b50',
  '05fa2e4ffcmshb79ee3959dc2ce7p151a68jsn5a5a6b879629',
  '550ed5a6d5msh3ec3ceaab049c2ep1df259jsn479b113c65b6',
  'cfffae8947msha171e0b3b63b246p145d30jsna9dfcbdb1143',
  'ff893eed46msh00f933a12cecb85p1253bbjsne244554154da',
  'b99a1cb3bcmsh09aa9a3ccea0b42p1e595bjsncb28e340c1bd',
  '91f2f85e38msh27dd3878198b70bp1b99f8jsn988340b0d0df',
  '12760fd02emsh070462bff3ef734p134775jsnb2c6391212b0',
  '5b504a0257mshde5d6d022bac458p1d000cjsn7f529e5754e2',
  '22648119ecmshccaf72e731494b2p153ef2jsn5ff274ca9221',
  'c1c23453e0mshec87c96a672e10fp1fab93jsn28dc053b9ece'
];

let currentKeyIndex = 0;

async function callRapidApiClaude(systemPrompt, conversationHistory, maxTokens = 1500, timeoutMs = 25000) {
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

  // Prepend instructions into the user context as well, to ensure that even if the RapidAPI proxy drops the system role, Claude Haiku 4.5 gets 100% of the knowledge & tone guidelines!
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const firstUserIdx = formattedMessages.findIndex(m => m.role === 'user');
  if (firstUserIdx !== -1 && !formattedMessages[firstUserIdx].content.includes('[BANGAI AI CO-PRODUCER]')) {
    formattedMessages[firstUserIdx] = {
      ...formattedMessages[firstUserIdx],
      content: `[BANGAI AI CO-PRODUCER INSTRUCTIONS]\n${systemPrompt}\n[END INSTRUCTIONS]\n\nCreator Request: ${formattedMessages[firstUserIdx].content}`
    };
  }

  const pool = RAPIDAPI_KEYS;
  const startIndex = currentKeyIndex;
  let lastError = null;

  for (let attempt = 0; attempt < Math.min(pool.length, 25); attempt++) {
    const keyIdx = (startIndex + attempt) % pool.length;
    const apiKey = pool[keyIdx];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`https://${RAPIDAPI_HOST}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': apiKey
        },
        body: JSON.stringify({
          model: RAPIDAPI_MODEL,
          messages: formattedMessages,
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
          currentKeyIndex = (keyIdx + 1) % pool.length;
          return content.trim();
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[chat.js:double-gpt] Key index ${keyIdx} HTTP ${res.status}: ${errText.substring(0, 100)}`);
        lastError = new Error(`HTTP ${res.status}: ${errText.substring(0, 100)}`);
      }
    } catch (err) {
      console.warn(`[chat.js:double-gpt] Key index ${keyIdx} error: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`All RapidAPI keys for double-gpt (${RAPIDAPI_MODEL}) failed: ${lastError ? lastError.message : 'Unknown error'}`);
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

    const authHeader = event.headers.authorization || '';
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
        const aiRaw = await callRapidApiClaude(systemPrompt, [{ role: 'user', content: `Refine this story according to: ${message.trim()}` }], 1500);
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

    // ─── MODE B: CONVERSATIONAL AI CHAT (RapidAPI Double-GPT Claude Haiku 4.5) ───────────
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

      const systemPrompt = `You are BangAI (Bang AI) — the creator's elite AI Co-Producer, creative director, and viral strategist built directly into the BangAI studio platform.

## ABOUT BANGAI & PLATFORM CAPABILITIES
BangAI is an autonomous viral video creation studio designed to produce high-retention 75-second YouTube Shorts, Instagram Reels, and TikTok videos.

1. THE 75-SECOND 5-SCENE GOLDEN BLUEPRINT:
   - Scene 1 (0–15s): The Cold Open Hook. Stops the scroll in 1.5 seconds. Uses high-stakes curiosity gaps, unexpected visual statements, or pattern interrupts.
   - Scene 2 (15–30s): Escalation & Context. Deepens stakes, introduces the core dilemma or character, keeps voice pacing brisk (1.20x).
   - Scene 3 (30–45s): The Peak Climax / Turning Point. The core shocking twist, unbelievable historical fact, or terrifying revelation.
   - Scene 4 (45–60s): The Aftermath & Resolution. Consequences, miraculous survival, or eerie lingering mystery.
   - Scene 5 (60–75s): The Viral Loop & CTA. Seamlessly connects back to Scene 1's opening line so the short loops endlessly, plus delivers a comment-driving question ("What would you do? Comment below!") and subscribe prompt.

2. STUDIOLAB & CANVAS TIMELINE EDITOR:
   - 5-Scene Interactive Timeline with 1080x1920 9:16 vertical canvas.
   - Scene-by-scene script editor, visual prompt generator, and camera direction controls.
   - Live Voice Studio: 21+ ElevenLabs studio voices (Adam, Josh, Rachel, Charlie, Antoni, etc.), calibrated voice speed slider (1.10x to 1.50x, default 1.10x–1.20x), ambient music ducking (-18dB).
   - Dynamic High-Retention Subtitles: Real-time phrase chunking (4–8 words per card) with dynamic styles (Hormozi, Electric Gold, Neon Cyan, Crimson Glow, Cinematic Noir, Clean Minimalist).

3. 3 AUTONOMOUS 1-CLICK TEMPLATES:
   - 🛸 World Mysteries & Paranormal (template-world-mysteries): Self-researches unrepeated paranormal enigmas (Bermuda Triangle, Dyatlov Pass, Voynich Manuscript, Mariana Trench anomalies), scripts 5 cinematic scenes, renders photorealistic AI video, and uploads directly to YouTube without manual review.
   - ⏳ Last 24 Hours [True Stories] (template-last-24-hours): Counts down the poignant, dramatic final 24 hours of legendary figures and historic events (Princess Diana, Steve Jobs, Titanic, Chernobyl heroes) with empathetic narration and emotional hooks.
   - 👻 3-AM Horror & Paranormal (template-3am-horror): Bone-chilling psychological terror and terrifying 3 AM encounters. Maximum camera movement, eerie suspense, and dark sound design crafted for viral retention.

4. DIRECT YOUTUBE AUTO-UPLOAD & PRODUCTION LOGGING:
   - Direct Google OAuth2 integration with one-click channel selection.
   - Automatic upload to YouTube Shorts with viral tags, description, and automated pinned comment.
   - Google Sheets production logging with blocklist tracking so topics never repeat.

## TONE MATCHING & CONVERSATIONAL STYLE (CRITICAL)
- TONE & DIALECT MIRRORING: Always mirror the user's language, dialect, and energy level!
  * If the user speaks in Hinglish / Hindi ("bhai ek viral hook de", "bro kya scene hai", "kya chal raha hai", "ek tagda script likh"):
    Reply in natural, energetic, fluent Hinglish or Hindi! Use natural conversational creator slang like "Bhai", "Boss", "Tagda", "Ekdum killer", "Bilkul", "Scene set hai", etc.
  * If the user speaks in casual English ("yo bro", "give me a crazy idea", "what's up"):
    Reply with warm, enthusiastic, high-energy creator vibes!
  * If the user is formal or analytical:
    Reply with structured, executive, data-driven viral marketing precision.
- FRIENDLY, SUPPORTIVE & PROACTIVE:
  * Act as their dedicated creative director and producer sitting right beside them in the studio.
  * Never give lazy, generic 1-line answers. Give rich, ready-to-use hooks, visual descriptions, camera cues, and sound design suggestions.
  * When giving scripts or hooks, give 2-3 distinct angles (e.g. Psychological Hook vs Visual Hook vs Shocking Fact Hook).
- CLEAN FORMATTING:
  * Use bold markdown, bullet points, numbered lists, blockquotes, and tasteful emojis.`;

      const aiReplyText = await callRapidApiClaude(systemPrompt, conversationHistory, 1200, 25000);

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
