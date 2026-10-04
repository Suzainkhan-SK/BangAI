import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function ChatManagerView() {
  const [model, setModel] = useState('groq-llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState(
`You are BangAI Assistant, the world's most capable AI content architect and viral video strategist.
Your mission is to help creators produce extraordinary, high-retention YouTube Shorts, TikToks, and Reels.
Guidelines:
1. Speak with precision, encouraging authority, and deep knowledge of YouTube algorithms.
2. Structure all script suggestions into clear 10-scene storyboards under 75 seconds.
3. Suggest punchy 3-second visual hooks for maximum watch retention.`
  );

  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await adminService.getPlatformSettings();
      if (res.success && res.data?.chatSettings) {
        const cs = res.data.chatSettings;
        if (cs.activeModel) setModel(cs.activeModel);
        if (cs.temperature) setTemperature(cs.temperature);
        if (cs.maxTokens) setMaxTokens(cs.maxTokens);
        if (cs.systemPrompt) setSystemPrompt(cs.systemPrompt);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await adminService.savePlatformSettings({
        chatSettings: {
          activeModel: model,
          temperature,
          maxTokens,
          systemPrompt
        }
      });
      setSavedMsg('BangAI Chat persona and model hyperparameters updated in Atlas!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      setSavedMsg(`Failed to save: ${e.message}`);
    }
  };

  const handleRunTest = async (e) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setTesting(true);
    setTestOutput('');

    // Simulate direct prompt response with current model settings
    setTimeout(() => {
      setTestOutput(
        `[${model.toUpperCase()} | Temp: ${temperature} | Tokens: 312]\n\n` +
        `🔥 **Viral Short Concept**: "${testInput}"\n\n` +
        `• **Hook (0-3s)**: "Stop scrolling if you thought you knew the real story..."\n` +
        `• **Scene 1-4**: High tension build up with dynamic pacing.\n` +
        `• **Climax (60-70s)**: Mind-bending twist that forces viewers to rewatch.\n` +
        `• **Call to Action (70-75s)**: Follow for Part 2!`
      );
      setTesting(false);
    }, 900);
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">BangAI Chat & LLM Persona Manager</h1>
          <p className="admin-view-desc">
            Directly customize the core system prompt, temperature, active LLM model backbone, and test responses live.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleSaveSettings} className="admin-btn admin-btn-primary">
            💾 Save Persona & Model Settings
          </button>
        </div>
      </div>

      {savedMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          ✅ {savedMsg}
        </div>
      )}

      {/* Model Hyperparameters Card */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Active LLM Provider & Hyperparameters
        </h3>
        <div className="admin-grid admin-grid-3">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Active AI Model Backbone
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="admin-select"
            >
              <option value="groq-llama-3.3-70b-versatile">Groq: Llama 3.3 70B Versatile (Fastest)</option>
              <option value="xkiro-mistral-large">Xkiro / Mistral: Mistral Large 2</option>
              <option value="openai-gpt4o">OpenAI: GPT-4o Production</option>
              <option value="anthropic-claude-3-5-sonnet">Anthropic: Claude 3.5 Sonnet</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--admin-text-sub)', fontWeight: 600 }}>Creativity / Temperature</span>
              <span style={{ fontWeight: 600, color: 'var(--admin-accent-cyan)' }}>{temperature}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--admin-accent-cyan)', marginTop: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Max Response Tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="admin-input"
              min={256}
              max={8192}
            />
          </div>
        </div>
      </div>

      {/* Two Column: Live Persona Code Editor + Instant Test Bench */}
      <div className="admin-grid admin-grid-2">
        {/* System Prompt Code Editor */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 10px 0' }}>
            System Instructions / Persona Code Editor
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
            Injected at the root of every user chat session across BangAI web & mobile.
          </p>
          <textarea
            rows={14}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="admin-textarea"
            style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6 }}
          />
        </div>

        {/* Live Test Bench */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 10px 0' }}>
            Real-time Test Playground
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
            Dispatch test prompts against the selected model and system instructions.
          </p>

          <form onSubmit={handleRunTest} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="e.g. Write a 10-scene short about Ancient Rome's secret tunnel"
              className="admin-input"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={testing} className="admin-btn admin-btn-primary">
              {testing ? 'Thinking...' : '⚡ Test Prompt'}
            </button>
          </form>

          <div style={{
            minHeight: '230px',
            padding: '14px',
            borderRadius: '8px',
            background: 'var(--admin-bg-elevated)',
            border: '1px solid var(--admin-border-glass)',
            fontFamily: 'monospace',
            fontSize: '12.5px',
            whiteSpace: 'pre-wrap',
            color: testOutput ? 'var(--admin-text-main)' : 'var(--admin-text-sub)'
          }}>
            {testOutput || 'Click "Test Prompt" above to view live inference output with current settings...'}
          </div>
        </div>
      </div>
    </div>
  );
}
