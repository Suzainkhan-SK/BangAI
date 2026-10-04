import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

// Curated Top Free Models from BangAI ChatPage.jsx (Bang AI 4.5 Series)
export const BANG_AI_CHAT_MODELS = [
  {
    key: 'bang-ai-auto',
    name: 'Bang AI 4.5 Auto',
    tag: 'Auto • Smart Router',
    badge: 'AUTO',
    badgeColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
    backendId: 'mistralai/mistral-large-2512',
    maxTokens: 3000,
    desc: 'Smart router picks the best model dynamically for prompt complexity, code, reasoning, or speed.'
  },
  {
    key: 'bang-ai-ultra',
    name: 'Bang AI 4.5 Ultra',
    tag: '1M Context • 65K Output',
    badge: '1M TOKENS',
    badgeColor: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    backendId: 'mistralai/mistral-large-2512',
    maxTokens: 3000,
    desc: 'Flagship powerhouse with 1M context, 65K max output, vision, and full coding mastery.'
  },
  {
    key: 'bang-ai-thinking',
    name: 'Bang AI 4.5 Thinking',
    tag: 'Deep Reasoning • Logic',
    badge: 'REASONING',
    badgeColor: 'linear-gradient(135deg, #a855f7, #ec4899)',
    backendId: 'mistralai/mistral-large-2512',
    maxTokens: 3000,
    desc: 'Solves complex logic, multi-step math, deep architectures, and deep thinking effort.'
  },
  {
    key: 'bang-ai-search',
    name: 'Bang AI 4.5 Search',
    tag: 'Web Search • Live Citations',
    badge: 'LIVE WEB',
    badgeColor: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    backendId: 'qwen/qwen3.8-max:free',
    maxTokens: 3000,
    desc: 'Real-time web browsing, latest news citations, and viral market analysis.'
  },
  {
    key: 'bang-ai-flash',
    name: 'Bang AI 4.5 Flash',
    tag: 'Fastest • Low Latency',
    badge: 'FASTEST',
    badgeColor: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    backendId: 'mistralai/mistral-large-2512',
    maxTokens: 1500,
    desc: 'Sub-second speed for quick drafting, rapid brainstorming, and instant answers.'
  },
  {
    key: 'bang-ai-coder',
    name: 'Bang AI 4.5 Coder',
    tag: 'Code & Full Apps',
    badge: 'CODER',
    badgeColor: 'linear-gradient(135deg, #059669, #10b981)',
    backendId: 'mistralai/mistral-large-2512',
    maxTokens: 4096,
    desc: 'Specialized for complete software apps, portfolio websites, automation, and scripts.'
  },
  {
    key: 'bang-ai-vision',
    name: 'Bang AI 4.5 Vision',
    tag: 'Vision • Image Analysis',
    badge: 'VISION',
    badgeColor: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    backendId: 'minimax/minimax-m3:free',
    maxTokens: 1200,
    desc: 'Multimodal visual analysis for images, diagrams, thumbnails, and screenshots.'
  }
];

// Actual Starter Prompts from BangAI/src/pages/ChatPage.jsx
const STARTER_PROMPTS = [
  {
    icon: '🎬',
    title: 'Multi-Platform Video Screenplay',
    desc: '5-scene high-retention script with visual camera cues & voiceover pacing',
    prompt: 'Write a high-retention 5-scene viral video screenplay about the mystery of the Bermuda Triangle with scene timings, visual camera direction, and narrative pacing across 9:16 and 16:9 formats.'
  },
  {
    icon: '💻',
    title: 'Interactive Web Dashboard',
    desc: 'Complete, modern, responsive web application in HTML, CSS & JavaScript',
    prompt: 'Build me a complete, modern, and beautiful developer analytics dashboard in HTML, CSS, and Vanilla JavaScript with a sleek dark mode and interactive live charts.'
  },
  {
    icon: '🌐',
    title: 'Live Web Trend Intelligence',
    desc: 'Real-time search for trending content formats & algorithmic shifts',
    prompt: 'Search the live web and summarize the fastest-growing viral video trends and algorithmic patterns happening across YouTube, Instagram Reels, and TikTok right now.'
  },
  {
    icon: '🧠',
    title: 'Deep Reasoning & Architecture',
    desc: 'Tackle a complex technical architecture or multi-step logic problem',
    prompt: 'Solve this riddle with high reasoning effort: A farmer has 17 sheep, and all but 9 die. How many are left? Think step by step.'
  }
];

export default function ChatManagerView() {
  const [model, setModel] = useState('bang-ai-auto');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(3000);
  const [systemPrompt, setSystemPrompt] = useState(
`You are Bang AI 4.5, the flagship neural intelligence engine of BangAI Studio.
Your mission is to help creators produce extraordinary, high-retention viral YouTube Shorts, TikToks, and long-form content.
Directives:
1. Deliver razor-sharp, charismatic, authoritative, and actionable answers.
2. Structure video suggestions into 5-scene storyboards under 75 seconds with visual camera cues.
3. Suggest punchy 3-second visual hooks for maximum watch retention.`
  );

  const [testInput, setTestInput] = useState(STARTER_PROMPTS[0].prompt);
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const activeModelObj = BANG_AI_CHAT_MODELS.find(m => m.key === model) || BANG_AI_CHAT_MODELS[0];

  const fetchSettings = async () => {
    try {
      const res = await adminService.getPlatformSettings();
      if (res.success && res.data?.chatSettings) {
        const cs = res.data.chatSettings;
        if (cs.activeModel) setModel(cs.activeModel);
        if (cs.temperature !== undefined) setTemperature(cs.temperature);
        if (cs.maxTokens !== undefined) setMaxTokens(cs.maxTokens);
        if (cs.systemPrompt) setSystemPrompt(cs.systemPrompt);
      }
    } catch (e) {
      console.warn('Failed to load chat settings:', e.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleModelChange = (newKey) => {
    setModel(newKey);
    const m = BANG_AI_CHAT_MODELS.find(item => item.key === newKey);
    if (m && m.maxTokens) {
      setMaxTokens(m.maxTokens);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await adminService.savePlatformSettings({
        chatSettings: {
          activeModel: model,
          temperature,
          maxTokens,
          systemPrompt,
          backendId: activeModelObj.backendId
        }
      });
      setSavedMsg(`✅ Bang AI 4.5 configuration for [${activeModelObj.name}] saved to MongoDB Atlas!`);
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      setSavedMsg(`⚠️ Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async (e) => {
    e?.preventDefault();
    if (!testInput.trim()) return;
    setTesting(true);
    setTestOutput('');

    try {
      const res = await adminService.testChatPrompt(model, systemPrompt, testInput, temperature);
      if (res.success && res.output) {
        setTestOutput(res.output);
      } else {
        setTestOutput('⚠️ Generation completed with standard fallback response.');
      }
    } catch (err) {
      setTestOutput(`⚠️ Test error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Bang AI 4.5 Series — Chat Model & Persona Manager</h1>
          <p className="admin-view-desc">
            Directly configure the real <strong>Bang AI 4.5 Series</strong> models, system persona prompt, temperature, xKiro backend routing, and run live test generations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Model & Persona Settings'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          {savedMsg}
        </div>
      )}

      {/* Model Cards Grid: Real Bang AI 4.5 Models */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-sub)', marginBottom: '12px' }}>
          Active Bang AI 4.5 Model Lineup (Live in Website ChatPage)
        </h3>
        <div className="admin-grid admin-grid-4">
          {BANG_AI_CHAT_MODELS.map((m) => {
            const isSelected = model === m.key;
            return (
              <div
                key={m.key}
                onClick={() => handleModelChange(m.key)}
                className="admin-card"
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                  background: isSelected ? 'var(--admin-bg-elevated)' : 'var(--admin-bg-card)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s ease',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#fff',
                    background: m.badgeColor
                  }}>
                    {m.badge}
                  </span>
                  {isSelected && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-accent-cyan)' }}>
                      ● ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                  {m.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginBottom: '8px' }}>
                  {m.tag}
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', lineHeight: 1.4, margin: '0 0 8px 0', minHeight: '32px' }}>
                  {m.desc}
                </p>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.2)',
                  fontSize: '10px',
                  fontFamily: 'var(--admin-font-mono)',
                  color: 'var(--admin-text-sub)'
                }}>
                  xKiro: {m.backendId}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Model Settings + Live Test Console */}
      <div className="admin-grid admin-grid-2">
        {/* Left: Persona & Hyperparameters */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Active Model Configuration: {activeModelObj.name}
            </h3>
            <span className="admin-badge admin-badge-cyan">{activeModelObj.key}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Selected Model Selector
              </label>
              <select
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="admin-select"
              >
                {BANG_AI_CHAT_MODELS.map(m => (
                  <option key={m.key} value={m.key}>
                    {m.name} ({m.tag}) — Backend: {m.backendId}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Creativity Temperature: <strong style={{ color: 'var(--admin-accent-cyan)' }}>{temperature}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--admin-accent-cyan)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Max Token Cap: <strong style={{ color: 'var(--admin-accent-purple)' }}>{maxTokens}</strong>
                </label>
                <input
                  type="range"
                  min="512"
                  max="4096"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--admin-accent-purple)' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)' }}>
                  Core System Persona & Directives
                </label>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                  {systemPrompt.length} characters
                </span>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={9}
                className="admin-textarea"
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', lineHeight: 1.5 }}
              />
            </div>

            {/* Quick Starter Prompts */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                Load Official Starter Prompt from Website:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {STARTER_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTestInput(sp.prompt)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'var(--admin-bg-elevated)',
                      border: '1px solid var(--admin-border-glass)',
                      color: 'var(--admin-text-main)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={sp.desc}
                  >
                    <span>{sp.icon}</span>
                    <span>{sp.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real Test Sandbox */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Live Model Execution Sandbox
            </h3>
            <span className="admin-badge admin-badge-cyan">{activeModelObj.badge}</span>
          </div>

          <form onSubmit={handleRunTest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Test Input Prompt
              </label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={3}
                placeholder="Enter prompt to test with the active persona..."
                className="admin-textarea"
              />
            </div>

            <button
              type="submit"
              disabled={testing}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%' }}
            >
              {testing ? `Executing with ${activeModelObj.name}...` : `⚡ Test Prompt with ${activeModelObj.name} Live`}
            </button>
          </form>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
              Execution Output ({activeModelObj.name})
            </label>
            <div style={{
              minHeight: '260px',
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--admin-bg-elevated)',
              border: '1px solid var(--admin-border-glass)',
              fontFamily: 'var(--admin-font-mono)',
              fontSize: '12.5px',
              color: 'var(--admin-text-main)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5
            }}>
              {testing ? (
                <div style={{ color: 'var(--admin-accent-cyan)' }}>
                  Processing prompt with {activeModelObj.name} (xKiro: {activeModelObj.backendId})...
                </div>
              ) : testOutput ? (
                testOutput
              ) : (
                <span style={{ color: 'var(--admin-text-sub)' }}>
                  Click "Test Prompt with {activeModelObj.name} Live" to execute with current configuration...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
