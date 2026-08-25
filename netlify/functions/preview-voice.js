// Netlify Function: preview-voice
// POST /.netlify/functions/preview-voice
// Generates ElevenLabs TTS audio with dual-engine support:
// 1. Direct ElevenLabs API (for native voices)
// 2. JSON2Video rendering engine fallback (for all 9,650 community library voices)

import { withElevenLabsRetry, withJson2VideoRetry } from './api-keys.js';

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
    const { voiceId, text, speed } = JSON.parse(event.body || '{}');

    if (!voiceId || !text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'voiceId and text are required' })
      };
    }

    // Limit text length to prevent credit abuse (max 500 chars)
    const trimmedText = String(text).trim().substring(0, 500);
    const voiceSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.7), 1.3);

    // ─── STRATEGY 1: Direct ElevenLabs TTS ─────────────────────────────
    let elevenLabsAudio = null;
    let elevenLabsError = null;

    try {
      elevenLabsAudio = await withElevenLabsRetry(async (apiKey) => {
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
      }, 1);

      if (elevenLabsAudio) {
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
      }
    } catch (err) {
      elevenLabsError = err.message;
      console.warn(`[preview-voice] ElevenLabs direct call failed (${err.message}). Falling back to JSON2Video engine...`);
    }

    // ─── STRATEGY 2: JSON2Video Voice Engine ───────────────────────────
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

        // Poll with 1.5s intervals for up to 35 seconds
        while (Date.now() - start < 35000) {
          await new Promise(r => setTimeout(r, 1600));
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
      console.error('[preview-voice] JSON2Video fallback failed:', j2vErr.message);
      throw new Error(`TTS synthesis failed: ${j2vErr.message} (ElevenLabs error: ${elevenLabsError})`);
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
