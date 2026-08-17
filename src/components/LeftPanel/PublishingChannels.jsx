import React from 'react';
import { Share2, Send, Check } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function PublishingChannels({ platforms, setPlatforms }) {
  const togglePlatform = (id) => {
    audioEngine.playSfx('click');
    setPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const channelList = [
    {
      id: 'youtube',
      name: 'YouTube Shorts',
      sub: 'Auto-upload + Pinned Comment',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: '#ef4444'
    },
    {
      id: 'instagram',
      name: 'Instagram Reels',
      sub: '9:16 Vertical Video Queue',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ec4899">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: '#ec4899'
    },
    {
      id: 'tiktok',
      name: 'TikTok Video',
      sub: 'Viral Sound Hook Format',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#06b6d4">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.33 6.33 0 0 0 1.86-4.47V8.71a8.28 8.28 0 0 0 4.91 1.6V6.86a4.83 4.83 0 0 1-1-.17z"/>
        </svg>
      ),
      color: '#06b6d4'
    },
    {
      id: 'telegram',
      name: 'Telegram Broadcast',
      sub: 'MP4 File + Story Brief Card',
      icon: <Send size={16} color="#3b82f6" />,
      color: '#3b82f6'
    }
  ];

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(236, 72, 153, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Share2 size={16} color="#ec4899" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            Multi-Platform Syndication
          </span>
        </div>
        <span className="badge-pill badge-indigo">
          Auto-Deploy
        </span>
      </div>

      {/* Grid of channels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {channelList.map((ch) => {
          const isEnabled = platforms[ch.id];
          return (
            <div
              key={ch.id}
              onClick={() => togglePlatform(ch.id)}
              style={{
                background: isEnabled ? 'rgba(30, 41, 69, 0.9)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isEnabled ? ch.color : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ch.icon}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#ffffff' }}>
                    {ch.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {ch.sub.split('+')[0]}
                  </div>
                </div>
              </div>

              {/* Toggle switch visual */}
              <div style={{
                width: '32px',
                height: '18px',
                borderRadius: '99px',
                background: isEnabled ? ch.color : 'rgba(255, 255, 255, 0.15)',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: isEnabled ? '16px' : '2px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
