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
  ArrowRight,
  Terminal,
  ShieldAlert,
  Server,
  RefreshCw,
  ExternalLink,
  Sliders,
  Send,
  Eye,
  EyeOff,
  Radio,
  FileCode
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';

export default function ApiDocsPage({ onNavigateToDashboard }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('curl');
  const [activeEndpoint, setActiveEndpoint] = useState('generate');
  const { isMobile, isTablet } = useBreakpoint();
  
  // Interactive Console State
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState(null);
  const [playgroundPrompt, setPlaygroundPrompt] = useState('The ancient sunken city discovered beneath the Mediterranean Sea');
  const [playgroundAspect, setPlaygroundAspect] = useState('9:16');
  const [playgroundVoice, setPlaygroundVoice] = useState('adam');

  const apiKey = 'sk_live_98a7bc62e0f4192b_bang_ai_prod';

  // Code Snippets per Language for the active endpoint
  const getCodeSnippet = () => {
    if (activeEndpoint === 'generate') {
      switch (activeLanguage) {
        case 'python':
          return `import requests

url = "https://api.bangai.studio/v1/videos/generate"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "prompt": "${playgroundPrompt}",
    "aspectRatio": "${playgroundAspect}",
    "voiceId": "${playgroundVoice}",
    "visualStyle": "cinematic",
    "language": "English",
    "webhookUrl": "https://your-server.com/webhooks/bangai"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Render Job Dispatched:", data["jobId"])`;

        case 'nodejs':
          return `import fetch from 'node-fetch';

const response = await fetch('https://api.bangai.studio/v1/videos/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: '${playgroundPrompt}',
    aspectRatio: '${playgroundAspect}',
    voiceId: '${playgroundVoice}',
    visualStyle: 'cinematic',
    language: 'English',
    webhookUrl: 'https://your-server.com/webhooks/bangai'
  })
});

const data = await response.json();
console.log('Video Generation Status:', data.status, data.jobId);`;

        case 'go':
          return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://api.bangai.studio/v1/videos/generate"
	payload := map[string]interface{}{
		"prompt":      "${playgroundPrompt}",
		"aspectRatio": "${playgroundAspect}",
		"voiceId":     "${playgroundVoice}",
		"visualStyle": "cinematic",
		"language":    "English",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer ${apiKey}")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`;

        case 'curl':
        default:
          return `curl -X POST https://api.bangai.studio/v1/videos/generate \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "${playgroundPrompt}",
    "aspectRatio": "${playgroundAspect}",
    "voiceId": "${playgroundVoice}",
    "visualStyle": "cinematic",
    "language": "English",
    "webhookUrl": "https://your-server.com/webhooks/bangai"
  }'`;
      }
    } else if (activeEndpoint === 'status') {
      switch (activeLanguage) {
        case 'python':
          return `import requests

url = "https://api.bangai.studio/v1/videos/job_9841284"
headers = {"Authorization": "Bearer ${apiKey}"}

response = requests.get(url, headers=headers)
print(response.json())`;
        case 'nodejs':
          return `const res = await fetch('https://api.bangai.studio/v1/videos/job_9841284', {
  headers: { 'Authorization': 'Bearer ${apiKey}' }
});
const status = await res.json();
console.log(status.videoUrl);`;
        case 'go':
          return `req, _ := http.NewRequest("GET", "https://api.bangai.studio/v1/videos/job_9841284", nil)
req.Header.Set("Authorization", "Bearer ${apiKey}")
// Execute request...`;
        case 'curl':
        default:
          return `curl -X GET https://api.bangai.studio/v1/videos/job_9841284 \\
  -H "Authorization: Bearer ${apiKey}"`;
      }
    } else {
      // Voices
      return `curl -X GET https://api.bangai.studio/v1/voices \\
  -H "Authorization: Bearer ${apiKey}"`;
    }
  };

  // Response sample matching active endpoint
  const getResponseSample = () => {
    if (activeEndpoint === 'generate') {
      return {
        status: "COMPLETED",
        jobId: "job_9841284",
        title: "Lost Mediterranean Civilization Unveiled",
        aspectRatio: playgroundAspect,
        durationSeconds: 62.4,
        videoUrl: "https://cdn.bangai.studio/exports/job_9841284_1080p.mp4",
        subtitlesBurned: true,
        scenesCount: 5,
        scenes: [
          {
            sceneNumber: 1,
            act: "ACT 1: THE CURIOSITY HOOK",
            voiceoverText: "Two hundred meters beneath the azure waters of the Mediterranean, sonar scanners hit something impossible...",
            audioUrl: "https://cdn.bangai.studio/audio/s1.mp3",
            duration: 12.5
          },
          {
            sceneNumber: 2,
            act: "ACT 2: RISING ANOMALY",
            voiceoverText: "Monolithic stone pillars arranged in geometric alignments that predate known recorded history.",
            audioUrl: "https://cdn.bangai.studio/audio/s2.mp3",
            duration: 14.0
          }
        ],
        syndication: {
          recommendedPlatforms: ["YouTube", "Instagram", "TikTok", "LinkedIn"],
          suggestedTags: ["#History", "#DeepSea", "#Archaeology", "#Mystery", "#OceanExploration"]
        }
      };
    } else if (activeEndpoint === 'status') {
      return {
        jobId: "job_9841284",
        status: "READY",
        progress: 100,
        renderTimeMs: 4210,
        masterMp4Url: "https://cdn.bangai.studio/exports/job_9841284_master.mp4",
        thumbnailUrl: "https://cdn.bangai.studio/thumbnails/job_9841284_thumb.jpg",
        audioDuckingDb: -18.0
      };
    } else {
      return {
        count: 24,
        languagesSupported: 31,
        voices: [
          { id: "adam", name: "Adam", gender: "Male", accent: "American", style: "Deep Narrative" },
          { id: "priya", name: "Priya", gender: "Female", accent: "Indian", style: "Warm Expressive" },
          { id: "george", name: "George", gender: "Male", accent: "British", style: "Epic Documentary" }
        ]
      };
    }
  };

  const handleCopyKey = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCode = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleRunLiveTest = () => {
    audioEngine.playSfx('boom');
    setIsTesting(true);
    setTestOutput(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestOutput({
        statusCode: 200,
        statusMessage: '200 OK — Pipeline Executed in 640ms',
        requestId: 'req_' + Math.random().toString(36).substring(2, 9),
        data: getResponseSample()
      });
      audioEngine.playSfx('success');
    }, 950);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '20px 12px 60px 12px' : '40px 24px 80px 24px' }}>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div className="glow-pill" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(255, 79, 0, 0.08)',
          border: '1px solid rgba(255, 79, 0, 0.25)',
          marginBottom: '16px'
        }}>
          <Code2 size={14} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Developer REST API v1.0 & Webhooks
          </span>
        </div>

        <h1 className="font-display" style={{
          fontSize: 'clamp(26px, 5vw, 36px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '10px'
        }}>
          Autonomous Video Engine <span className="grad-text">Developer Hub</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '780px' }}>
          Programmatically generate multi-act screenplays, synthesize neural voiceovers in 31+ languages, 
          burn kinetic subtitles, and dispatch master video renders via high-performance REST endpoints and async webhooks.
        </p>
      </div>

      {/* ── API KEY & CREDENTIALS BANNER ───────────────────────────── */}
      <div className="saas-card" style={{
        padding: '24px',
        borderRadius: '20px',
        marginBottom: '32px',
        border: '1.5px solid var(--border-glow)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 79, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Key size={22} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Production Master API Key
                </span>
                <span className="badge badge-brand" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  Live Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-input)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {showKey ? apiKey : 'sk_live_98a7bc••••••••••••••••prod'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCopyKey}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedKey ? 'Copied to Clipboard' : 'Copy API Key'}</span>
            </button>
            <button
              onClick={handleRunLiveTest}
              disabled={isTesting}
              className="btn-glow"
              style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isTesting ? <RefreshCw size={14} className="spin-animation" /> : <Send size={14} />}
              <span>{isTesting ? 'Dispatching...' : 'Test Request'}</span>
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap'
        }}>
          <span>Rate Limit: <strong>120 requests / min</strong></span>
          <span>•</span>
          <span>Max Parallel Renders: <strong>5 concurrent</strong></span>
          <span>•</span>
          <span>Webhook Retries: <strong>3 automatic backoffs</strong></span>
          <span>•</span>
          <span>Format: <strong>JSON / UTF-8</strong></span>
        </div>
      </div>

      {/* ── LIVE INTERACTIVE CONSOLE OUTPUT (IF TRIGGERED) ─────────── */}
      {testOutput && (
        <div className="saas-card" style={{
          padding: '20px',
          borderRadius: '18px',
          marginBottom: '32px',
          border: '1.5px solid #10b981',
          background: 'var(--bg-card)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              {testOutput.statusMessage}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <span>Request ID: <code style={{ color: 'var(--text-primary)' }}>{testOutput.requestId}</code></span>
              <span>Latency: <strong style={{ color: '#10b981' }}>640ms</strong></span>
            </div>
          </div>

          <pre style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12.5px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#10b981',
            overflowX: 'auto',
            maxHeight: '260px',
            lineHeight: 1.5
          }}>
            {JSON.stringify(testOutput.data, null, 2)}
          </pre>
        </div>
      )}

      {/* ── ENDPOINT & PLAYGROUND DECK ─────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isTablet || isMobile ? '1fr' : 'repeat(12, 1fr)',
        gap: isMobile ? '16px' : '24px',
        marginBottom: '36px'
      }}>
        {/* Left Column: Endpoints & Configurator */}
        <div style={{ gridColumn: isTablet || isMobile ? 'span 1' : 'span 5' }}>
          <div className="saas-card" style={{ padding: isMobile ? '16px 14px' : '22px', borderRadius: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              REST API Endpoints
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'generate', method: 'POST', path: '/v1/videos/generate', desc: 'Create AI Video' },
                { id: 'status', method: 'GET', path: '/v1/videos/:jobId', desc: 'Fetch Render Status' },
                { id: 'voices', method: 'GET', path: '/v1/voices', desc: 'List Voices & Accents' }
              ].map((ep) => {
                const isActive = activeEndpoint === ep.id;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setActiveEndpoint(ep.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(255, 79, 0, 0.1)' : 'var(--bg-input)',
                      border: `1.5px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '5px',
                        background: ep.method === 'POST' ? '#10b981' : '#38bdf8',
                        color: '#ffffff'
                      }}>
                        {ep.method}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 600 }}>
                        {ep.path}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {ep.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Parameters Playground */}
          {activeEndpoint === 'generate' && (
            <div className="saas-card" style={{ padding: '22px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sliders size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Interactive Request Configurator
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Story Topic / Prompt:
                  </label>
                  <textarea
                    value={playgroundPrompt}
                    onChange={(e) => setPlaygroundPrompt(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                      Target Format:
                    </label>
                    <select
                      value={playgroundAspect}
                      onChange={(e) => setPlaygroundAspect(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="9:16">9:16 Vertical (Shorts/Reels)</option>
                      <option value="16:9">16:9 Cinema (YouTube/Web)</option>
                      <option value="1:1">1:1 Square (Ads/Feed)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                      Narrator Voice:
                    </label>
                    <select
                      value={playgroundVoice}
                      onChange={(e) => setPlaygroundVoice(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="adam">Adam (Deep Cinematic)</option>
                      <option value="priya">Priya (Warm Expressive)</option>
                      <option value="george">George (Epic British)</option>
                      <option value="charlie">Charlie (Playful Cartoon)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code Generator & Response Preview */}
        <div style={{ gridColumn: isTablet || isMobile ? 'span 1' : 'span 7' }}>
          {/* Language Switcher Bar */}
          <div className="saas-card" style={{ padding: isMobile ? '16px 14px' : '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'python', label: 'Python' },
                  { id: 'nodejs', label: 'Node.js' },
                  { id: 'go', label: 'Go' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setActiveLanguage(lang.id);
                    }}
                    style={{
                      background: activeLanguage === lang.id ? 'var(--accent-primary)' : 'transparent',
                      color: activeLanguage === lang.id ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: activeLanguage === lang.id ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="btn-ghost"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedSnippet ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copiedSnippet ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Block Container */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <pre style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '12.5px',
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-primary)',
                overflowX: 'auto',
                lineHeight: 1.5,
                maxHeight: '320px'
              }}>
                {getCodeSnippet()}
              </pre>
            </div>

            {/* Expected JSON Response Block */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sample JSON Response (200 OK)
              </div>
              <pre style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#38bdf8',
                overflowX: 'auto',
                lineHeight: 1.5,
                maxHeight: '220px'
              }}>
                {JSON.stringify(getResponseSample(), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ── ERROR HANDLING & STATUS CODES TABLE ───────────────────── */}
      <div className="saas-card" style={{ padding: '28px', borderRadius: '20px' }}>
        <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color="#38bdf8" />
          <span>HTTP Status Codes & Error Handling</span>
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Code</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Description</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: '200 OK', status: 'Success', desc: 'Request succeeded and video pipeline was dispatched.', action: 'Poll /v1/videos/:id or await webhook callback.' },
                { code: '400 Bad Request', status: 'Invalid Payload', desc: 'Missing required prompt or invalid aspect ratio.', action: 'Verify JSON body formatting and required fields.' },
                { code: '401 Unauthorized', status: 'Invalid Auth', desc: 'API key is missing, expired, or malformed.', action: 'Verify Authorization: Bearer sk_live_... header.' },
                { code: '422 Validation Error', status: 'Safety Block', desc: 'Prompt violates safety policies or language unsupported.', action: 'Refine prompt to adhere to creative guidelines.' },
                { code: '429 Rate Limited', status: 'Too Many Requests', desc: 'Exceeded 120 req/min quota.', action: 'Implement exponential backoff retry logic.' }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: row.code.startsWith('200') ? '#10b981' : '#ef4444' }}>
                    {row.code}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.status}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {row.desc}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {row.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
