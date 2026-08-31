// Background Music Catalog — 100% Royalty-Free & Content ID Safe Tracks
// All tracks verified to have ZERO YouTube Content ID fingerprinting / HAAWK claims
// Self-hosted directly under /music/ for high availability and zero CDN 403 errors

export const MUSIC_MOODS = [
  { id: 'all',          label: 'All Tracks',    icon: '🎵' },
  { id: 'none',         label: 'Voiceover Only', icon: '🎙️' },
  { id: 'epic',         label: 'Epic & Heroic', icon: '⚔️' },
  { id: 'dark',         label: 'Dark & Tense',  icon: '🌑' },
  { id: 'emotional',    label: 'Emotional',     icon: '💔' },
  { id: 'upbeat',       label: 'Upbeat & Fun',  icon: '🎉' },
  { id: 'chill',        label: 'Chill & Ambient', icon: '🧘' },
  { id: 'professional', label: 'Corporate',     icon: '💼' },
];

export const MUSIC_TRACKS = [
  {
    id: 'none',
    name: 'No Background Music (Voiceover Only)',
    artist: 'Bang AI Clean Audio',
    genre: 'Pure Voiceover',
    tempo: 'Voice-Only',
    mood: 'none',
    moodLabel: 'Clean / Add Sound in YouTube Shorts',
    duration: '75s',
    source: 'native',
    audioUrl: '',
    previewUrl: '',
    color: '#6366F1',
    duckingDefault: 0,
    isCopyrightFree: true,
    tags: ['Zero Copyright Risk', 'Clean Narration', 'Add Trending Song on YouTube', 'Universal Safe']
  },
  {
    id: 'synth',
    name: 'Cyberpunk Synthwave Pulse',
    artist: 'Pixabay CC0 Music',
    genre: 'Electronic & Synth',
    tempo: '128 BPM',
    mood: 'epic',
    moodLabel: 'Futuristic & High-Energy',
    duration: '2:10',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/synth.mp3',
    previewUrl: 'https://bangai.netlify.app/music/synth.mp3',
    color: '#10B981',
    duckingDefault: 16,
    isCopyrightFree: true,
    tags: ['Quantum AI', 'Space', 'Robotics', 'Sci-Fi', 'High CTR']
  },
  {
    id: 'ambient',
    name: 'Lo-Fi Ambient Dreams',
    artist: 'Pixabay CC0 Music',
    genre: 'Lo-Fi & Ambient',
    tempo: '80 BPM',
    mood: 'chill',
    moodLabel: 'Dreamy & Peaceful',
    duration: '2:00',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/ambient.mp3',
    previewUrl: 'https://bangai.netlify.app/music/ambient.mp3',
    color: '#4F46E5',
    duckingDefault: 20,
    isCopyrightFree: true,
    tags: ['Ambient', 'Dreamy', 'Relaxing', 'Background', 'ASMR']
  },
  {
    id: 'mystery2',
    name: 'Deep Investigation Mystery',
    artist: 'Pixabay CC0 Music',
    genre: 'Mystery & Suspense',
    tempo: '88 BPM',
    mood: 'dark',
    moodLabel: 'Mysterious & Investigative',
    duration: '2:15',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/mystery2.mp3',
    previewUrl: 'https://bangai.netlify.app/music/mystery2.mp3',
    color: '#06B6D4',
    duckingDefault: 16,
    isCopyrightFree: true,
    tags: ['Mystery', 'Investigation', 'True Crime', 'Conspiracy', 'Bermuda']
  },
  {
    id: 'indian',
    name: 'Cultural & Emotional Strings',
    artist: 'Pixabay CC0 Music',
    genre: 'World & Cultural',
    tempo: '100 BPM',
    mood: 'emotional',
    moodLabel: 'Cultural & Spiritual',
    duration: '2:30',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/indian.mp3',
    previewUrl: 'https://bangai.netlify.app/music/indian.mp3',
    color: '#F97316',
    duckingDefault: 17,
    isCopyrightFree: true,
    tags: ['Mythology', 'Culture', 'India', 'Spiritual', 'Emotional']
  },
  {
    id: 'action',
    name: 'Tension Time Pulse',
    artist: 'Public Domain FreePD',
    genre: 'Action & Suspense',
    tempo: '130 BPM',
    mood: 'dark',
    moodLabel: 'Intense & Gripping',
    duration: '2:24',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/action.mp3',
    previewUrl: 'https://bangai.netlify.app/music/action.mp3',
    color: '#EF4444',
    duckingDefault: 16,
    isCopyrightFree: true,
    tags: ['Action', 'Thriller', 'Chase', 'Survival', 'War']
  },
  {
    id: 'piano',
    name: 'Heartfelt Piano Reflection',
    artist: 'Pixabay CC0 Music',
    genre: 'Emotional Piano',
    tempo: '78 BPM',
    mood: 'emotional',
    moodLabel: 'Profound & Heartfelt',
    duration: '2:45',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/piano.mp3',
    previewUrl: 'https://bangai.netlify.app/music/piano.mp3',
    color: '#EC4899',
    duckingDefault: 20,
    isCopyrightFree: true,
    tags: ['Biographies', 'Last 24 Hours', 'Legends', 'Tear-Jerkers']
  },
  {
    id: 'playful',
    name: 'Joyful Bright Beats',
    artist: 'Pixabay CC0 Music',
    genre: 'Upbeat & Fun',
    tempo: '130 BPM',
    mood: 'upbeat',
    moodLabel: 'Joyful & Energetic',
    duration: '1:45',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/playful.mp3',
    previewUrl: 'https://bangai.netlify.app/music/playful.mp3',
    color: '#F59E0B',
    duckingDefault: 14,
    isCopyrightFree: true,
    tags: ['Comedy', 'Fun', 'Meme Shorts', 'Happy', 'Facts']
  },
  {
    id: 'corporate',
    name: 'Inspiring Visionary Ambient',
    artist: 'Pixabay CC0 Music',
    genre: 'Corporate & Motivational',
    tempo: '120 BPM',
    mood: 'professional',
    moodLabel: 'Motivational & Uplifting',
    duration: '2:12',
    source: 'self-hosted',
    audioUrl: 'https://bangai.netlify.app/music/corporate.mp3',
    previewUrl: 'https://bangai.netlify.app/music/corporate.mp3',
    color: '#2563EB',
    duckingDefault: 18,
    isCopyrightFree: true,
    tags: ['Business', 'Motivational', 'Success', 'Startup', 'Tech']
  }
];

export const MUSIC_ID_ALIASES = {
  mystery: 'mystery2',
  dark: 'mystery2',
  suspense: 'mystery2',
  epic: 'synth',
  cinematic: 'synth',
  action2: 'action',
  tension: 'action',
  emotional: 'piano',
  sad: 'piano',
  upbeat: 'playful',
  fun: 'playful',
  comedy: 'playful',
  chill: 'ambient',
  lofi: 'ambient',
  professional: 'corporate',
  business: 'corporate',
  cultural: 'indian',
  silent: 'none',
  voiceover: 'none',
};

export const DEFAULT_MUSIC_ID = 'mystery2';

export const PLAYABLE_TRACK_COUNT = MUSIC_TRACKS.filter(t => t.audioUrl).length;
export const MUSIC_TRACK_COUNT = MUSIC_TRACKS.length;

export function resolveMusicId(trackId) {
  if (!trackId) return DEFAULT_MUSIC_ID;
  const raw = String(trackId).trim();
  if (MUSIC_TRACKS.some(t => t.id === raw)) return raw;
  const lower = raw.toLowerCase();
  if (MUSIC_ID_ALIASES[lower]) return MUSIC_ID_ALIASES[lower];
  const byName = MUSIC_TRACKS.find(t => t.name.toLowerCase().includes(lower));
  return byName ? byName.id : DEFAULT_MUSIC_ID;
}

export function getMusicTrackById(trackId) {
  const resolved = resolveMusicId(trackId);
  return MUSIC_TRACKS.find(t => t.id === resolved) || MUSIC_TRACKS[0];
}
