// Netlify Function: preview-subtitle
// POST /.netlify/functions/preview-subtitle
// GET  /.netlify/functions/preview-subtitle?project={id}
// Renders and polls subtitle preview clips via json2video API with zero Netlify timeouts & zero client-side key leakage

import { json2videoCreateMovie, getJson2VideoKey } from './api-keys.js';
import { getDb } from './db.js';
import { toJson2VideoSubtitleSettings } from '../../src/lib/json2videoSubtitles.js';

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

  // ─── 1. GET: POLL PROJECT STATUS (Server-Side Key Resolution) ────────
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

      // Look up apiKey server-side
      let apiKey = null;
      try {
        const db = await getDb();
        const doc = await db.collection('previews').findOne({ project: projectId });
        if (doc && doc.apiKey) apiKey = doc.apiKey;
      } catch (dbErr) {
        console.warn('[preview-subtitle] DB lookup notice:', dbErr.message);
      }

      if (!apiKey) {
        apiKey = getJson2VideoKey(0);
      }

      const res = await fetch(`https://api.json2video.com/v2/movies?project=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: { 'x-api-key': apiKey }
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: false, error: `json2video status error (${res.status}): ${errText}` })
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
            error: movie.message || movie.error || 'Subtitle video rendering failed on json2video'
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

  // ─── 2. POST: CREATE PREVIEW PROJECT (FAST DISPATCH) ────────────────
  if (event.httpMethod === 'POST') {
    try {
      const { subtitleSettings, text, voiceId } = JSON.parse(event.body || '{}');

      if (!subtitleSettings) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'subtitleSettings is required' })
        };
      }

      const previewText = (text || 'This is how your viral subtitles will look in the final video. High retention and high energy!').substring(0, 160);

      const moviePayload = {
        resolution: 'custom',
        width: 1080,
        height: 1920,
        quality: 'low',
        cache: false,
        scenes: [
          {
            duration: 3,
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
            settings: toJson2VideoSubtitleSettings(subtitleSettings, previewText)
          }
        ]
      };

      console.log('[preview-subtitle] Creating json2video project...');
      const createResult = await json2videoCreateMovie(moviePayload);

      if (!createResult.project) {
        throw new Error('json2video did not return a project ID: ' + JSON.stringify(createResult));
      }

      // Store project -> apiKey mapping server-side with TTL
      try {
        const db = await getDb();
        await db.collection('previews').updateOne(
          { project: createResult.project },
          { 
            $set: { 
              project: createResult.project, 
              apiKey: createResult.apiKey, 
              createdAt: new Date() 
            } 
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.warn('[preview-subtitle] DB store notice:', dbErr.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'rendering',
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
          error: err.message || 'Failed to initialize subtitle preview'
        })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
