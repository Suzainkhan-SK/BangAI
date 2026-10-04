import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

const MOCK_JOBS = [
  {
    id: 'job_88a10',
    title: 'Bermuda Triangle 75s Mystery',
    status: 'completed',
    creator: 'user@shortsai.com',
    progress: 100,
    time: '2 mins ago',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'job_88a11',
    title: 'Why 3 AM Is Creepy',
    status: 'rendering',
    creator: 'viral_creator@gmail.com',
    progress: 68,
    time: '4 mins ago'
  },
  {
    id: 'job_88a12',
    title: 'Top 5 AI Tools in 2026',
    status: 'assembling',
    creator: 'tech_fan@yahoo.com',
    progress: 35,
    time: '6 mins ago'
  },
  {
    id: 'job_88a13',
    title: 'Deep Sea Creatures Caught on Camera',
    status: 'queued',
    creator: 'nature_shorts@gmail.com',
    progress: 10,
    time: '7 mins ago'
  }
];

export default function AssetVaultView() {
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getJobs(50);
      if (res.success && res.data?.length > 0) {
        setJobs(res.data);
      }
    } catch (e) {
      console.warn('Using mock jobs for pipeline kanban:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const queuedJobs = jobs.filter(j => j.status === 'queued');
  const assemblingJobs = jobs.filter(j => j.status === 'assembling');
  const renderingJobs = jobs.filter(j => j.status === 'rendering');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Master Asset Vault & Pipeline Kanban</h1>
          <p className="admin-view-desc">
            End-to-end real-time observation of all user video generation jobs, raw asset downloads, and video playback.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={fetchJobs} className="admin-btn admin-btn-secondary">
            🔄 Refresh Pipeline
          </button>
        </div>
      </div>

      {/* 4-Stage Pipeline Kanban Board */}
      <div className="admin-kanban-board">
        {/* Stage 1: Queued */}
        <div className="admin-kanban-col">
          <div className="admin-kanban-header">
            <span>📝 Queued & Scripting</span>
            <span className="admin-badge admin-badge-secondary">{queuedJobs.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {queuedJobs.map(job => (
              <div key={job.id} className="admin-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-main)' }}>{job.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>{job.creator} • {job.time}</div>
                <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
                  <div className="admin-progress-fill" style={{ width: `${job.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 2: Assembling */}
        <div className="admin-kanban-col">
          <div className="admin-kanban-header">
            <span>🎙️ Media & Audio Assembly</span>
            <span className="admin-badge admin-badge-cyan">{assemblingJobs.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assemblingJobs.map(job => (
              <div key={job.id} className="admin-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-main)' }}>{job.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>ElevenLabs + Pexels • {job.time}</div>
                <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
                  <div className="admin-progress-fill" style={{ width: `${job.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 3: Rendering */}
        <div className="admin-kanban-col">
          <div className="admin-kanban-header">
            <span>⚡ Json2Video / Modal GPU</span>
            <span className="admin-badge admin-badge-purple">{renderingJobs.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {renderingJobs.map(job => (
              <div key={job.id} className="admin-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-main)' }}>{job.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>Rendering 1080x1920 • {job.progress}%</div>
                <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
                  <div className="admin-progress-fill" style={{ width: `${job.progress}%`, background: 'var(--admin-accent-purple)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 4: Completed */}
        <div className="admin-kanban-col">
          <div className="admin-kanban-header">
            <span>✅ Completed & Ready</span>
            <span className="admin-badge admin-badge-success">{completedJobs.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {completedJobs.map(job => (
              <div key={job.id} className="admin-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-main)' }}>{job.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>{job.creator} • {job.time}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveVideoModal(job)}
                    className="admin-btn admin-btn-primary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    ▶ Cinema Player
                  </button>
                  <a
                    href={job.videoUrl || '#'}
                    download
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}
                  >
                    📥 Raw MP4
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {activeVideoModal && (
        <div className="admin-modal-overlay" onClick={() => setActiveVideoModal(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                🎬 Cinema Preview: {activeVideoModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-sub)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ width: '100%', maxHeight: '420px', background: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
              <video
                src={activeVideoModal.videoUrl}
                controls
                autoPlay
                style={{ maxHeight: '400px', maxWidth: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '12px', color: 'var(--admin-text-sub)' }}>
              <span>Job ID: <code>{activeVideoModal.id}</code></span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={activeVideoModal.videoUrl} download className="admin-btn admin-btn-secondary" style={{ padding: '4px 10px' }}>
                  Download Video (MP4)
                </a>
                <a href={activeVideoModal.audioUrl} download className="admin-btn admin-btn-secondary" style={{ padding: '4px 10px' }}>
                  Download Voiceover (MP3)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
