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
2. Structure all script suggestions into clear 5-scene storyboards under 75 seconds.
3. Suggest punchy 3-second visual hooks for maximum watch retention.`
  );

  const [testInput, setTestInput] = useState('Give me a 3-second hook for a mysterious Bermuda triangle video');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

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

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await adminService.savePlatformSettings({
        chatSettings: {
          activeModel: model,
          temperature,
          maxTokens,
          systemPrompt
        }
      });
      setSavedMsg('✅ BangAI Chat persona and model hyperparameters saved to MongoDB Atlas!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      setSavedMsg(`⚠️ Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async (e) => {
    e.preventDefault();
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
          <h1 className="admin-view-title">BangAI Chat & LLM Persona Manager</h1>
          <p className="admin-view-desc">
            Directly customize the core system prompt, temperature, active LLM model backbone, and run real live prompt tests.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Persona & Model Settings'}
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

      {/* Two Column Layout: Model Settings + Live Test Console */}
      <div className="admin-grid admin-grid-2">
        {/* Left: Persona & Hyperparameters */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0' }}>
            LLM Brain Configuration & Persona Prompt
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Primary Production Model Backbone
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="admin-select"
              >
                <option value="groq-llama-3.3-70b-versatile">Groq LLaMA 3.3 70B (Fastest Ingestion - Recommended)</option>
                <option value="xkiro-mistral-large">xKiro Mistral Large (Deep Reasoning)</option>
                <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (1M Context Runway)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini (High Accuracy)</option>
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
                  Core System Prompt & Algorithmic Directives
                </label>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                  {systemPrompt.length} characters
                </span>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={10}
                className="admin-textarea"
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', lineHeight: 1.5 }}
              />
            </div>
          </div>
        </div>

        {/* Right: Real Test Sandbox */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Live Model Execution Sandbox
            </h3>
            <span className="admin-badge admin-badge-cyan">{model.split('-')[0].toUpperCase()}</span>
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
              {testing ? 'Executing Prompt with Model...' : '⚡ Test Prompt Response Live'}
            </button>
          </form>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
              Execution Output
            </label>
            <div style={{
              minHeight: '220px',
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
                  Processing prompt with {model}...
                </div>
              ) : testOutput ? (
                testOutput
              ) : (
                <span style={{ color: 'var(--admin-text-sub)' }}>
                  Click "Test Prompt Response Live" to execute with current configuration...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
