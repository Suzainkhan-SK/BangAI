import React, { useState } from 'react';
import { Copy, Check, Hash, FileText } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function YouTubeMetadataInspector({
  title,
  setTitle,
  description,
  setDescription,
  tags,
  corePlot
}) {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, section) => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            YouTube SEO & Metadata
          </span>
        </div>
        <span className="badge-pill badge-amber">
          High CTR Pack
        </span>
      </div>

      {/* Video Title */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>High-CTR Title (60-90 chars):</span>
          <button
            onClick={() => copyToClipboard(title, 'title')}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
          >
            {copiedSection === 'title' ? <Check size={11} /> : <Copy size={11} />}
            {copiedSection === 'title' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(10, 15, 26, 0.8)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '8px 10px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            outline: 'none'
          }}
        />
      </div>

      {/* Structured Description */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>Structured Description ({description.length} chars):</span>
          <button
            onClick={() => copyToClipboard(description, 'desc')}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
          >
            {copiedSection === 'desc' ? <Check size={11} /> : <Copy size={11} />}
            {copiedSection === 'desc' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(10, 15, 26, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 10px',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.4,
            resize: 'vertical',
            outline: 'none'
          }}
        />
      </div>

      {/* Tag Cloud */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Tags & Hashtags ({tags.length}):</span>
          <button
            onClick={() => copyToClipboard(tags.join(', '), 'tags')}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
          >
            {copiedSection === 'tags' ? <Check size={11} /> : <Copy size={11} />}
            {copiedSection === 'tags' ? 'Copied' : 'Copy All'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {tags.map((tag, i) => (
            <span
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '2px 7px',
                borderRadius: '5px',
                fontSize: '10.5px'
              }}
            >
              #{tag.replace(/\s+/g, '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
