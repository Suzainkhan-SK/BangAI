// Netlify Function: search-music
// GET /.netlify/functions/search-music?mood=epic&genre=cinematic
// Searches Jamendo API for royalty-free music + returns curated archive.org tracks

import { getJamendoClientId } from './api-keys.js';

// Curated archive.org tracks (always available, no API needed)
const CURATED_TRACKS = [
  {
    id: 'epic-orchestral',
    name: 'Epic Orchestral Battle',
    artist: 'Royalty Free Music',
    genre: 'Cinematic',
    mood: 'Epic & Heroic',
    tempo: '110 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/epic-cinematic-background-music/epic-orchestral-battle.mp3',
    previewUrl: 'https://archive.org/download/epic-cinematic-background-music/epic-orchestral-battle.mp3',
    color: '#8B5CF6',
    tags: ['mythology', 'warriors', 'battles', 'monuments']
  },
  {
    id: 'dark-mystery',
    name: 'Dark Mystery & Suspense',
    artist: 'Cinematic Shadows',
    genre: 'Horror & Thriller',
    mood: 'Tense & Paranormal',
    tempo: '90 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/dark-mystery-background-music/dark-mystery-suspense.mp3',
    previewUrl: 'https://archive.org/download/dark-mystery-background-music/dark-mystery-suspense.mp3',
    color: '#06B6D4',
    tags: ['bermuda-triangle', 'aliens', 'ghosts', 'unsolved']
  },
  {
    id: 'emotional-piano',
    name: 'Emotional Piano & Strings',
    artist: 'Acoustic Heartstrings',
    genre: 'Dramatic',
    mood: 'Nostalgic & Heartfelt',
    tempo: '75 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/emotional-piano-background-music/emotional-piano-strings.mp3',
    previewUrl: 'https://archive.org/download/emotional-piano-background-music/emotional-piano-strings.mp3',
    color: '#EC4899',
    tags: ['biographies', 'legends', 'patriots', 'tear-jerkers']
  },
  {
    id: 'cyberpunk-synth',
    name: 'Cyberpunk Synthwave',
    artist: 'Neon Nexus Audio',
    genre: 'Electronic',
    mood: 'Futuristic & Tech',
    tempo: '128 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/cyberpunk-synthwave-music/cyberpunk-synthwave.mp3',
    previewUrl: 'https://archive.org/download/cyberpunk-synthwave-music/cyberpunk-synthwave.mp3',
    color: '#10B981',
    tags: ['ai', 'space', 'robotics', 'quantum']
  },
  {
    id: 'upbeat-cartoon',
    name: 'Upbeat Cartoon Bounce',
    artist: 'Animation Sound Labs',
    genre: 'Comedy',
    mood: 'Joyful & Whimsical',
    tempo: '135 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/upbeat-cartoon-music/upbeat-cartoon-bounce.mp3',
    previewUrl: 'https://archive.org/download/upbeat-cartoon-music/upbeat-cartoon-bounce.mp3',
    color: '#F59E0B',
    tags: ['kids', 'comedy', 'meme', 'cute']
  },
  {
    id: 'ambient-chill',
    name: 'Ambient Lo-Fi Chill',
    artist: 'Lo-Fi Dreams',
    genre: 'Lo-Fi',
    mood: 'Calm & Relaxing',
    tempo: '85 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/ambient-lofi-background-music/ambient-lofi-chill.mp3',
    previewUrl: 'https://archive.org/download/ambient-lofi-background-music/ambient-lofi-chill.mp3',
    color: '#7C3AED',
    tags: ['study', 'focus', 'chill', 'aesthetic']
  },
  {
    id: 'action-trailer',
    name: 'Action Movie Trailer',
    artist: 'Blockbuster Sound',
    genre: 'Cinematic',
    mood: 'Intense & Powerful',
    tempo: '140 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/action-trailer-background-music/action-movie-trailer.mp3',
    previewUrl: 'https://archive.org/download/action-trailer-background-music/action-movie-trailer.mp3',
    color: '#EF4444',
    tags: ['action', 'thriller', 'chase', 'explosion']
  },
  {
    id: 'indian-classical',
    name: 'Indian Classical Fusion',
    artist: 'Desi Beats Studio',
    genre: 'World',
    mood: 'Cultural & Spiritual',
    tempo: '100 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/indian-classical-fusion-music/indian-classical-fusion.mp3',
    previewUrl: 'https://archive.org/download/indian-classical-fusion-music/indian-classical-fusion.mp3',
    color: '#F97316',
    tags: ['mythology', 'culture', 'india', 'spiritual']
  },
  {
    id: 'horror-dark',
    name: 'Horror Dark Atmosphere',
    artist: 'Nightmare Audio',
    genre: 'Horror',
    mood: 'Terrifying & Dark',
    tempo: '70 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/horror-dark-atmosphere-music/horror-dark-atmosphere.mp3',
    previewUrl: 'https://archive.org/download/horror-dark-atmosphere-music/horror-dark-atmosphere.mp3',
    color: '#374151',
    tags: ['horror', 'dark', 'creepy', 'paranormal']
  },
  {
    id: 'inspiring-corporate',
    name: 'Inspiring Corporate',
    artist: 'Business Beats',
    genre: 'Corporate',
    mood: 'Motivational & Uplifting',
    tempo: '120 BPM',
    duration: 75,
    source: 'archive',
    audioUrl: 'https://archive.org/download/inspiring-corporate-music/inspiring-corporate.mp3',
    previewUrl: 'https://archive.org/download/inspiring-corporate-music/inspiring-corporate.mp3',
    color: '#2563EB',
    tags: ['business', 'motivational', 'success', 'startup']
  }
];

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const params = event.queryStringParameters || {};
  const searchQuery = params.q || params.query || '';
  const mood = params.mood || '';
  const source = params.source || 'all'; // 'all', 'curated', 'jamendo'

  try {
    let tracks = [];

    // Always include curated archive.org tracks
    if (source === 'all' || source === 'curated') {
      let curated = [...CURATED_TRACKS];
      if (mood) {
        const moodLower = mood.toLowerCase();
        curated = curated.filter(t =>
          t.mood.toLowerCase().includes(moodLower) ||
          t.genre.toLowerCase().includes(moodLower) ||
          t.tags.some(tag => tag.includes(moodLower))
        );
      }
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        curated = curated.filter(t =>
          t.name.toLowerCase().includes(queryLower) ||
          t.artist.toLowerCase().includes(queryLower) ||
          t.genre.toLowerCase().includes(queryLower) ||
          t.tags.some(tag => tag.includes(queryLower))
        );
      }
      tracks = tracks.concat(curated);
    }

    // Search Jamendo API if client_id is configured
    if ((source === 'all' || source === 'jamendo') && getJamendoClientId()) {
      try {
        const jamendoTracks = await searchJamendo(searchQuery || mood || 'cinematic', mood);
        tracks = tracks.concat(jamendoTracks);
      } catch (jamErr) {
        console.warn('[search-music] Jamendo API error:', jamErr.message);
        // Continue with curated tracks only
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tracks,
        total: tracks.length
      })
    };

  } catch (err) {
    console.error('[search-music] Error:', err.message);
    // Always return curated tracks as fallback
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tracks: CURATED_TRACKS,
        total: CURATED_TRACKS.length,
        fallback: true
      })
    };
  }
};

/**
 * Search Jamendo API for royalty-free tracks
 */
async function searchJamendo(query, mood) {
  const clientId = getJamendoClientId();
  if (!clientId) return [];

  const tags = mood || query || 'background';
  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=10&tags=${encodeURIComponent(tags)}&include=musicinfo&order=popularity_total`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jamendo API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const results = data.results || [];

  return results.map((track, idx) => ({
    id: `jamendo-${track.id}`,
    name: track.name || `Track ${idx + 1}`,
    artist: track.artist_name || 'Unknown Artist',
    genre: track.musicinfo?.tags?.genres?.[0] || 'Unknown',
    mood: track.musicinfo?.tags?.vartags?.[0] || 'Unknown',
    tempo: track.musicinfo?.speed || 'Unknown BPM',
    duration: track.duration || 0,
    source: 'jamendo',
    audioUrl: track.audio || '',
    previewUrl: track.audiodownload || track.audio || '',
    color: '#3B82F6',
    tags: track.musicinfo?.tags?.genres || [],
    license: track.license_ccurl || ''
  }));
}
