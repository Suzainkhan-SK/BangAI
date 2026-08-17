// Utility: detectIntent.js
// Smart intent classifier for conversational AI video studio

export function detectMode(text) {
  if (!text || typeof text !== 'string') return 'VIDEO_GENERATION';
  const lower = text.trim().toLowerCase();

  // 1. Story Refinement (Creator wants to modify or improve active story)
  const refinePatterns = [
    /\b(improve|refine|better|more|longer|shorter|change|edit|update|rewrite|rephrase|tweak|modify|twist)\b/,
    /\b(make it|add more|change the hook|darker|funnier|scarier|more emotional|more suspense)\b/,
    /\b(fix this|not good|regenerate story|try again with)\b/
  ];
  if (refinePatterns.some(pattern => pattern.test(lower))) {
    return 'REFINE_STORY';
  }

  // 2. Conversational Q&A / General Chat
  const chatPatterns = [
    /^(what|how|why|when|who|which|where|can you|tell me|explain|help me|give me|suggest|do you know)/i,
    /\b(tips|strategy|algorithm|retention|analytics|how to get views|viral trick|seo|monetization)\b/
  ];
  if (chatPatterns.some(pattern => pattern.test(lower))) {
    return 'CHAT';
  }

  // 3. Default: New Video Generation Topic
  return 'VIDEO_GENERATION';
}
