import React, { useState } from 'react';

const WORKFLOWS_LIST = [
  { id: 'yt-10scenes', name: 'YT-Automation-New-10Scenes.json', nodesCount: 28, trigger: 'Webhook: /viral-shorts-ai' },
  { id: 'story-approval', name: 'Story Approval Receiver', nodesCount: 8, trigger: 'Webhook: /story-approval' },
  { id: 'yt-upload', name: 'YouTube Channel Publisher', nodesCount: 12, trigger: 'Webhook: /viral-shorts-ai-youtube-upload' },
  { id: 'world-mysteries', name: 'Template: World Mysteries', nodesCount: 16, trigger: 'Webhook: /template-world-mysteries' },
  { id: 'last-24-hours', name: 'Template: Last 24 Hours', nodesCount: 18, trigger: 'Webhook: /template-last-24-hours' },
  { id: 'horror-3am', name: 'Template: 3 AM Horror', nodesCount: 15, trigger: 'Webhook: /template-3am-horror' }
];

const NODES_DATA = [
  { id: 'node_1', name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', status: 'ACTIVE', desc: 'Receives generation payload from BangAI frontend' },
  { id: 'node_2', name: 'Script Generator (Groq)', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Generates 10-scene engaging viral narration' },
  { id: 'node_3', name: 'Voice Synthesis (ElevenLabs)', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Converts generated script to hyper-realistic audio' },
  { id: 'node_4', name: 'Media Collector (Pexels / Kie.ai)', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Fetches high-res 9:16 vertical video & AI visual prompts' },
  { id: 'node_5', name: 'Subtitle Processor', type: 'n8n-nodes-base.code', status: 'ACTIVE', desc: 'Parses word-by-word timing for dynamic animated subtitles' },
  { id: 'node_6', name: 'Json2Video Cloud Render', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Dispatches assembly render job to Json2Video API' },
  { id: 'node_7', name: 'Status Poller & Webhook Callback', type: 'n8n-nodes-base.webhook', status: 'ACTIVE', desc: 'Notifies BangAI backend upon render completion' },
  { id: 'node_8', name: 'YouTube Direct Uploader', type: 'n8n-nodes-base.httpRequest', status: 'STANDBY', desc: 'Uploads rendered MP4 directly to user YouTube channel' }
];

export default function WorkflowManagerView() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(WORKFLOWS_LIST[0]);
  const [selectedNode, setSelectedNode] = useState(NODES_DATA[1]);
  const [nodeParamPrompt, setNodeParamPrompt] = useState('Create an ultra-viral YouTube Short script with 10 visual scenes under 75 seconds.');
  const [nodeApiKey, setNodeApiKey] = useState('xkiro_master_production_key_01');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSaveNode = () => {
    setSavedMsg(`Node [${selectedNode.name}] parameters saved and deployed to n8n instance!`);
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Workflow Node Manager</h1>
          <p className="admin-view-desc">
            Visual inspection, node-by-node configuration, dynamic API key injection, and real-time n8n sync.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleSaveNode} className="admin-btn admin-btn-primary">
            ☁️ Sync Nodes to n8n Cloud
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

      {/* Workflow Selector */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
              Select Active Workflow
            </label>
            <select
              value={selectedWorkflow.id}
              onChange={(e) => {
                const wf = WORKFLOWS_LIST.find(w => w.id === e.target.value);
                if (wf) setSelectedWorkflow(wf);
              }}
              className="admin-select"
            >
              {WORKFLOWS_LIST.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.nodesCount} nodes)</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>Attached Trigger</div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--admin-accent-cyan)', marginTop: '2px' }}>
              <code>{selectedWorkflow.trigger}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Node Canvas Visualizer + Parameter Inspector */}
      <div className="admin-grid admin-grid-2">
        {/* Left: Nodes Visualizer List */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
            Pipeline Node Chain ({NODES_DATA.length} Execution Steps)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {NODES_DATA.map((node, idx) => {
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
                    borderRadius: '8px',
                    background: isSelected ? 'var(--admin-card-hover)' : 'var(--admin-bg-elevated)',
                    border: isSelected ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-border-glass)',
                      color: isSelected ? '#000' : 'var(--admin-text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-main)' }}>
                        {node.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                        {node.type}
                      </div>
                    </div>
                  </div>
                  <span className={`admin-badge ${node.status === 'ACTIVE' ? 'admin-badge-success' : 'admin-badge-amber'}`}>
                    {node.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Node Parameter & Key Injector */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
            Node Parameter & Key Injector
          </h3>
          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Target Node
                </label>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--admin-accent-cyan)' }}>
                  {selectedNode.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
                  {selectedNode.desc}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                  Injected API Key / Authentication Credential
                </label>
                <input
                  type="text"
                  value={nodeApiKey}
                  onChange={(e) => setNodeApiKey(e.target.value)}
                  className="admin-input"
                  placeholder="Bearer token or API key..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                  System Prompt / Node Instructions Override
                </label>
                <textarea
                  rows={5}
                  value={nodeParamPrompt}
                  onChange={(e) => setNodeParamPrompt(e.target.value)}
                  className="admin-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleSaveNode}
                  className="admin-btn admin-btn-primary"
                  style={{ flex: 1 }}
                >
                  Save & Push to Node
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--admin-text-sub)', fontSize: '13px' }}>
              Select a node on the left to inspect parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
