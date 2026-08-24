// Netlify Function: preview-subtitle
// POST /.netlify/functions/preview-subtitle
// GET  /.netlify/functions/preview-subtitle?project={id}&apiKey={key}
// Renders and polls subtitle preview clips via json2video API with zero Netlify timeouts

import { json2videoCreateMovie, json2videoPollUntilDone } from './api-keys.js';

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

  // ─── 1. GET: POLL EXISTING PROJECT ──────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const projectId = event.queryStringParameters?.project;
      const apiKey = event.queryStringParameters?.apiKey;

      if (!projectId || !apiKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'project and apiKey query parameters are required' })
        };
      }

      const res = await fetch(`https://api.json2video.com/v2/movies?project=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: { 'x-api-key': apiKey }
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return {
          statusCode: res.status,
          headers,
          body: JSON.stringify({ success: false, error: `json2video status error: ${errText}` })
        };
      }

      const result = await res.json();
      const movie = result.movie || result;
      const status = movie.status || result.status;

      if (status === 'done') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: 'done',
            videoUrl: movie.url,
            duration: movie.duration,
            project: projectId
          })
        };
      }

      if (status === 'error') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'error',
            error: movie.message || movie.error || 'Subtitle render failed on json2video'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'rendering',
          project: projectId,
          apiKey
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

  // ─── 2. POST: CREATE NEW PREVIEW MOVIE ──────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      const { subtitleSettings, text, voiceId } = JSON.parse(event.body || '{}');

      if (!subtitleSettings) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'subtitleSettings is required' })
        };
      }

      const previewText = (text || 'This is how your viral subtitles will look in the final video. High retention and high energy!').substring(0, 160);

      const moviePayload = {
        resolution: 'custom',
        width: 1080,
        height: 1920,
        quality: 'low',
        cache: true,
        scenes: [
          {
            duration: 4,
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
      const createResult = await json2videoCreateMovie(moviePayload);

      if (!createResult.project) {
        throw new Error('json2video did not return a project ID: ' + JSON.stringify(createResult));
      }

      const projectId = createResult.project;
      const apiKey = createResult.apiKey;

      // Fast-poll for up to 6 seconds before returning async status
      try {
        const movie = await json2videoPollUntilDone(projectId, apiKey, 1500, 6000);
        if (movie && movie.url) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              status: 'done',
              videoUrl: movie.url,
              duration: movie.duration,
              project: projectId
            })
          };
        }
      } catch (pollTimeout) {
        // Still rendering -> return project details for client-side polling
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'rendering',
          project: projectId,
          apiKey: apiKey
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
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};

/**
 * Convert frontend subtitle settings to json2video subtitle settings format.
 */
function buildSubtitleSettings(settings) {
  const j2vSettings = {};

  // Style preset
  const style = settings.style === 'classic-progressive' ? 'highlight' : (settings.style || 'highlight');
  j2vSettings.style = style;

  // Font
  j2vSettings['font-family'] = settings.fontFamily || 'Montserrat';
  let size = Number(settings.fontSize) || 78;
  if (size > 120) size = Math.round(size / 3.5);
  j2vSettings['font-size'] = Math.max(56, Math.min(100, size));
  if (settings.fontUrl) j2vSettings['font-url'] = settings.fontUrl;

  // Colors
  j2vSettings['word-color'] = settings.wordColor || '#FFE600';
  j2vSettings['line-color'] = settings.lineColor || '#FFFFFF';
  j2vSettings['outline-color'] = settings.outlineColor || '#000000';
  if (settings.boxColor) j2vSettings['box-color'] = settings.boxColor;
  if (settings.shadowColor) j2vSettings['shadow-color'] = settings.shadowColor;

  // Sizing & Positioning
  j2vSettings['outline-width'] = Number(settings.outlineWidth !== undefined ? settings.outlineWidth : 8);
  j2vSettings.position = settings.position || 'center-center';
  j2vSettings['all-caps'] = settings.allCaps !== undefined ? settings.allCaps : true;
  j2vSettings['max-words-per-line'] = Number(settings.maxWordsPerLine) || 3;

  return j2vSettings;
}
