import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';

export default function ThinkingAccordion({ thoughtText, duration = '2s', isThinking = false, thinkingTime = 1 }) {
  const [expanded, setExpanded] = useState(false);

  // If thinking is actively in progress
  if (isThinking) {
    return (
      <div style={{
        margin: '6px 0 12px 0',
        borderRadius: '10px',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        background: 'rgba(168, 85, 247, 0.06)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'pulse 1.8s infinite'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Brain size={12} color="#a855f7" className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#a855f7' }}>
            Thinking... ({thinkingTime}s)
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.8 }}>
          Deep reasoning effort: High
        </span>
      </div>
    );
  }

  const defaultThought = thoughtText || `1. Deconstructed creator query for core intent and platform constraints.
2. Cross-referenced viral retention heuristics (3-second hook gap + 5-scene golden blueprint).
3. Evaluated audience psychological triggers and high-CTR phrasing.
4. Formatted actionable output with viral camera cues and production notes.`;

  return (
    <div style={{
      margin: '6px 0 12px 0',
      borderRadius: '10px',
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-card)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)',
      transition: 'border-color 0.15s ease'
    }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Brain size={13} color="#a855f7" />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Thought for {duration}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{expanded ? 'Hide reasoning' : 'Show reasoning'}</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: '10px 14px 12px 14px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          borderTop: '1px solid var(--border-subtle)',
          whiteSpace: 'pre-wrap',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          background: 'var(--bg-input)',
          maxHeight: '320px',
          overflowY: 'auto'
        }}>
          {defaultThought}
        </div>
      )}
    </div>
  );
}
