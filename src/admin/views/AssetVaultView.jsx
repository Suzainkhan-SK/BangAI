import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function AssetVaultView() {
  const [jobs, setJobs] = useState([]);
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getJobs(100);
      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
      }
    } catch (e) {
      console.warn('Error fetching generation jobs from Atlas:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const renderingJobs = jobs.filter(j => j.status === 'rendering');
  const queuedJobs = jobs.filter(j => j.status === 'queued');
  const assemblingJobs = jobs.filter(j => j.status === 'assembling');

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Master Asset Vault & Generation Pipeline</h1>
          <p className="admin-view-desc">
            Direct real-time observation of all {jobs.length} video generation jobs from Atlas <code>previews</code> collection, raw asset downloads, and in-app Cinema Player.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--admin-bg-elevated)', borderRadius: '10px', padding: '2px', border: '1px solid var(--admin-border-glass)' }}>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: viewMode === 'kanban' ? 'var(--admin-accent-cyan)' : 'transparent',
                color: viewMode === 'kanban' ? '#000' : 'var(--admin-text-main)',
                border: 'none',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              📋 Kanban Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: viewMode === 'table' ? 'var(--admin-accent-cyan)' : 'transparent',
                color: viewMode === 'table' ? '#000' : 'var(--admin-text-main)',
                border: 'none',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              📄 Data Table
            </button>
          </div>

          <button type="button" onClick={fetchJobs} disabled={loading} className="admin-btn admin-btn-secondary">
            🔄 {loading ? 'Loading...' : 'Refresh Pipeline'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
          Loading real video jobs from MongoDB Atlas previews collection...
        </div>
      ) : viewMode === 'kanban' ? (
        /* 4-Stage Pipeline Kanban Board */
        <div className="admin-kanban-board">
          {/* Stage 1: Queued */}
          <div className="admin-kanban-col">
            <div className="admin-kanban-header">
              <span>📝 Queued & Scripting</span>
              <span className="admin-badge admin-badge-secondary">{queuedJobs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {queuedJobs.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', textAlign: 'center', padding: '20px 0' }}>
                  No jobs currently queued
                </div>
              ) : (
                queuedJobs.map(job => (
                  <div key={job.id} className="admin-card" style={{ padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>{job.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>{job.creator} • {job.time}</div>
                    <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
                      <div className="admin-progress-fill" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stage 2: Media & Audio Assembly */}
          <div className="admin-kanban-col">
            <div className="admin-kanban-header">
              <span>🎙️ Media & Audio Assembly</span>
              <span className="admin-badge admin-badge-cyan">{assemblingJobs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assemblingJobs.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', textAlign: 'center', padding: '20px 0' }}>
                  No active audio assemblies
                </div>
              ) : (
                assemblingJobs.map(job => (
                  <div key={job.id} className="admin-card" style={{ padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>{job.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>ElevenLabs + Pexels • {job.time}</div>
                    <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
                      <div className="admin-progress-fill" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stage 3: Rendering */}
          <div className="admin-kanban-col">
            <div className="admin-kanban-header">
              <span>⚡ Json2Video / Modal GPU</span>
              <span className="admin-badge admin-badge-purple">{renderingJobs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {renderingJobs.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', textAlign: 'center', padding: '20px 0' }}>
                  No renders in progress
                </div>
              ) : (
                renderingJobs.map(job => (
                  <div key={job.id} className="admin-card" style={{ padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>{job.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>Rendering 1080x1920 • {job.time}</div>
                    <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
                      <div className="admin-progress-fill" style={{ width: '75%', background: 'var(--admin-accent-purple)' }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stage 4: Completed */}
          <div className="admin-kanban-col">
            <div className="admin-kanban-header">
              <span>✅ Completed & Ready</span>
              <span className="admin-badge admin-badge-success">{completedJobs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
              {completedJobs.slice(0, 20).map(job => (
                <div key={job.id} className="admin-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--admin-text-main)' }}>{job.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                    Project: <code>{job.id}</code> • {job.time}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveVideoModal(job)}
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '5px 10px', fontSize: '11.5px', flex: 1 }}
                    >
                      ▶ Cinema Player
                    </button>
                    {job.videoUrl && (
                      <a
                        href={job.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11.5px', textDecoration: 'none' }}
                      >
                        📥 MP4
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Data Table View */
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job / Project ID</th>
                  <th>Title / Prompt</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td><code>{job.id}</code></td>
                    <td style={{ fontWeight: 600 }}>{job.title}</td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>{job.time}</td>
                    <td>
                      <span className="admin-badge admin-badge-success">COMPLETED</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveVideoModal(job)}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                        >
                          ▶ Preview
                        </button>
                        {job.videoUrl && (
                          <a
                            href={job.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11.5px', textDecoration: 'none' }}
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Video Cinema Player Modal */}
      {activeVideoModal && (
        <div className="admin-modal-overlay" onClick={() => setActiveVideoModal(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  🎬 Cinema Player: {activeVideoModal.title}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
                  Project ID: <code>{activeVideoModal.id}</code>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-sub)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ width: '100%', maxHeight: '440px', background: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
              <video
                src={activeVideoModal.videoUrl}
                controls
                autoPlay
                style={{ maxHeight: '420px', maxWidth: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
                Render Engine: Json2Video Cloud API (1080x1920 @ 60fps)
              </span>
              {activeVideoModal.videoUrl && (
                <a
                  href={activeVideoModal.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="admin-btn admin-btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  📥 Download Rendered Master MP4
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
