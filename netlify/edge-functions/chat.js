// Netlify Edge Function: Real-Time SSE Streaming Proxy for Bang AI 4.5
// Runs on Deno at edge locations worldwide with zero cold start and NO 10s timeout ceiling.

const XKIRO_BASE_URL = 'https://api.xkiro.com/v1';
const XKIRO_KEYS = [
  'sk-xt-e2786f0d32f17f1a0211ec5f1333c45379691ec0d6f9c954',
  'sk-xt-450bf12af511af1eceb44dd398886c93a08b8bc52341e623'
];

export const BANG_AI_MODELS = {
  'bang-ai-auto': {
    id: 'mistralai/mistral-large-2512',
    name: 'Bang AI 4.5 Auto',
    tag: 'Auto • Best Model'
  },
  'bang-ai-ultra': {
    id: 'minimax/minimax-m3:free',
    name: 'Bang AI 4.5 Ultra',
    tag: '1M Context • 65K Output'
  },
  'bang-ai-thinking': {
    id: 'mistralai/mistral-large-2512',
    name: 'Bang AI 4.5 Thinking',
    tag: 'Deep Reasoning • Logic'
  },
  'bang-ai-search': {
    id: 'qwen/qwen3.8-max:free',
    name: 'Bang AI 4.5 Search',
    tag: 'Web Search • Live Citations'
  },
  'bang-ai-flash': {
    id: 'mistralai/mistral-large-2512',
    name: 'Bang AI 4.5 Flash',
    tag: 'Fastest • Low Latency'
  },
  'bang-ai-coder': {
    id: 'mistralai/mistral-large-2512',
    name: 'Bang AI 4.5 Coder',
    tag: 'Full Apps • Code & Scripts'
  },
  'bang-ai-vision': {
    id: 'minimax/minimax-m3:free',
    name: 'Bang AI 4.5 Vision',
    tag: 'Vision • Multimodal'
  }
};

function autoRouteModel({ message = '', images = [], webSearch = false, reasoning = false }) {
  const text = message.toLowerCase();

  if (Array.isArray(images) && images.length > 0) {
    return {
      key: 'bang-ai-vision',
      id: 'minimax/minimax-m3:free',
      name: 'Bang AI 4.5 Vision',
      reason: 'Vision Attachment Detected — Routed to 4.5 Vision'
    };
  }

  const codePatterns = [
    /\b(website|portfolio|html|css|javascript|react|vue|node|app|frontend|backend|json|code|function|api|webhook|regex|script|python|typescript|curl|payload|schema|error|bug|sql)\b/i,
    /```/,
    /\b(build me a|create a website|make a page)\b/i
  ];
  if (codePatterns.some((p) => p.test(text))) {
    return {
      key: 'bang-ai-coder',
      id: 'mistralai/mistral-large-2512',
      name: 'Bang AI 4.5 Coder',
      reason: 'Coding & Architecture — Routed to 4.5 Coder'
    };
  }

  const reasoningPatterns = [
    /\b(analyze|compare|contrast|why|psychology|audit|critique|evaluate|deep dive|retention curve|strategy breakdown)\b/i,
    /\b(explain why|pros and cons|difference between|in depth|step by step|prove|calculate)\b/i
  ];
  if (reasoning || reasoningPatterns.some((p) => p.test(text))) {
    return {
      key: 'bang-ai-thinking',
      id: 'mistralai/mistral-large-2512',
      name: 'Bang AI 4.5 Thinking',
      reason: 'Deep reasoning & logic — Routed to 4.5 Thinking'
    };
  }

  if (webSearch) {
    return {
      key: 'bang-ai-search',
      id: 'qwen/qwen3.8-max:free',
      name: 'Bang AI 4.5 Search',
      reason: 'Live web search active — Routed to 4.5 Search'
    };
  }

  const isShortQuick = text.length < 50 && !text.includes('script') && !text.includes('blueprint');
  if (isShortQuick) {
    return {
      key: 'bang-ai-flash',
      id: 'mistralai/mistral-large-2512',
      name: 'Bang AI 4.5 Flash',
      reason: 'Quick query — Routed to 4.5 Flash for instant speed'
    };
  }

  return {
    key: 'bang-ai-ultra',
    id: 'mistralai/mistral-large-2512',
    name: 'Bang AI 4.5 Ultra',
    reason: 'Frontier multimodal engine — Ultra Speed & Logic'
  };
}

export default async function handler(request, context) {
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const {
    modelKey = 'bang-ai-auto',
    message = '',
    messages = [],
    images = [],
    webSearch = false,
    reasoning = false
  } = body;

  // Determine model
  let selectedModel;
  let routingMeta;
  if (!modelKey || modelKey === 'bang-ai-auto') {
    routingMeta = autoRouteModel({ message, images, webSearch, reasoning });
    selectedModel = routingMeta.id;
  } else {
    const config = BANG_AI_MODELS[modelKey] || BANG_AI_MODELS['bang-ai-ultra'];
    selectedModel = config.id;
    routingMeta = {
      isAuto: false,
      key: modelKey,
      name: config.name,
      reason: `Manual selection: ${config.name}`
    };
  }

  const systemPrompt = `You are Bang AI — the world's most advanced, production-grade creative co-producer, viral strategist, and AI systems architect built into Bang AI Studio.
Always introduce yourself only as "Bang AI". Never mention third-party AI models or backend providers.
Provide comprehensive, production-ready, beautifully structured responses with detailed code blocks, tables, and actionable frameworks when requested.`;

  const conversationHistory = [];
  if (Array.isArray(messages) && messages.length > 0) {
    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        conversationHistory.push({
          role: msg.role,
          content: Array.isArray(msg.content) ? msg.content : (msg.content || '')
        });
      }
    }
  }

  // Format active user content if images are present
  const incomingImages = Array.isArray(images) ? images : [];
  if (incomingImages.length > 0) {
    const visionUserContent = [
      { type: 'text', text: message || 'Analyze this image in detail and describe what it contains.' },
      ...incomingImages.map(img => ({
        type: 'image_url',
        image_url: { url: typeof img === 'string' ? img : img.url || img.data }
      }))
    ];
    if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user') {
      conversationHistory[conversationHistory.length - 1].content = visionUserContent;
    } else {
      conversationHistory.push({ role: 'user', content: visionUserContent });
    }
  } else if (conversationHistory.length === 0 && message) {
    conversationHistory.push({ role: 'user', content: message });
  }

  const payload = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ],
    stream: true,
    max_tokens: 4096
  };

  if (webSearch) {
    payload.web_search = { enable: true, count: 5 };
  }

  if (reasoning) {
    payload.reasoning_effort = 'high';
    payload.thinking = { type: 'enabled', budget_tokens: 4096 };
  }

  // Attempt upstream streaming call across available keys
  let upstreamResponse = null;
  let lastError = null;

  for (let i = 0; i < XKIRO_KEYS.length; i++) {
    const apiKey = XKIRO_KEYS[i];
    try {
      const res = await fetch(`${XKIRO_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        upstreamResponse = res;
        break;
      } else {
        const errText = await res.text().catch(() => '');
        lastError = new Error(`HTTP ${res.status}: ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!upstreamResponse) {
    // Fallback to high-availability model if primary model failed
    try {
      payload.model = 'mistralai/mistral-large-2512';
      const fallbackRes = await fetch(`${XKIRO_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XKIRO_KEYS[0]}`
        },
        body: JSON.stringify(payload)
      });
      if (fallbackRes.ok) {
        upstreamResponse = fallbackRes;
      }
    } catch (fbErr) {
      lastError = fbErr;
    }
  }

  if (!upstreamResponse) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${lastError ? lastError.message : 'Unknown error'}` }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  // Stream raw SSE directly to browser with routing headers
  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'x-bangai-routing',
      'x-bangai-routing': encodeURIComponent(JSON.stringify(routingMeta))
    }
  });
}
