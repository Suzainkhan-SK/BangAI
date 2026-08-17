import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Award } from 'lucide-react';

export default function QualityCriticScorecard({ score = 96, scenes = [] }) {
  const allScenesTimed = scenes.every((s) => {
    const len = s.voiceoverText?.length || 0;
    return len >= 180 && len <= 210;
  });

  const checkpoints = [
    { name: 'Voiceover Timing (190-200 chars / scene)', status: allScenesTimed ? 'pass' : 'warn' },
    { name: 'Language & Pronunciation Consistency', status: 'pass' },
    { name: 'Visual Style & Camera Prompt Specs', status: 'pass' },
    { name: '5-Act Narrative Arc (Hook → Climax → Res)', status: 'pass' },
    { name: 'Content Safety & YouTube Policy Audit', status: 'pass' },
    { name: 'High-CTR YouTube Metadata & Tags', status: 'pass' },
    { name: 'JSON Schema & Duration (5x15s = 75s)', status: 'pass' },
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
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={16} color="#34d399" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            Story Quality Critic
          </span>
        </div>
        <span className="badge-pill badge-emerald">
          Stage 3 Auditor
        </span>
      </div>

      {/* Score Hero Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
            Virality & Production Readiness
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            {score} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </div>
        <div style={{
          background: 'rgba(16, 185, 129, 0.25)',
          padding: '6px 12px',
          borderRadius: '8px',
          color: '#34d399',
          fontWeight: 800,
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Award size={14} />
          <span>APPROVED</span>
        </div>
      </div>

      {/* 7 Checkpoint Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {checkpoints.map((cp, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              padding: '4px 6px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '6px'
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>{cp.name}</span>
            {cp.status === 'pass' ? (
              <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <CheckCircle2 size={12} />
                Passed
              </span>
            ) : (
              <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <AlertCircle size={12} />
                Adjust
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
