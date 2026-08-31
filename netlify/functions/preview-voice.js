// Netlify Function: preview-voice
// POST /.netlify/functions/preview-voice
// GET  /.netlify/functions/preview-voice?project={id}
// Dedicated dual-provider voice synthesizer:
// 1. ElevenLabs Native Voices -> Directly uses ElevenLabs API with ElevenLabs API Keys
// 2. JSON2Video Premium Voices -> Directly uses JSON2Video Voice Engine with JSON2Video API Keys

import { withElevenLabsRetry, withJson2VideoRetry, getJson2VideoKey } from './api-keys.js';
import { getDb } from './db.js';

// Native ElevenLabs Pre-Made Voice IDs supported directly on ElevenLabs keys
const NATIVE_ELEVENLABS_VOICE_IDS = new Set([
  'pNInz6obpgDQGcFmaJgB', // Adam
  'FGY2WhTYpPnrIDTdsKH5', // Laura
  'TX3LPaxmHKxFdv7VOQHJ', // Liam
  'cgSgspJ2msm6clMCkdW9', // Jessica
  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'VR6AewLTigWG4xSOukaG', // Drew
  'EXAVITQu4vr4xnSDxMaL', // Sarah
  'CwhRBWXzGAHq8TQ4Fs17', // Roger
  'ErXwobaYiN019PkySvjV', // Antoni
  'N2lVS1w4EtoT3dr4eOWO', // Callum
  'XB0fDUnXU5powFXDhCwa', // Charlotte
  'IKne3meq5aSn9XLyUdCD', // Charlie
  'ZQe5CZNOzWyzPSCn5a3c', // James
  'bVMeCyTHy58xNoL34h3p', // Jeremy
  'iP95p4xoKVk53GoZ742B', // Chris
  'g5CIjZEefAph4nJUjvjv', // River
  'nPczCjzI2devNBz1zQrb', // Brian
  'onwK4e9ZLuTAKqWW03F9', // Daniel
  'Xb7hH8MSUJpSbSDYk0k2', // Alice
  'JBFqnCBsd6RMkjVDRZzb', // George
  'pqHfZKP75CvOlQylNhV4', // Bill
  'jsCqWAovK2LkecY7zXl4', // Freya
  'z9fAnlkpzviPz146aGWm'  // Glinda
]);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // ─── 1. GET: POLL JSON2VIDEO TTS PROJECT STATUS ──────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const projectId = event.queryStringParameters?.project;
      if (!projectId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'project parameter is required' })
        };
      }

      let apiKey = null;
      try {
        const db = await getDb();
        const doc = await db.collection('previews').findOne({ project: projectId });
        if (doc && doc.apiKey) apiKey = doc.apiKey;
      } catch (e) {}

      if (!apiKey) apiKey = getJson2VideoKey(0);

      const statusRes = await fetch(`https://api.json2video.com/v2/movies?project=${encodeURIComponent(projectId)}`, {
        headers: { 'x-api-key': apiKey }
      });
      const statusData = await statusRes.json();

      if (statusData.movie?.status === 'done' && statusData.movie?.url) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: 'done',
            audioUrl: statusData.movie.url,
            duration: statusData.movie.duration,
            project: projectId
          })
        };
      }

      if (statusData.movie?.status === 'error') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'error',
            error: statusData.movie?.error || 'JSON2Video voice rendering failed'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'rendering',
          project: projectId
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // ─── 2. POST: SYNTHESIZE AUDIO ──────────────────────────────────────
  try {
    const { voiceId, text, speed, provider } = JSON.parse(event.body || '{}');

    if (!voiceId || !text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'voiceId and text are required' })
      };
    }

    const trimmedText = String(text).trim().substring(0, 500);
    const parsedSpeed = Number(speed);
    const safeSpeed = isFinite(parsedSpeed) && parsedSpeed > 0 ? parsedSpeed : 1.30;
    const voiceSpeed = Math.min(Math.max(Number(safeSpeed.toFixed(2)), 1.10), 1.50);

    // Determine target provider
    const isNativeElevenLabs = provider === 'elevenlabs' || (provider !== 'json2video' && NATIVE_ELEVENLABS_VOICE_IDS.has(voiceId));

    // ─── 1. ELEVENLABS NATIVE ENGINE (Uses ElevenLabs API Keys) ───────────
    if (isNativeElevenLabs) {
      try {
        const elevenLabsAudio = await withElevenLabsRetry(async (apiKey) => {
          const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
              text: trimmedText,
              model_id: 'eleven_flash_v2_5',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
              }
            })
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`ElevenLabs HTTP ${res.status}: ${errText}`);
          }

          const arrayBuffer = await res.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          return btoa(binary);
        }, 2);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            provider: 'elevenlabs',
            audio: elevenLabsAudio,
            mimeType: 'audio/mpeg',
            voiceId,
            textLength: trimmedText.length
          })
        };
      } catch (elevenLabsErr) {
        console.warn(`[preview-voice] ElevenLabs direct call failed: ${elevenLabsErr.message}. Falling back to JSON2Video keys...`);
      }
    }

    // ─── 2. JSON2VIDEO PREMIUM ENGINE (Uses JSON2Video API Keys) ─────────
    try {
      const json2VideoResult = await withJson2VideoRetry(async (apiKey) => {
        const createRes = await fetch('https://api.json2video.com/v2/movies', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resolution: 'preview',
            quality: 'low',
            scenes: [
              {
                elements: [
                  {
                    type: 'voice',
                    voice: voiceId,
                    model: 'elevenlabs',
                    text: trimmedText,
                    speed: voiceSpeed
                  }
                ]
              }
            ]
          })
        });

        const createData = await createRes.json();
        if (!createData.success || !createData.project) {
          throw new Error(createData.message || createData.error || 'Failed to submit voice render job to JSON2Video');
        }

        const projectId = createData.project;

        // Store mapping server-side
        try {
          const db = await getDb();
          await db.collection('previews').updateOne(
            { project: projectId },
            { $set: { project: projectId, apiKey, createdAt: new Date() } },
            { upsert: true }
          );
        } catch (e) {}

        const start = Date.now();
        let movieUrl = null;

        // Server-side short poll: max 7 seconds (zero timeout risk)
        while (Date.now() - start < 7000) {
          await new Promise(r => setTimeout(r, 1200));
          const statusRes = await fetch(`https://api.json2video.com/v2/movies?project=${projectId}`, {
            headers: { 'x-api-key': apiKey }
          });
          const statusData = await statusRes.json();

          if (statusData.movie?.status === 'done' && statusData.movie?.url) {
            movieUrl = statusData.movie.url;
            break;
          }
          if (statusData.movie?.status === 'error') {
            throw new Error(`JSON2Video rendering failed: ${statusData.movie?.error || 'Unknown error'}`);
          }
        }

        if (!movieUrl) {
          // If not finished in 7s, return project for client polling
          return {
            status: 'rendering',
            project: projectId
          };
        }

        // Fetch rendered media to encode base64
        const mediaRes = await fetch(movieUrl);
        const arrayBuffer = await mediaRes.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Media = btoa(binary);

        return {
          status: 'done',
          audio: base64Media,
          audioUrl: movieUrl,
          mimeType: 'video/mp4'
        };
      }, 3);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          provider: 'json2video',
          status: json2VideoResult.status,
          project: json2VideoResult.project,
          audio: json2VideoResult.audio,
          audioUrl: json2VideoResult.audioUrl,
          mimeType: json2VideoResult.mimeType || 'video/mp4',
          voiceId,
          textLength: trimmedText.length
        })
      };

    } catch (j2vErr) {
      console.error('[preview-voice] JSON2Video generation failed:', j2vErr.message);
      throw new Error(`TTS synthesis failed: ${j2vErr.message}`);
    }

  } catch (err) {
    console.error('[preview-voice] Fatal Error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message || 'Failed to generate voice preview'
      })
    };
  }
};
