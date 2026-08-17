import React from 'react';
import { X, FolderArchive, Play, Download, ExternalLink, Calendar, Film } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function AssetVault({ isOpen, onClose, onSelectShort }) {
  const vaultItems = [
    {
      id: 'v1',
      title: 'Bermuda Triangle: Flight 19 का खौफनाक सच! 😱',
      date: '2026-08-16 18:40',
      genre: 'Mystery & Thriller',
      style: 'Cinematic Realistic',
      duration: '75s (5 Scenes)',
      views: '124,500',
      status: 'Uploaded to YouTube',
      gradient: 'radial-gradient(circle, #1e1b4b 0%, #020617 100%)'
    },
    {
      id: 'v2',
      title: 'Dragons: The Secret War Nobody Knew! 🐉',
      date: '2026-08-15 21:10',
      genre: 'Mythology & Legends',
      style: 'Cinematic CGI Epic',
      duration: '75s (5 Scenes)',
      views: '340,100',
      status: 'Uploaded to YouTube',
      gradient: 'radial-gradient(circle, #311042 0%, #05020a 100%)'
    },
    {
      id: 'v3',
      title: 'Talking Pineapple: Supermarket Escape! 🍍😂',
      date: '2026-08-14 15:30',
      genre: 'Animated Comedy',
      style: 'Pixar 3D Animated',
      duration: '75s (5 Scenes)',
      views: '890,200',
      status: 'Uploaded to YouTube',
      gradient: 'radial-gradient(circle, #451a03 0%, #0c0a09 100%)'
    },
    {
      id: 'v4',
      title: 'Ratan Tata के आखिरी 24 घंटे: एक युग का अंत 💔',
      date: '2026-08-13 12:00',
      genre: 'Historical & Biography',
      style: 'Realistic Archival',
      duration: '75s (5 Scenes)',
      views: '1,420,000',
      status: 'Uploaded to YouTube',
      gradient: 'radial-gradient(circle, #1c1917 0%, #000000 100%)'
    }
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-glow)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13, 18, 31, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderArchive size={16} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px' }}>
                Asset Vault & Generated Library
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                4 Production Master Shorts • All 4K 9:16 Vertical Assets
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onClose();
            }}
            className="btn-icon"
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid of items */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {vaultItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              {/* Mini 9:16 Thumbnail */}
              <div style={{
                width: '65px',
                height: '115px',
                borderRadius: '8px',
                background: item.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--border-medium)',
                position: 'relative'
              }}>
                <Play size={20} color="#ffffff" fill="#ffffff" />
                <span style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  fontSize: '9px',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  color: '#ffffff'
                }}>
                  75s
                </span>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff', lineHeight: 1.3, marginBottom: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginBottom: '2px' }}>
                    {item.genre} • {item.style}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={11} />
                    {item.date}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span className="badge-pill badge-emerald" style={{ fontSize: '10px' }}>
                    {item.views} views
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        audioEngine.playSfx('click');
                        alert(`Downloading 4K MP4 Master: ${item.title}`);
                      }}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Download MP4"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        audioEngine.playSfx('click');
                        window.open('https://youtube.com/shorts', '_blank');
                      }}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Watch on YouTube"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(13, 18, 31, 0.9)'
        }}>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onClose();
            }}
            className="btn-secondary"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
