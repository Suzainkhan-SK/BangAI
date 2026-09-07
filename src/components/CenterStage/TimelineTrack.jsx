import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Music, Type, Video } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function TimelineTrack({
  scenes,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  activeSceneIndex,
  setActiveSceneIndex,
  voiceName,
  musicName
}) {
  const sceneList = Array.isArray(scenes) && scenes.length > 0 ? scenes : [];
  const sceneCount = sceneList.length || 5;
  const totalSeconds = sceneCount * 15;

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 0.25;
          const currentSceneIdx = Math.min(Math.floor(next / 15), Math.max(0, sceneCount - 1));
          setActiveSceneIndex(currentSceneIdx);
          return next;
        });
      }, 250);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setActiveSceneIndex, setCurrentTime]);

  const handleTogglePlay = () => {
    audioEngine.playSfx('click');
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    audioEngine.playSfx('click');
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveSceneIndex(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms}`;
  };

  const progressPercent = (currentTime / totalSeconds) * 100;

  return (
    <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Controls & Timecode */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            style={{
              background: isPlaying ? 'var(--accent-amber)' : 'var(--grad-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {isPlaying ? <Pause size={14} fill="#ffffff" /> : <Play size={14} fill="#ffffff" />}
            <span>{isPlaying ? 'Pause' : 'Play Stream'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            title="Rewind to 0:00"
          >
            <RotateCcw size={14} />
          </button>

          {/* Timecode display */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 700,
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            color: 'var(--accent-cyan)'
          }}>
            {formatTime(currentTime)} <span style={{ color: 'var(--text-muted)' }}>/ {formatTime(totalSeconds)}</span>
          </div>
        </div>

        {/* Current Active Scene Pill */}
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Current Scene:</span>
          <span style={{
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            padding: '2px 8px',
            borderRadius: '6px',
            fontWeight: 700
          }}>
            Scene {activeSceneIndex + 1} ({scenes[activeSceneIndex]?.act || 'Hook'})
          </span>
        </div>
      </div>

      {/* Multi-Track Timeline Canvas */}
      <div style={{
        position: 'relative',
        background: 'rgba(6, 10, 18, 0.95)',
        border: '1px solid var(--border-medium)',
        borderRadius: '10px',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'pointer',
        overflow: 'hidden'
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left - 10;
        const width = rect.width - 20;
        const newSecs = Math.max(0, Math.min(totalSeconds, (clickX / width) * totalSeconds));
        setCurrentTime(newSecs);
        setActiveSceneIndex(Math.min(Math.floor(newSecs / 15), Math.max(0, sceneCount - 1)));
      }}
      >
        {/* Playhead Needle */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `calc(10px + ${progressPercent} * (100% - 20px) / 100)`,
          width: '2px',
          background: '#ef4444',
          boxShadow: '0 0 8px #ef4444',
          zIndex: 30,
          pointerEvents: 'none'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#ef4444',
            borderRadius: '50%',
            transform: 'translateX(-3px)'
          }} />
        </div>

        {/* Track 1: Video Scene Blocks (5x 15s) */}
        <div style={{ display: 'flex', gap: '4px', height: '24px', alignItems: 'center' }}>
          <div style={{ width: '65px', fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Video size={10} color="#818cf8" />
            <span>Video ({sceneCount})</span>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${sceneCount}, 1fr)`, gap: '4px', height: '100%' }}>
            {scenes.map((s, idx) => {
              const isCurrent = activeSceneIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: isCurrent ? 'var(--grad-primary)' : 'rgba(99, 102, 241, 0.15)',
                    border: `1px solid ${isCurrent ? '#818cf8' : 'rgba(99, 102, 241, 0.3)'}`,
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                >
                  S{idx + 1} (15s)
                </div>
              );
            })}
          </div>
        </div>

        {/* Track 2: Voiceover Audio */}
        <div style={{ display: 'flex', gap: '4px', height: '20px', alignItems: 'center' }}>
          <div style={{ width: '65px', fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Volume2 size={10} color="#34d399" />
            <span>Voice</span>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '5px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#34d399'
          }}>
            <span>ElevenLabs: {voiceName}</span>
            <span>44.1kHz • Normalized</span>
          </div>
        </div>

        {/* Track 3: BGM Ducking Track */}
        <div style={{ display: 'flex', gap: '4px', height: '20px', alignItems: 'center' }}>
          <div style={{ width: '65px', fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Music size={10} color="#06b6d4" />
            <span>BGM</span>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '5px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#67e8f9'
          }}>
            <span>BGM: {musicName}</span>
            <span>-18dB Ducked Curve</span>
          </div>
        </div>

        {/* Track 4: Dynamic Subtitles */}
        <div style={{ display: 'flex', gap: '4px', height: '18px', alignItems: 'center' }}>
          <div style={{ width: '65px', fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Type size={10} color="#f59e0b" />
            <span>Subtitles</span>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '5px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            fontSize: '9.5px',
            color: '#fbbf24'
          }}>
            <span>Word-by-word Animated Captions (Yellow/White Pop)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
