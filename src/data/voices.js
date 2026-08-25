import JSON2VIDEO_RAW_VOICES from './json2videoVoices.json';

// Complete Voice Catalog — 23 ElevenLabs Native Voices + 9,650 JSON2Video Premium ElevenLabs Voices

export const VOICE_PROVIDERS = [
  { id: 'all',        label: 'All Providers',            icon: '🌐', count: 9673 },
  { id: 'elevenlabs', label: '⚡ ElevenLabs Native',      icon: '⚡', count: 23 },
  { id: 'json2video', label: '💎 JSON2Video Premium',     icon: '💎', count: 9650 },
];

export const VOICE_CATEGORIES = [
  { id: 'all',            label: 'All Voices',      icon: '🎙️' },
  { id: 'viral',          label: 'Viral Shorts',    icon: '🔥' },
  { id: 'storytelling',   label: 'Storytelling',    icon: '📖' },
  { id: 'conversational', label: 'Conversational',  icon: '💬' },
  { id: 'educational',    label: 'Educational',     icon: '📚' },
  { id: 'entertainment',  label: 'Entertainment',   icon: '📺' },
  { id: 'characters',     label: 'Characters',      icon: '🎭' },
];

export const VOICE_LANGUAGES = [
  { id: 'all',        label: 'All Languages', flag: '🌍', count: 9673 },
  { id: 'English',    label: 'English',       flag: '🇺🇸', count: 5070 },
  { id: 'Hindi',      label: 'Hindi',         flag: '🇮🇳', count: 587 },
  { id: 'Spanish',    label: 'Spanish',       flag: '🇪🇸', count: 828 },
  { id: 'German',     label: 'German',        flag: '🇩🇪', count: 523 },
  { id: 'Turkish',    label: 'Turkish',       flag: '🇹🇷', count: 529 },
  { id: 'French',     label: 'French',        flag: '🇫🇷', count: 311 },
  { id: 'Portuguese', label: 'Portuguese',    flag: '🇧🇷', count: 240 },
  { id: 'Russian',    label: 'Russian',       flag: '🇷🇺', count: 158 },
  { id: 'Polish',     label: 'Polish',        flag: '🇵🇱', count: 154 },
  { id: 'Japanese',   label: 'Japanese',      flag: '🇯🇵', count: 136 },
  { id: 'Italian',    label: 'Italian',       flag: '🇮🇹', count: 127 },
  { id: 'Vietnamese', label: 'Vietnamese',    flag: '🇻🇳', count: 122 },
  { id: 'Filipino',   label: 'Filipino',      flag: '🇵🇭', count: 119 },
  { id: 'Indonesian', label: 'Indonesian',    flag: '🇮🇩', count: 116 },
  { id: 'Korean',     label: 'Korean',        flag: '🇰🇷', count: 112 },
  { id: 'Arabic',     label: 'Arabic',        flag: '🇸🇦', count: 89 },
  { id: 'Dutch',      label: 'Dutch',         flag: '🇳🇱', count: 79 },
  { id: 'Chinese',    label: 'Chinese',       flag: '🇨🇳', count: 61 },
  { id: 'Tamil',      label: 'Tamil',         flag: '🇮🇳', count: 47 },
  { id: 'Romanian',   label: 'Romanian',      flag: '🇷🇴', count: 44 },
  { id: 'Ukrainian',  label: 'Ukrainian',     flag: '🇺🇦', count: 41 },
  { id: 'Czech',      label: 'Czech',         flag: '🇨🇿', count: 38 },
  { id: 'Swedish',    label: 'Swedish',       flag: '🇸🇪', count: 25 },
  { id: 'Malay',      label: 'Malay',         flag: '🇲🇾', count: 20 },
  { id: 'Croatian',   label: 'Croatian',      flag: '🇭🇷', count: 19 },
  { id: 'Greek',      label: 'Greek',         flag: '🇬🇷', count: 16 },
  { id: 'Finnish',    label: 'Finnish',       flag: '🇫🇮', count: 16 },
  { id: 'Hungarian',  label: 'Hungarian',     flag: '🇭🇺', count: 15 },
  { id: 'Slovak',     label: 'Slovak',        flag: '🇸🇰', count: 14 },
  { id: 'Danish',     label: 'Danish',        flag: '🇩🇰', count: 13 },
  { id: 'Bulgarian',  label: 'Bulgarian',     flag: '🇧🇬', count: 6 }
];

export const VOICE_ACCENTS = [
  { id: 'all',        label: 'All Accents',  flag: '🌍' },
  { id: 'american',   label: 'American',     flag: '🇺🇸' },
  { id: 'british',    label: 'British',      flag: '🇬🇧' },
  { id: 'indian',     label: 'Indian / Hindi', flag: '🇮🇳' },
  { id: 'australian', label: 'Australian',   flag: '🇦🇺' },
  { id: 'german',     label: 'German',       flag: '🇩🇪' },
  { id: 'spanish',    label: 'Spanish',      flag: '🇪🇸' },
  { id: 'french',     label: 'French',       flag: '🇫🇷' },
  { id: 'italian',    label: 'Italian',      flag: '🇮🇹' },
  { id: 'japanese',   label: 'Japanese',     flag: '🇯🇵' },
  { id: 'korean',     label: 'Korean',       flag: '🇰🇷' },
  { id: 'arabic',     label: 'Arabic',       flag: '🇸🇦' },
  { id: 'turkish',    label: 'Turkish',      flag: '🇹🇷' },
  { id: 'swedish',    label: 'Swedish',      flag: '🇸🇪' },
];

export const JSON2VIDEO_VOICES = JSON2VIDEO_RAW_VOICES;

export const VOICES = [
  // ─── 🔥 VIRAL SHORTS ─────────────────────────────────────────────
  {
    id: 'adam',
    name: 'Adam',
    elevenLabsId: 'pNInz6obpgDQGcFmaJgB',
    badge: '🔥 Trending',
    tag: 'Dominant & Firm',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'viral',
    tone: 'Dark, commanding, gravitas, intense',
    sampleText: 'Deep in the Bermuda Triangle, five planes vanished into thin air without a single trace.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/2dd3e72c-4b37-4115-82c4-4e21a9b4e6b0.mp3',
    stability: 0.75,
    clarity: 0.85,
    bestFor: ['Mystery', 'Horror', 'Space', 'War Stories', 'Social Media'],
    color: '#6366F1'
  },
  {
    id: 'laura',
    name: 'Laura',
    elevenLabsId: 'FGY2WhTYpPnrIDTdsKH5',
    badge: '🔥 Viral',
    tag: 'Enthusiast & Quirky',
    gender: 'Female',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Young',
    category: 'viral',
    tone: 'Bright, energetic, quirky, enthusiastic',
    sampleText: 'You won\'t believe what scientists just discovered hiding under Antarctica\'s ice sheets!',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/FGY2WhTYpPnrIDTdsKH5/67341759-ad0b-45ef-8fd3-4e2f1ad513f8.mp3',
    stability: 0.65,
    clarity: 0.82,
    bestFor: ['Trending Facts', 'Social Media', 'Explainers', 'Pop Culture'],
    color: '#F43F5E'
  },
  {
    id: 'liam',
    name: 'Liam',
    elevenLabsId: 'TX3LPaxmHKxFdv7VOQHJ',
    badge: '🔥 Creator',
    tag: 'Energetic Creator',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Young',
    category: 'viral',
    tone: 'Fast, energetic, confident, creator-optimized',
    sampleText: 'Three things you need to know about AI that nobody is talking about right now.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148f96-95c2-4d72-a9c9-2acff3620211.mp3',
    stability: 0.7,
    clarity: 0.85,
    bestFor: ['Tech', 'AI', 'Startups', 'Social Media', 'Listicles'],
    color: '#10B981'
  },
  {
    id: 'brian',
    name: 'Brian',
    elevenLabsId: 'nPczCjzI2devNBz1zQrb',
    badge: '🔥 Deep',
    tag: 'Deep & Comforting',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'viral',
    tone: 'Deep, warm, smooth, trustworthy',
    sampleText: 'The last thing he saw before waking up in the hospital was a blinding white light.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/nPczCjzI2devNBz1zQrb/8b350437-7df9-4e72-9cc0-448e6a62b742.mp3',
    stability: 0.78,
    clarity: 0.88,
    bestFor: ['Dark Stories', 'True Crime', 'Viral Shorts', 'Narration'],
    color: '#1E40AF'
  },

  // ─── 📖 STORYTELLING ──────────────────────────────────────────────
  {
    id: 'george',
    name: 'George',
    elevenLabsId: 'JBFqnCBsd6RMkjVDRZzb',
    badge: '📖 Classic',
    tag: 'Warm Storyteller',
    gender: 'Male',
    accent: 'british',
    flag: '🇬🇧 British',
    age: 'Middle-Aged',
    category: 'storytelling',
    tone: 'Warm, authoritative, narrative, profound',
    sampleText: 'Two thousand years ago, two different civilizations clashed in an epic war of elements.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/JBFqnCBsd6RMkjVDRZzb/e6206d1a-0721-4787-aafb-06a6e705cac5.mp3',
    stability: 0.85,
    clarity: 0.92,
    bestFor: ['Ancient History', 'Mythology', 'Documentaries', 'Nature'],
    color: '#8B5CF6'
  },
  {
    id: 'daniel',
    name: 'Daniel',
    elevenLabsId: 'onwK4e9ZLuTAKqWW03F9',
    badge: '📖 Broadcaster',
    tag: 'Steady Broadcaster',
    gender: 'Male',
    accent: 'british',
    flag: '🇬🇧 British',
    age: 'Middle-Aged',
    category: 'storytelling',
    tone: 'Authoritative, calm, measured, professional',
    sampleText: 'On October 9th, 2024, Ratan Tata woke up not knowing it would be his final day on Earth.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007571.mp3',
    stability: 0.8,
    clarity: 0.9,
    bestFor: ['Biographies', 'History', 'News', 'Documentaries'],
    color: '#3B82F6'
  },
  {
    id: 'lily',
    name: 'Lily',
    elevenLabsId: 'pFZP5JQG7iQjIQuC4Bku',
    badge: '📖 Actress',
    tag: 'Velvety Actress',
    gender: 'Female',
    accent: 'british',
    flag: '🇬🇧 British',
    age: 'Middle-Aged',
    category: 'storytelling',
    tone: 'Velvety, dramatic, expressive, theatrical',
    sampleText: 'In a tiny village in England, an old woman discovered something that shook the entire world.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/d10f7534-11f9-41b0-b7a0-1edc34a34a20.mp3',
    stability: 0.78,
    clarity: 0.88,
    bestFor: ['Fantasy', 'Fairy Tales', 'Drama', 'Audiobooks'],
    color: '#A855F7'
  },

  // ─── 💬 CONVERSATIONAL ────────────────────────────────────────────
  {
    id: 'roger',
    name: 'Roger',
    elevenLabsId: 'CwhRBWXzGAHq8TQ4Fs17',
    badge: '💬 Casual',
    tag: 'Laid-Back & Casual',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'conversational',
    tone: 'Relaxed, conversational, natural, easy-going',
    sampleText: 'So here\'s the thing about productivity that most people get completely wrong.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/e99c6b41-df21-4e6f-b182-4b79fdd1a13d.mp3',
    stability: 0.75,
    clarity: 0.85,
    bestFor: ['Podcasts', 'Vlogs', 'Commentary', 'Casual'],
    color: '#0EA5E9'
  },
  {
    id: 'charlie',
    name: 'Charlie',
    elevenLabsId: 'IKne3meq5aSn9XLyUdCD',
    badge: '💬 Aussie',
    tag: 'Deep & Confident',
    gender: 'Male',
    accent: 'australian',
    flag: '🇦🇺 Australian',
    age: 'Young',
    category: 'conversational',
    tone: 'Deep, confident, smooth, charming',
    sampleText: 'Hey! Look at me, I am a talking pineapple and today I am escaping the supermarket!',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3',
    stability: 0.7,
    clarity: 0.85,
    bestFor: ['Comedy', 'Adventure', 'Casual', 'Travel'],
    color: '#F59E0B'
  },
  {
    id: 'river',
    name: 'River',
    elevenLabsId: 'SAz9YHcvj6GT2YYXdXww',
    badge: '💬 Neutral',
    tag: 'Relaxed & Neutral',
    gender: 'Non-Binary',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'conversational',
    tone: 'Balanced, calming, neutral, clear',
    sampleText: 'Here are five things about the universe that will completely change your perspective on life.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/SAz9YHcvj6GT2YYXdXww/fa98e3c3-2a58-4e2e-a794-354a2c4c26a7.mp3',
    stability: 0.8,
    clarity: 0.9,
    bestFor: ['Wellness', 'Meditation', 'Explainers', 'ASMR'],
    color: '#14B8A6'
  },
  {
    id: 'will',
    name: 'Will',
    elevenLabsId: 'bIHbv24MWmeRgasZH58o',
    badge: '💬 Optimist',
    tag: 'Relaxed Optimist',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Young',
    category: 'conversational',
    tone: 'Relaxed, warm, optimistic, friendly',
    sampleText: 'If you do these three things every morning, your productivity will skyrocket. Trust me.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f5f-5e6f-4c2b-b25d-5765bac1e693.mp3',
    stability: 0.72,
    clarity: 0.85,
    bestFor: ['Motivation', 'Self-Help', 'Lifestyle', 'Vlogs'],
    color: '#22C55E'
  },
  {
    id: 'jessica',
    name: 'Jessica',
    elevenLabsId: 'cgSgspJ2msm6clMCkdW9',
    badge: '💬 Bright',
    tag: 'Playful & Bright',
    gender: 'Female',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Young',
    category: 'conversational',
    tone: 'Playful, bright, bubbly, conversational',
    sampleText: 'Okay wait, you need to hear this story. It literally changed how I see everything.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3571d5c8e1e.mp3',
    stability: 0.68,
    clarity: 0.88,
    bestFor: ['Gen-Z', 'Pop Culture', 'Gossip', 'Social Media'],
    color: '#F472B6'
  },
  {
    id: 'eric',
    name: 'Eric',
    elevenLabsId: 'cjVigY5qzO86Huf0OWal',
    badge: '💬 Smooth',
    tag: 'Smooth & Trustworthy',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'conversational',
    tone: 'Smooth, calm, trustworthy, professional',
    sampleText: 'The numbers don\'t lie. This company went from zero to a billion in eighteen months.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/4a6e0431-f4e5-4d27-a1f5-4c0b82be2a12.mp3',
    stability: 0.82,
    clarity: 0.9,
    bestFor: ['Business', 'Finance', 'Corporate', 'Explainers'],
    color: '#0EA5E9'
  },
  {
    id: 'chris',
    name: 'Chris',
    elevenLabsId: 'iP95p4xoKVk53GoZ742B',
    badge: '💬 Charming',
    tag: 'Charming & Charismatic',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'conversational',
    tone: 'Charming, smooth, charismatic, engaging',
    sampleText: 'Let me tell you about the most fascinating experiment in psychology you\'ve never heard of.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/22e5eb47-4178-4e31-adbe-0ebc05df3f18.mp3',
    stability: 0.75,
    clarity: 0.87,
    bestFor: ['Podcasts', 'Interviews', 'Commentary', 'Culture'],
    color: '#6366F1'
  },

  // ─── 📚 EDUCATIONAL ───────────────────────────────────────────────
  {
    id: 'alice',
    name: 'Alice',
    elevenLabsId: 'Xb7hH8MSUJpSbSDYk0k2',
    badge: '📚 Educator',
    tag: 'Clear Educator',
    gender: 'Female',
    accent: 'british',
    flag: '🇬🇧 British',
    age: 'Middle-Aged',
    category: 'educational',
    tone: 'Clear, confident, educational, precise',
    sampleText: 'The quantum realm operates by rules that seem to defy everything we know about reality.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/bd6b5e30-1ed5-429a-9dde-7af33e2d8901.mp3',
    stability: 0.82,
    clarity: 0.95,
    bestFor: ['Science', 'Educational', 'Technology', 'Explainers'],
    color: '#2563EB'
  },
  {
    id: 'matilda',
    name: 'Matilda',
    elevenLabsId: 'XrExE9yKIg1WjnnlVkGX',
    badge: '📚 Professional',
    tag: 'Warm Professional',
    gender: 'Female',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'educational',
    tone: 'Warm, professional, measured, knowledgeable',
    sampleText: 'Understanding compound interest is the single most important financial lesson of your life.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b3c25faa-ddde-4e88-a04e-0dcab7a0e687.mp3',
    stability: 0.8,
    clarity: 0.92,
    bestFor: ['Finance', 'Educational', 'Courses', 'Corporate'],
    color: '#7C3AED'
  },
  {
    id: 'bella',
    name: 'Bella',
    elevenLabsId: 'hpp4J3VqNfWAUOO0d1Us',
    badge: '📚 Bright',
    tag: 'Professional & Bright',
    gender: 'Female',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'educational',
    tone: 'Bright, professional, clear, confident',
    sampleText: 'Today we\'re breaking down the five psychological triggers that make content go viral.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/hpp4J3VqNfWAUOO0d1Us/47569d6d-12ee-4b86-8e55-1c1c8a12ba3a.mp3',
    stability: 0.78,
    clarity: 0.9,
    bestFor: ['Marketing', 'Courses', 'Presentations', 'How-To'],
    color: '#EC4899'
  },

  // ─── 📺 ENTERTAINMENT ─────────────────────────────────────────────
  {
    id: 'sarah',
    name: 'Sarah',
    elevenLabsId: 'EXAVITQu4vr4xnSDxMaL',
    badge: '📺 Star',
    tag: 'Mature & Reassuring',
    gender: 'Female',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Young',
    category: 'entertainment',
    tone: 'Mature, reassuring, warm, engaging',
    sampleText: 'Imagine giving away every single rupee you own and leaving only courage for your future.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04b22c97-8f9e-4b0a-b2a5-4e53e3f4b5a2.mp3',
    stability: 0.82,
    clarity: 0.95,
    bestFor: ['Emotional', 'Biographies', 'Culture', 'Entertainment TV'],
    color: '#F472B6'
  },
  {
    id: 'bill',
    name: 'Bill',
    elevenLabsId: 'pqHfZKP75CvOlQylNhV4',
    badge: '📺 Wise',
    tag: 'Wise & Mature',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Senior',
    category: 'entertainment',
    tone: 'Wise, gravelly, mature, authoritative',
    sampleText: 'After fifty years in this business, let me tell you the one truth nobody wants to admit.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/d8eb548e-f8ec-41fd-9f6e-1c3e8cbb9e39.mp3',
    stability: 0.85,
    clarity: 0.82,
    bestFor: ['Advertisements', 'Narration', 'Legacy Stories', 'Wisdom'],
    color: '#64748B'
  },

  // ─── 🎭 CHARACTERS ────────────────────────────────────────────────
  {
    id: 'callum',
    name: 'Callum',
    elevenLabsId: 'N2lVS1w4EtoT3dr4eOWO',
    badge: '🎭 Trickster',
    tag: 'Husky Trickster',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Middle-Aged',
    category: 'characters',
    tone: 'Husky, mischievous, character-driven, animated',
    sampleText: 'The potion was bubbling, the clock was ticking, and the wizard had exactly one chance.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-8c97-53ea5bf7fef8.mp3',
    stability: 0.65,
    clarity: 0.8,
    bestFor: ['Animation', 'Fantasy', 'Gaming', 'Characters'],
    color: '#F97316'
  },
  {
    id: 'harry',
    name: 'Harry',
    elevenLabsId: 'SOYHLrjzK2X1ezoPC6cr',
    badge: '🎭 Warrior',
    tag: 'Fierce Warrior',
    gender: 'Male',
    accent: 'american',
    flag: '🇺🇸 American',
    age: 'Young',
    category: 'characters',
    tone: 'Fierce, intense, aggressive, warrior-like',
    sampleText: 'The enemy fleet was approaching. We had exactly seventeen minutes to prepare for impact.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/SOYHLrjzK2X1ezoPC6cr/86c2e3cc-16b2-4a26-966a-67e6de3e7df0.mp3',
    stability: 0.7,
    clarity: 0.82,
    bestFor: ['War', 'Action', 'Military', 'Gaming'],
    color: '#DC2626'
  },

  // ─── 🇮🇳 CUSTOM INDIAN VOICES (Mapped to ElevenLabs voices) ──────
  {
    id: 'aarav',
    name: 'Aarav',
    elevenLabsId: 'TX3LPaxmHKxFdv7VOQHJ', // Maps to Liam (energetic young male)
    badge: '🇮🇳 Viral India',
    tag: 'Energetic Hinglish',
    gender: 'Male',
    accent: 'indian',
    flag: '🇮🇳 Indian',
    age: 'Young',
    category: 'viral',
    tone: 'Fast-paced, engaging, curious, modern',
    sampleText: 'Kya aapko pata hai ki duniya ka sabse bada mystery island asal mein gayab ho chuka hai?',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148f96-95c2-4d72-a9c9-2acff3620211.mp3',
    stability: 0.7,
    clarity: 0.85,
    bestFor: ['Trending Facts', 'Hinglish Shorts', 'Tech & AI', 'Money'],
    color: '#10B981'
  },
  {
    id: 'priya',
    name: 'Priya',
    elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', // Maps to Sarah (warm, expressive female)
    badge: '🇮🇳 Modern',
    tag: 'Modern Indian',
    gender: 'Female',
    accent: 'indian',
    flag: '🇮🇳 Indian',
    age: 'Young',
    category: 'entertainment',
    tone: 'Expressive, clear, friendly, articulate',
    sampleText: 'Imagine giving away every single rupee you own and leaving only courage for your future.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04b22c97-8f9e-4b0a-b2a5-4e53e3f4b5a2.mp3',
    stability: 0.82,
    clarity: 0.95,
    bestFor: ['Emotional', 'Educational', 'Mythology', 'Culture'],
    color: '#F472B6',
    source: 'elevenlabs',
    language: 'Hindi'
  }
];

// Helper to get all voices across providers
export function getAllVoices() {
  const nativeWithMeta = VOICES.map(v => ({
    ...v,
    source: 'elevenlabs',
    language: v.language || (v.accent === 'indian' ? 'Hindi' : 'English')
  }));
  return [...nativeWithMeta, ...JSON2VIDEO_VOICES];
}

// Fast Map for instant ID lookup
const VOICE_LOOKUP_MAP = new Map();
VOICES.forEach(v => {
  VOICE_LOOKUP_MAP.set(v.id.toLowerCase(), v);
  if (v.elevenLabsId) VOICE_LOOKUP_MAP.set(v.elevenLabsId.toLowerCase(), v);
});
JSON2VIDEO_VOICES.forEach(v => {
  VOICE_LOOKUP_MAP.set(v.id.toLowerCase(), v);
  if (v.elevenLabsId) VOICE_LOOKUP_MAP.set(v.elevenLabsId.toLowerCase(), v);
});

export function getVoiceById(id) {
  if (!id) return VOICES[0];
  const query = String(id).trim().toLowerCase();
  return VOICE_LOOKUP_MAP.get(query) || VOICES[0];
}

export function filterVoices({
  provider = 'all',
  category = 'all',
  language = 'all',
  accent = 'all',
  gender = 'all',
  search = '',
  limit = 50,
  offset = 0
} = {}) {
  let list = [];
  if (provider === 'elevenlabs') {
    list = VOICES;
  } else if (provider === 'json2video') {
    list = JSON2VIDEO_VOICES;
  } else {
    list = getAllVoices();
  }

  const query = search.trim().toLowerCase();

  const filtered = list.filter(v => {
    if (category !== 'all' && v.category !== category) return false;
    if (gender !== 'all' && v.gender && v.gender.toLowerCase() !== gender.toLowerCase()) return false;
    if (language !== 'all') {
      const vLang = v.language || 'English';
      if (vLang.toLowerCase() !== language.toLowerCase()) return false;
    }
    if (accent !== 'all') {
      const vAcc = v.accent || '';
      if (!vAcc.toLowerCase().includes(accent.toLowerCase())) return false;
    }
    if (query) {
      const matchName = v.name && v.name.toLowerCase().includes(query);
      const matchId = v.id && v.id.toLowerCase().includes(query);
      const matchDesc = v.description && v.description.toLowerCase().includes(query);
      const matchTag = v.tag && v.tag.toLowerCase().includes(query);
      const matchLang = v.language && v.language.toLowerCase().includes(query);
      if (!matchName && !matchId && !matchDesc && !matchTag && !matchLang) return false;
    }
    return true;
  });

  return {
    total: filtered.length,
    voices: filtered.slice(offset, offset + limit),
    hasMore: offset + limit < filtered.length
  };
}

