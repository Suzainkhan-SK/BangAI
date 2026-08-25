// Netlify Function: preview-voice
// POST /.netlify/functions/preview-voice
// Dedicated dual-provider voice synthesizer:
// 1. ElevenLabs Native Voices -> Directly uses ElevenLabs API with ElevenLabs API Keys
// 2. JSON2Video Premium Voices -> Directly uses JSON2Video Voice Engine with JSON2Video API Keys

import { withElevenLabsRetry, withJson2VideoRetry } from './api-keys.js';

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

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
    const voiceSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.7), 1.3);

    // Determine target provider:
    // If provider is explicitly specified, respect it.
    // Otherwise check if it's in the Native ElevenLabs IDs set.
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
        const start = Date.now();
        let movieUrl = null;

        // Poll with 1.4s intervals for up to 30 seconds
        while (Date.now() - start < 30000) {
          await new Promise(r => setTimeout(r, 1400));
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
          throw new Error('JSON2Video TTS rendering timed out');
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
