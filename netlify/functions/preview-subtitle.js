// Netlify Function: preview-subtitle
// POST /.netlify/functions/preview-subtitle
// Renders a real subtitle preview clip via json2video API

import { json2videoCreateMovie, json2videoPollUntilDone } from './api-keys.js';

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
    const { subtitleSettings, text, voiceId } = JSON.parse(event.body || '{}');

    if (!subtitleSettings) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'subtitleSettings is required' })
      };
    }

    const previewText = (text || 'This is how your subtitles will look in the final video. Pretty cool right?').substring(0, 200);

    // Build minimal json2video movie payload for subtitle preview
    const moviePayload = {
      resolution: 'custom',
      width: 1080,
      height: 1920,
      quality: 'low',
      cache: true,
      scenes: [
        {
          duration: 6,
          background: '#0a0a1a',
          elements: [
            {
              type: 'voice',
              model: 'elevenlabs-flash-v2-5',
              voice: voiceId || 'Adam',
              text: previewText
            }
          ]
        }
      ],
      elements: [
        {
          type: 'subtitles',
          settings: buildSubtitleSettings(subtitleSettings)
        }
      ]
    };

    console.log('[preview-subtitle] Creating json2video movie for subtitle preview...');

    // Create movie
    const createResult = await json2videoCreateMovie(moviePayload);

    if (!createResult.project) {
      throw new Error('json2video did not return a project ID');
    }

    console.log(`[preview-subtitle] Project created: ${createResult.project}, polling...`);

    // Poll until done (max 90 seconds for short preview)
    const movie = await json2videoPollUntilDone(createResult.project, 3000, 90000);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        videoUrl: movie.url,
        duration: movie.duration,
        project: createResult.project
      })
    };

  } catch (err) {
    console.error('[preview-subtitle] Error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message || 'Failed to render subtitle preview'
      })
    };
  }
};

/**
 * Convert frontend subtitle settings to json2video subtitle settings format.
 * json2video uses a closed list of properties — only documented keys are accepted.
 */
function buildSubtitleSettings(settings) {
  const j2vSettings = {};

  // Style preset
  if (settings.style) j2vSettings.style = settings.style;

  // Font
  if (settings.fontFamily) j2vSettings['font-family'] = settings.fontFamily;
  if (settings.fontSize) j2vSettings['font-size'] = settings.fontSize;
  if (settings.fontUrl) j2vSettings['font-url'] = settings.fontUrl;

  // Colors
  if (settings.wordColor) j2vSettings['word-color'] = settings.wordColor;
  if (settings.lineColor) j2vSettings['line-color'] = settings.lineColor;
  if (settings.outlineColor) j2vSettings['outline-color'] = settings.outlineColor;
  if (settings.boxColor) j2vSettings['box-color'] = settings.boxColor;
  if (settings.shadowColor) j2vSettings['shadow-color'] = settings.shadowColor;

  // Sizing
  if (settings.outlineWidth !== undefined) j2vSettings['outline-width'] = settings.outlineWidth;

  // Position
  if (settings.position) j2vSettings.position = settings.position;

  // Caps
  if (settings.allCaps !== undefined) j2vSettings['all-caps'] = settings.allCaps;

  return j2vSettings;
}
