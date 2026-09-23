import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function ThinkingAccordion({ thoughtText, duration = '2s' }) {
  const [expanded, setExpanded] = useState(false);

  const defaultThought = thoughtText || `1. Deconstructed creator query for core intent and platform constraints.
2. Cross-referenced viral retention heuristics (3-second hook gap + 5-scene golden blueprint).
3. Evaluated audience psychological triggers and high-CTR phrasing.
4. Formatted actionable output with viral camera cues and production notes.`;

  return (
    <div style={{
      margin: '6px 0 12px 0',
      borderRadius: '8px',
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-card)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Brain size={13} color="#a855f7" />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Thought for {duration}</span>
        </div>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div style={{
          padding: '8px 12px 10px 12px',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          borderTop: '1px solid var(--border-subtle)',
          whiteSpace: 'pre-line',
          fontFamily: 'Consolas, Monaco, monospace'
        }}>
          {defaultThought}
        </div>
      )}
    </div>
  );
}
