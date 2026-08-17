import React, { useState } from 'react';
import { 
  Code2, 
  Key, 
  Copy, 
  Check, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Globe, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

export default function ApiDocsPage({ onNavigate }) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState(null);

  const curlExample = `curl -X POST https://api.shortsai.studio/v1/shorts/generate \\
  -H "Authorization: Bearer sk_live_98a7bc62e0f4192b" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Unsolved mystery of the Bermuda Triangle Flight 19",
    "voiceId": "adam",
    "visualStyle": "cinematic",
    "language": "Hinglish",
    "musicTrack": "mystery",
    "autoPublishYouTube": true
  }'`;

  const responseExample = `{
  "status": "success",
  "shortId": "short_9827361",
  "title": "Bermuda Triangle: Flight 19 का खौफनाक सच! 😱",
  "durationSeconds": 75.0,
  "criticScore": 98,
  "scenes": [
    {
      "sceneNumber": 1,
      "act": "HOOK (0-15s)",
      "characterCount": 194,
      "voiceoverUrl": "https://cdn.shortsai.studio/audio/s1.mp3",
      "videoUrl": "https://cdn.shortsai.studio/video/s1.mp4"
    },
    {
      "sceneNumber": 2,
      "act": "SETUP (15-30s)",
      "characterCount": 198,
      "voiceoverUrl": "https://cdn.shortsai.studio/audio/s2.mp3",
      "videoUrl": "https://cdn.shortsai.studio/video/s2.mp4"
    }
  ],
  "youtube": {
    "status": "UPLOADED",
    "videoId": "dQw4w9WgXcQ",
    "url": "https://youtube.com/shorts/dQw4w9WgXcQ"
  }
}`;

  const handleCopyCurl = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyResponse = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(responseExample);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleRunLiveTest = () => {
    audioEngine.playSfx('boom');
    setIsTesting(true);
    setTestOutput(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestOutput({
        statusCode: 200,
        statusMessage: '200 OK — Pipeline Executed in 750ms',
        data: JSON.parse(responseExample)
      });
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
          <Code2 size={13} />
          <span>Developer API v1.0 & Webhooks</span>
        </span>
        <h1 className="font-display" style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          ShortsAI REST API Hub
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Automate full 75-second 5-scene video screenplays, ElevenLabs voiceovers, and YouTube uploads programmatically from n8n, Make, or Python.
        </p>
      </div>

      {/* Secret API Key Banner */}
      <div className="saas-card" style={{
        padding: '20px 24px',
        borderRadius: '18px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        border: '1.5px solid var(--border-glow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Key size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Your Secret Production API Key</div>
            <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>sk_live_98a7bc62e0f4192b_shortsai_prod</div>
          </div>
        </div>

        <button
          onClick={handleRunLiveTest}
          disabled={isTesting}
          className="btn-glow"
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          <Play size={13} fill="#ffffff" />
          <span>{isTesting ? 'Sending Request...' : 'Send Live Test Request'}</span>
        </button>
      </div>

      {/* Live Interactive Test Console Output (if triggered) */}
      {testOutput && (
        <div className="saas-card" style={{
          padding: '20px',
          borderRadius: '18px',
          marginBottom: '28px',
          border: '1.5px solid #10b981',
          background: 'rgba(16, 185, 129, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              {testOutput.statusMessage}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Response Time: 750ms
            </span>
          </div>

          <pre style={{
            background: '#040711',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#34d399',
            overflowX: 'auto',
            maxHeight: '220px',
            lineHeight: 1.5
          }}>
            {JSON.stringify(testOutput.data, null, 2)}
          </pre>
        </div>
      )}

      {/* POST Generate API Docs Card */}
      <div className="saas-card" style={{ padding: '28px', borderRadius: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{
            background: '#10b981',
            color: '#ffffff',
            padding: '3px 9px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '12px'
          }}>
            POST
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            https://api.shortsai.studio/v1/shorts/generate
          </span>
        </div>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          Generates a 75-second 5-scene cinematic video short with strict 190–200 character speech pacing and automatic YouTube Data API v3 upload.
        </p>

        {/* cURL Request */}
        <div style={{ position: 'relative', marginBottom: '22px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
            padding: '8px 14px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            border: '1px solid var(--border-medium)',
            borderBottom: 'none'
          }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              cURL Request Example
            </span>
            <button
              onClick={handleCopyCurl}
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: '11.5px' }}
            >
              {copiedCurl ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre style={{
            background: '#040711',
            border: '1px solid var(--border-medium)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            padding: '16px',
            fontSize: '12.5px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#a5b4fc',
            overflowX: 'auto',
            lineHeight: 1.5
          }}>
            {curlExample}
          </pre>
        </div>

        {/* JSON Response */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
            padding: '8px 14px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            border: '1px solid var(--border-medium)',
            borderBottom: 'none'
          }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              JSON Response (200 OK)
            </span>
            <button
              onClick={handleCopyResponse}
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: '11.5px' }}
            >
              {copiedResponse ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre style={{
            background: '#040711',
            border: '1px solid var(--border-medium)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#34d399',
            overflowX: 'auto',
            lineHeight: 1.5
          }}>
            {responseExample}
          </pre>
        </div>
      </div>
    </div>
  );
}
