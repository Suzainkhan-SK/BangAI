import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function WebSearchSources({ webSearch, highlightedIndex = null }) {
  const [expanded, setExpanded] = useState(false);

  if (!webSearch || !Array.isArray(webSearch.results) || webSearch.results.length === 0) {
    return null;
  }

  const results = webSearch.results;
  const count = results.length;

  return (
    <div style={{
      margin: '8px 0 14px 0',
      borderRadius: '12px',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      background: 'rgba(99, 102, 241, 0.05)',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '12.5px',
          fontWeight: 600,
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Globe size={11} />
          </div>
          <span style={{ color: 'var(--text-primary)' }}>
            Searched {count} live web {count === 1 ? 'source' : 'sources'}
          </span>
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '99px',
            background: 'rgba(14, 165, 233, 0.15)',
            color: '#38bdf8',
            fontWeight: 700
          }}>
            LIVE DATA
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>{expanded ? 'Hide sources' : 'Show sources'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded Sources Grid */}
      {expanded && (
        <div style={{
          padding: '4px 12px 12px 12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '8px',
          borderTop: '1px solid rgba(99, 102, 241, 0.12)'
        }}>
          {results.map((src, idx) => {
            const num = idx + 1;
            let domain = '';
            try {
              if (src.url) {
                const u = new URL(src.url);
                domain = u.hostname.replace(/^www\./, '');
              }
            } catch (e) {
              domain = 'web';
            }

            const isHighlighted = highlightedIndex === String(num);

            return (
              <a
                key={idx}
                href={src.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  background: isHighlighted ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${isHighlighted ? 'var(--accent-primary, #818cf8)' : 'var(--border-subtle)'}`,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary, #6366f1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isHighlighted ? 'var(--accent-primary, #818cf8)' : 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--accent-primary, #6366f1)',
                      flexShrink: 0
                    }}>
                      [{num}]
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {domain}
                    </span>
                  </div>
                  <ExternalLink size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.3
                }}>
                  {src.title || src.name || 'Web Article'}
                </div>

                {src.snippet && (
                  <div style={{
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3
                  }}>
                    {src.snippet}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
