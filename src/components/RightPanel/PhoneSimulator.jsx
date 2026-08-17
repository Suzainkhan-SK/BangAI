import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Music2, 
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function PhoneSimulator({
  scenes,
  activeSceneIndex,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  title,
  voiceName,
  musicName,
  visualStyle
}) {
  const [isMuted, setIsMuted] = useState(false);
  const activeScene = scenes[activeSceneIndex] || scenes[0];

  const currentSecondsInScene = (currentTime % 15).toFixed(1);

  // Background visual generator based on scene prompt / style
  const getSceneGradients = (idx) => {
    const gradients = [
      'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 60%, #020617 100%)', // Hook
      'radial-gradient(circle at 40% 40%, #1e293b 0%, #0f172a 60%, #020617 100%)', // Setup
      'radial-gradient(circle at 60% 40%, #311042 0%, #1e102f 60%, #05020a 100%)', // Build
      'radial-gradient(circle at 50% 50%, #450a0a 0%, #1c0505 60%, #000000 100%)', // Climax
      'radial-gradient(circle at 50% 70%, #064e3b 0%, #022c22 60%, #000000 100%)', // Resolution
    ];
    return gradients[idx % gradients.length];
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Title */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} color="#818cf8" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            Live 9:16 Simulator
          </span>
        </div>
        <span className="badge-pill badge-indigo">
          75s Preview
        </span>
      </div>

      {/* iPhone 16 Pro Vertical Frame */}
      <div className="phone-mockup-frame">
        {/* Dynamic Island */}
        <div className="phone-island">
          <div className="camera-dot" />
          <div className="speaker-bar" />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
        </div>

        {/* Video Canvas Container */}
        <div style={{
          width: '100%',
          height: '100%',
          background: getSceneGradients(activeSceneIndex),
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 14px 20px 14px',
          overflow: 'hidden'
        }}>
          {/* Animated Atmospheric Glow Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15), transparent 70%)',
            pointerEvents: 'none',
            animation: 'pulse-glow 4s infinite ease-in-out'
          }} />

          {/* Top Status inside Phone */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
              9:16 Vertical (1080×1920)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '10px',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#34d399',
                fontFamily: 'var(--font-mono)'
              }}>
                Scene {activeSceneIndex + 1}/5
              </span>
            </div>
          </div>

          {/* Center Stage: Dynamic Animated Subtitles */}
          <div style={{
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 10px',
            margin: 'auto 0'
          }}>
            {/* Visual Concept Tag */}
            <div style={{
              fontSize: '10px',
              color: 'var(--accent-cyan)',
              background: 'rgba(6, 182, 212, 0.15)',
              padding: '3px 8px',
              borderRadius: '6px',
              marginBottom: '10px',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              🎬 {activeScene?.cameraMotion || 'Cinematic Shot'}
            </div>

            {/* Dynamic Spoken Caption */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.75)',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)'
            }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '14px',
                lineHeight: 1.4,
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0,0,0,0.9)'
              }}>
                "{activeScene?.voiceoverText || 'Generating screenplay scene narration...'}"
              </p>
            </div>
          </div>

          {/* YouTube Shorts UI Right Sidebar Actions */}
          <div style={{
            position: 'absolute',
            right: '10px',
            bottom: '75px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            zIndex: 20
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <ThumbsUp size={18} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600 }}>124K</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <MessageSquare size={18} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600 }}>1.4K</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Share2 size={18} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600 }}>Share</span>
            </div>
          </div>

          {/* Bottom Info inside Phone */}
          <div style={{ zIndex: 10 }}>
            {/* Title */}
            <div style={{
              fontWeight: 700,
              fontSize: '12px',
              color: '#ffffff',
              marginBottom: '4px',
              lineHeight: 1.3,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
            }}>
              {title}
            </div>

            {/* Audio Track Tag */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: 'var(--text-secondary)'
            }}>
              <Music2 size={11} color="var(--accent-cyan)" />
              <span>{musicName} • {voiceName} AI</span>
            </div>
          </div>

          {/* Bottom Red Progress Line */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              height: '100%',
              width: `${(currentTime / 75) * 100}%`,
              background: '#ef4444'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
