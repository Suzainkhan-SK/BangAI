import React from 'react';
import { Film, Plus, RefreshCw, Wand2, Sparkles, CheckCheck } from 'lucide-react';
import SceneCard from './SceneCard';
import { audioEngine } from '../../audio/audioEngine';

export default function StoryboardEditor({
  scenes,
  voiceId,
  visualStyle,
  onUpdateScene,
  activeSceneIndex,
  setActiveSceneIndex,
  onAutoFixAll
}) {
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 15), 0);
  const totalChars = scenes.reduce((acc, s) => acc + (s.voiceoverText?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header bar */}
      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Film size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px' }}>
              5-Scene Storyboard & Timeline Editor
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              5 Scenes × 15s = {totalDuration}s Total • {totalChars} Total Characters
            </div>
          </div>
        </div>

        {/* Auto-Fix Button (Critic Simulation) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              audioEngine.playSfx('success');
              onAutoFixAll();
            }}
            className="btn-secondary"
            style={{
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.08)'
            }}
          >
            <Sparkles size={14} color="#34d399" />
            <span>Auto-Optimize Timing (190-200 chars)</span>
          </button>
        </div>
      </div>

      {/* List of 5 Scene Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {scenes.map((scene, idx) => (
          <SceneCard
            key={scene.sceneNumber || idx}
            scene={scene}
            index={idx}
            voiceId={voiceId}
            visualStyle={visualStyle}
            onUpdateScene={onUpdateScene}
            isActiveScene={activeSceneIndex === idx}
            onSelectActive={setActiveSceneIndex}
          />
        ))}
      </div>
    </div>
  );
}
