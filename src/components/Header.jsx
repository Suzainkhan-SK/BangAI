import React from 'react';
import { 
  Sparkles, 
  Layers, 
  Play, 
  Share2, 
  Sliders, 
  Flame, 
  Zap, 
  FolderArchive,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { PRESETS } from '../data/presets';
import { audioEngine } from '../audio/audioEngine';

export default function Header({ 
  activePresetId, 
  onSelectPreset, 
  onGenerate, 
  isGenerating,
  onOpenVault,
  onOpenQueue,
  queueCount = 0
}) {
  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'rgba(10, 15, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'relative',
      zIndex: 40
    }}>
      {/* Brand & AI Engine Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-primary)'
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '17px',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              VIRAL GENESIS <span style={{ 
                fontSize: '11px', 
                background: 'rgba(99, 102, 241, 0.25)', 
                color: '#818cf8', 
                padding: '2px 7px', 
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}>STUDIO PRO</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Grok Imagine 1.5 • Gemini 2.5 • ElevenLabs v2
            </div>
          </div>
        </div>

        {/* Quick Inspiration Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Presets:
          </span>
          {Object.values(PRESETS).map((p) => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  audioEngine.playSfx('click');
                  onSelectPreset(p.id);
                }}
                style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {p.id === 'bermuda' && '🌊'}
                {p.id === 'dragons' && '🐉'}
                {p.id === 'fruits' && '🍍'}
                {p.id === 'tatasteve' && '💔'}
                {p.name.split(':')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Pipeline Queue Modal Button */}
        <button 
          onClick={() => {
            audioEngine.playSfx('click');
            onOpenQueue();
          }}
          className="btn-secondary"
        >
          <Cpu size={15} color="#06b6d4" />
          <span>Pipeline Log</span>
          {queueCount > 0 && (
            <span style={{
              background: '#06b6d4',
              color: '#000000',
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '99px'
            }}>
              {queueCount}
            </span>
          )}
        </button>

        {/* Asset Vault Button */}
        <button 
          onClick={() => {
            audioEngine.playSfx('click');
            onOpenVault();
          }}
          className="btn-secondary"
        >
          <FolderArchive size={15} color="#8b5cf6" />
          <span>Asset Vault</span>
        </button>

        {/* Main Generate Button */}
        <button
          onClick={() => {
            audioEngine.playSfx('boom');
            onGenerate();
          }}
          disabled={isGenerating}
          className="btn-primary animated-pulse-glow"
          style={{
            padding: '9px 22px',
            fontSize: '14px'
          }}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={16} className="spin-animation" />
              <span>Generating 5 Scenes (75s)...</span>
            </>
          ) : (
            <>
              <Zap size={16} color="#ffffff" fill="#ffffff" />
              <span>⚡ Generate Full Short (75s)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
