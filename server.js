// ============================================================
// ShortsAI Studio Webhook & Approval Bridge Server
// Bridges n8n Cloud Webhook <-> ShortsAI Studio Frontend
// Public Tunnel: https://shortsai-api-bridge.loca.lt
// ============================================================

import http from 'http';
import https from 'https';

const PORT = 3001;
const PUBLIC_TUNNEL_URL = 'https://shortsai-api-bridge.loca.lt';
const N8N_WEBHOOK_URL = 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';

// In-memory store for active story generations & SSE subscribers
const activeStories = new Map();
const sseClients = new Set();

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

const server = http.createServer((req, res) => {
  // Enable CORS for frontend on port 5173 or any origin, bypass localtunnel reminder header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, bypass-tunnel-reminder');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ─── SSE ENDPOINT: Stream live updates to website frontend ──────
  if (req.url === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('data: {"connected": true}\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // ─── ENDPOINT 1: Website triggers story generation ──────────────
  if (req.url === '/api/generate-story' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => (bodyStr += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyStr || '{}');
        const prompt = payload.prompt || payload.rawUserInput || '';
        // Always supply the public localtunnel callback URL so n8n cloud can hit us
        const callbackUrl = `${PUBLIC_TUNNEL_URL}/api/story-approval`;

        if (!prompt.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prompt is required' }));
          return;
        }

        console.log(`[Bridge] Sending prompt to n8n cloud webhook: "${prompt.substring(0, 50)}..."`);
        console.log(`[Bridge] Public Callback URL: ${callbackUrl}`);

        const postData = JSON.stringify({
          prompt: prompt.trim(),
          voiceId: payload.voiceId || 'adam',
          visualStyle: payload.visualStyle || 'Cinematic Realistic',
          language: payload.language || 'Hinglish',
          callbackUrl: callbackUrl,
          timestamp: new Date().toISOString()
        });

        const webhookReq = https.request(
          N8N_WEBHOOK_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          },
          webhookRes => {
            let n8nResp = '';
            webhookRes.on('data', d => (n8nResp += d));
            webhookRes.on('end', () => {
              console.log(`[Bridge] n8n Webhook HTTP ${webhookRes.statusCode}:`, n8nResp.substring(0, 150));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  status: 'PROCESSING',
                  message: 'Prompt received by n8n workflow. AI is analyzing topic and generating 5-act story arc...',
                  webhookStatus: webhookRes.statusCode,
                  callbackUrl: callbackUrl
                })
              );
            });
          }
        );

        webhookReq.on('error', err => {
          console.error('[Bridge] Webhook Error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });

        webhookReq.write(postData);
        webhookReq.end();
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ─── ENDPOINT 2: n8n cloud POSTs story approval back to website ───
  if (req.url === '/api/story-approval' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => (bodyStr += chunk));
    req.on('end', () => {
      try {
        const storyData = JSON.parse(bodyStr || '{}');
        console.log('\n============================================================');
        console.log('🎉 [Bridge] Received Story for Approval from n8n cloud!');
        console.log('   Title:', storyData.suggestedTitle);
        console.log('   Hook:', storyData.viralHook?.substring(0, 60));
        console.log('   Approve URL:', storyData.approveUrl);
        console.log('============================================================\n');

        if (storyData.executionId) {
          activeStories.set(storyData.executionId, storyData);
        }

        // Broadcast to all connected frontend clients via SSE
        broadcast('story_ready', storyData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, timestamp: new Date().toISOString() }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ─── ENDPOINT 3: User approves or rejects story ───────────────────
  if (req.url === '/api/approve-story' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => (bodyStr += chunk));
    req.on('end', () => {
      try {
        const { approveUrl, action } = JSON.parse(bodyStr || '{}');
        if (!approveUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'approveUrl is required' }));
          return;
        }

        console.log(`[Bridge] User clicked ${action || 'APPROVE'}, calling resume URL:`, approveUrl);

        https.get(approveUrl, resumeRes => {
          console.log(`[Bridge] Resume Webhook responded with HTTP ${resumeRes.statusCode}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, resumed: true, status: resumeRes.statusCode }));
        }).on('error', err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 ShortsAI Bridge Server running on http://localhost:${PORT}`);
  console.log(`🌐 Public Tunnel URL: ${PUBLIC_TUNNEL_URL}`);
  console.log(`📡 n8n Webhook Target: ${N8N_WEBHOOK_URL}`);
  console.log(`⚡ SSE Events: http://localhost:${PORT}/api/events`);
});
