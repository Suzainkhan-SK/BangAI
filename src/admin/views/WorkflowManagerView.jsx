import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

const DEFAULT_NODES = [
  { id: 'node_webhook', name: 'Webhook Ingestion Trigger', type: 'n8n-nodes-base.webhook', status: 'ACTIVE', desc: 'Accepts topic, voice ID, duration, and user credentials from BangAI frontend' },
  { id: 'node_brain', name: 'Strategy Brain & Script AI', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Synthesizes high-retention 5-scene script with viral hooks' },
  { id: 'node_voice', name: 'Dual-Voice Synthesis (ElevenLabs)', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Generates studio-grade narration with auto-failover voice keys' },
  { id: 'node_media', name: 'Visual Scene Collector (Pexels / Kie.ai)', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Matches vertical cinematic B-roll and AI visuals for 5 scenes' },
  { id: 'node_subtitles', name: 'Dynamic Subtitle Engine (ASS/SRT)', type: 'n8n-nodes-base.code', status: 'ACTIVE', desc: 'Compiles word-by-word animated highlights (Electric Gold typography)' },
  { id: 'node_render', name: 'Json2Video Cloud Render Dispatcher', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Assembles video, background music, audio, and subtitles into 1080p MP4' },
  { id: 'node_callback', name: 'Status Poller & Webhook Callback', type: 'n8n-nodes-base.webhook', status: 'ACTIVE', desc: 'Updates video preview status in MongoDB Atlas previews collection' },
  { id: 'node_uploader', name: 'Direct YouTube Multi-Channel Uploader', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Uploads rendered MP4 directly to user authenticated YouTube channel' }
];

export default function WorkflowManagerView() {
  const [workflows, setWorkflows] = useState([]);
  const [activeHost, setActiveHost] = useState('https://cmpunktg29.app.n8n.cloud');
  const [selectedWf, setSelectedWf] = useState(null);
  const [selectedNode, setSelectedNode] = useState(DEFAULT_NODES[1]);
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [promptOverride, setPromptOverride] = useState('Generate a high-retention 5-scene viral short under 75 seconds with a powerful 3-second hook.');
  const [apiKeyOverride, setApiKeyOverride] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await adminService.getWorkflows();
      if (res.success && res.data) {
        setWorkflows(res.data.workflows || []);
        setActiveHost(res.data.activeHost || 'https://cmpunktg29.app.n8n.cloud');
        if (res.data.workflows && res.data.workflows.length > 0) {
          const defaultWf = res.data.workflows[0];
          setSelectedWf(defaultWf);
          const savedConfig = res.data.nodeConfigs?.[defaultWf.id];
          if (savedConfig) {
            if (savedConfig.modelName) setModelName(savedConfig.modelName);
            if (savedConfig.promptOverride) setPromptOverride(savedConfig.promptOverride);
            if (savedConfig.apiKeyOverride) setApiKeyOverride(savedConfig.apiKeyOverride);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch workflows:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleSelectWorkflow = (wf) => {
    setSelectedWf(wf);
  };

  const handleSaveNode = async () => {
    if (!selectedWf) return;
    setSaving(true);
    try {
      const nodeConfigs = {
        selectedNodeId: selectedNode.id,
        modelName,
        promptOverride,
        apiKeyOverride,
        updatedAt: new Date().toISOString()
      };
      const res = await adminService.saveWorkflowNodes(selectedWf.id, nodeConfigs);
      if (res.success) {
        setToastMsg(`✅ Node [${selectedNode.name}] configured and saved to MongoDB Atlas!`);
      } else {
        setToastMsg(`⚠️ Error: ${res.error}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error saving: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Workflow Node Manager</h1>
          <p className="admin-view-desc">
            Visual inspection, node-by-node configuration, dynamic key injection, and direct cloud sync across all 4 flagship production pipelines on <code>{activeHost}</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedWf && (
            <a
              href={selectedWf.n8nUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              ↗ Open in n8n Cloud
            </a>
          )}
          <button
            type="button"
            onClick={handleSaveNode}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '☁️ Save & Sync Node Config'}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          {toastMsg}
        </div>
      )}

      {/* Flagship Workflows Grid */}
      <div className="admin-grid-3">
        {workflows.slice(0, 3).map((wf) => {
          const isSelected = selectedWf?.id === wf.id;
          return (
            <div
              key={wf.id}
              onClick={() => handleSelectWorkflow(wf)}
              className="admin-card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-border-glass)',
                background: isSelected ? 'var(--admin-card-hover)' : 'var(--admin-bg-surface)',
                boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.15)' : 'var(--admin-card-shadow)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="admin-badge admin-badge-cyan">{wf.category}</span>
                <span className="admin-badge admin-badge-success">● {wf.status}</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--admin-text-main)' }}>
                {wf.name}
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Workflow ID:</strong> <code>{wf.id}</code></div>
                <div><strong>Nodes Count:</strong> {wf.nodesCount} Executable Nodes</div>
                <div><strong>Trigger:</strong> <code>{wf.webhook.split('/webhook')[1] || wf.webhook}</code></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Workflows Bar */}
      <div className="admin-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>Additional Pipelines:</span>
            {workflows.slice(3).map((wf) => {
              const isSelected = selectedWf?.id === wf.id;
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => handleSelectWorkflow(wf)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--admin-accent-purple)' : '1px solid var(--admin-border-glass)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--admin-bg-elevated)',
                    color: isSelected ? 'var(--admin-accent-purple)' : 'var(--admin-text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {wf.name}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
            Selected: <strong style={{ color: 'var(--admin-accent-cyan)' }}>{selectedWf?.name || 'None'}</strong>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Node Chain Visualizer + Node Parameter Inspector */}
      <div className="admin-grid admin-grid-2">
        {/* Left: Node Pipeline Chain */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Execution Chain ({DEFAULT_NODES.length} Core Nodes)
            </h3>
            <span className="admin-badge admin-badge-cyan">Real Pipeline</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEFAULT_NODES.map((node, idx) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--admin-card-hover)' : 'var(--admin-bg-elevated)',
                    border: isSelected ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-border-glass)',
                      color: isSelected ? '#000' : 'var(--admin-text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                        {node.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                        {node.type}
                      </div>
                    </div>
                  </div>
                  <span className="admin-badge admin-badge-success">
                    {node.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Node Parameter Inspector & Live Config */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Node Parameter Inspector
            </h3>
            <span className="admin-badge admin-badge-purple">Direct Key Injection</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glass)' }}>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>Active Inspect Target</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginTop: '2px' }}>
                {selectedNode.name}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                {selectedNode.desc}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                LLM Backbone Engine
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="admin-select"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast & 1M Token Context)</option>
                <option value="gpt-5-preview">OpenAI GPT-5 / GPT-4o (Elite Reasoning)</option>
                <option value="groq-llama-3.3-70b-versatile">Groq LLaMA 3.3 70B (High-Speed Engine)</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Master Storyteller)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Node Prompt Strategy & System Directives
              </label>
              <textarea
                value={promptOverride}
                onChange={(e) => setPromptOverride(e.target.value)}
                rows={5}
                className="admin-textarea"
                placeholder="Custom instruction prompt for this node..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Node Dedicated API Key (Optional Override)
              </label>
              <input
                type="text"
                value={apiKeyOverride}
                onChange={(e) => setApiKeyOverride(e.target.value)}
                placeholder="Leave blank to use Key Vault failover pool..."
                className="admin-input"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveNode}
              disabled={saving}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
            >
              {saving ? 'Deploying to MongoDB Atlas...' : '💾 Save & Deploy Node Parameters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
