// Netlify Function: preview-voice
// POST /.netlify/functions/preview-voice
// Generates real ElevenLabs TTS audio from text + voiceId

import { withElevenLabsRetry } from './api-keys.js';

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
    const { voiceId, text } = JSON.parse(event.body || '{}');

    if (!voiceId || !text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'voiceId and text are required' })
      };
    }

    // Limit text length to prevent credit abuse (max 500 chars)
    const trimmedText = text.substring(0, 500);

    // Call ElevenLabs TTS API with key rotation
    const audioBase64 = await withElevenLabsRetry(async (apiKey) => {
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
        throw new Error(`ElevenLabs TTS HTTP ${res.status}: ${errText}`);
      }

      // Convert audio response to base64
      const arrayBuffer = await res.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binary);
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        audio: audioBase64,
        mimeType: 'audio/mpeg',
        voiceId,
        textLength: trimmedText.length
      })
    };

  } catch (err) {
    console.error('[preview-voice] Error:', err.message);
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
