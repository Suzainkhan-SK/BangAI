// Netlify Function: list-voices
// GET /.netlify/functions/list-voices
// Fetches available ElevenLabs voices with preview URLs

import { withElevenLabsRetry } from './api-keys.js';

// In-memory cache (survives across warm lambda invocations)
let voiceCache = null;
let voiceCacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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

  try {
    // Return cached voices if fresh
    if (voiceCache && (Date.now() - voiceCacheTimestamp) < CACHE_TTL_MS) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ voices: voiceCache, cached: true })
      };
    }

    // Fetch from ElevenLabs API with key rotation
    const voices = await withElevenLabsRetry(async (apiKey) => {
      const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: { 'xi-api-key': apiKey }
      });

      if (!res.ok) {
        throw new Error(`ElevenLabs GET /v1/voices returned HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.voices || [];
    });

    // Sanitize and format voice data for frontend consumption
    const formattedVoices = voices.map(v => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category || 'premade',
      preview_url: v.preview_url || null,
      labels: v.labels || {},
      gender: v.labels?.gender || 'unknown',
      accent: v.labels?.accent || 'unknown',
      age: v.labels?.age || 'unknown',
      description: v.labels?.description || '',
      use_case: v.labels?.use_case || ''
    }));

    // Update cache
    voiceCache = formattedVoices;
    voiceCacheTimestamp = Date.now();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ voices: formattedVoices, cached: false })
    };

  } catch (err) {
    console.error('[list-voices] Error:', err.message);

    // Return fallback hardcoded voices if API fails
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        voices: FALLBACK_VOICES,
        cached: false,
        fallback: true,
        error: err.message
      })
    };
  }
};

// Fallback voices when ElevenLabs API is unavailable
const FALLBACK_VOICES = [
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade', gender: 'male', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/2dd3e72c-4b37-4115-82c4-4e21a9b4e6b0.mp3' },
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade', gender: 'female', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8312-aab3b3d8f50a.mp3' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade', gender: 'male', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/38d8f8f0-1122-4333-b323-0b87478d506a.mp3' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade', gender: 'female', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04b22c97-8f9e-4b0a-b2a5-4e53e3f4b5a2.mp3' },
  { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', category: 'premade', gender: 'male', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/66e83dc2-6543-4897-9283-e028ac5ae4aa.mp3' },
  { voice_id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', category: 'premade', gender: 'male', accent: 'british', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007571.mp3' },
  { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade', gender: 'female', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/508e12d0-a7f7-4d0e-9a06-98d1fca1b5c8.mp3' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade', gender: 'female', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/d8ecadea-9e48-4e9e-868a-2ec3e95d4e2f.mp3' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade', gender: 'male', accent: 'american', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/c6c80dcd-d44d-4e36-b9e3-dc2f5a4c2d96.mp3' },
  { voice_id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', category: 'premade', gender: 'female', accent: 'swedish', preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-7d7e-4828-8e55-a6ea9b9e6832.mp3' },
];
