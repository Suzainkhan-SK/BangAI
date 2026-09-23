import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    try { audioEngine.playSfx('click'); } catch (e) {}
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      margin: '12px 0',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#0d1117',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#161b22',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11px',
        color: '#8b949e',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: copied ? '#10b981' : '#c9d1d9',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
          title="Copy code"
        >
          {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '12px 14px',
        overflowX: 'auto',
        fontSize: '13px',
        lineHeight: 1.5,
        color: '#e6edf3'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseMarkdown(text) {
  if (!text || typeof text !== 'string') return [];

  // Split text by fenced code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'plaintext',
      code: match[2].trimEnd()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return blocks;
}

function renderFormattedParagraph(para, onCitationClick) {
  // Check if paragraph is a table (contains lines with |)
  const lines = para.split('\n');
  const isTable = lines.length >= 2 && lines[0].includes('|') && lines[1].includes('|') && lines[1].includes('-');

  if (isTable) {
    const headerCells = lines[0].split('|').map(c => c.trim()).filter((c, i, a) => (i > 0 && i < a.length - 1) || c.length > 0);
    const bodyRows = lines.slice(2).filter(l => l.includes('|')).map(row => 
      row.split('|').map(c => c.trim()).filter((c, i, a) => (i > 0 && i < a.length - 1) || c.length > 0)
    );

    return (
      <div style={{ overflowX: 'auto', margin: '14px 0' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ background: 'var(--bg-pill)' }}>
              {headerCells.map((h, i) => (
                <th key={i} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-medium)', textAlign: 'left', fontWeight: 650, color: 'var(--text-primary)' }}>
                  {renderInlineFormatting(h, onCitationClick)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((r, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>
                {r.map((c, ci) => (
                  <td key={ci} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {renderInlineFormatting(c, onCitationClick)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Check headers: #, ##, ###
  if (lines[0].startsWith('### ')) {
    return (
      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '14px 0 6px 0', color: 'var(--text-primary)' }}>
        {renderInlineFormatting(para.replace(/^###\s+/, ''), onCitationClick)}
      </h3>
    );
  }
  if (lines[0].startsWith('## ')) {
    return (
      <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '18px 0 8px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', paddingBottom: '4px' }}>
        {renderInlineFormatting(para.replace(/^##\s+/, ''), onCitationClick)}
      </h2>
    );
  }
  if (lines[0].startsWith('# ')) {
    return (
      <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '20px 0 10px 0', color: 'var(--text-primary)' }}>
        {renderInlineFormatting(para.replace(/^#\s+/, ''), onCitationClick)}
      </h1>
    );
  }

  // Blockquotes: > quote
  if (lines[0].startsWith('> ')) {
    return (
      <blockquote style={{
        margin: '10px 0',
        padding: '8px 14px',
        borderLeft: '3px solid #6366f1',
        background: 'rgba(99, 102, 241, 0.08)',
        borderRadius: '0 8px 8px 0',
        color: 'var(--text-secondary)'
      }}>
        {lines.map((l, idx) => (
          <div key={idx}>{renderInlineFormatting(l.replace(/^>\s*/, ''), onCitationClick)}</div>
        ))}
      </blockquote>
    );
  }

  // Standard paragraph or list
  return (
    <div style={{ margin: '8px 0', lineHeight: 1.6 }}>
      {lines.map((line, li) => {
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const isNumbered = /^\d+\.\s/.test(line.trim());

        if (isBullet) {
          return (
            <div key={li} style={{ display: 'flex', gap: '8px', paddingLeft: '8px', margin: '3px 0' }}>
              <span style={{ color: '#818cf8', fontWeight: 'bold' }}>•</span>
              <div style={{ flex: 1 }}>{renderInlineFormatting(line.trim().replace(/^[-*]\s+/, ''), onCitationClick)}</div>
            </div>
          );
        }

        if (isNumbered) {
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          return (
            <div key={li} style={{ display: 'flex', gap: '8px', paddingLeft: '8px', margin: '3px 0' }}>
              <span style={{ color: '#818cf8', fontWeight: 700, minWidth: '18px' }}>{numMatch ? numMatch[1] + '.' : '1.'}</span>
              <div style={{ flex: 1 }}>{renderInlineFormatting(numMatch ? numMatch[2] : line, onCitationClick)}</div>
            </div>
          );
        }

        return (
          <span key={li}>
            {renderInlineFormatting(line, onCitationClick)}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(rawText, onCitationClick) {
  if (!rawText) return null;

  const parts = [];
  let lastIdx = 0;

  // Combined regex for markdown inline patterns
  const tokenRegex = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\[(\d+)\])/g;
  let m;

  while ((m = tokenRegex.exec(rawText)) !== null) {
    if (m.index > lastIdx) {
      parts.push({ type: 'text', val: rawText.substring(lastIdx, m.index) });
    }

    const token = m[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push({ type: 'bold', val: token.slice(2, -2) });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push({ type: 'inlineCode', val: token.slice(1, -1) });
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push({ type: 'link', text: linkMatch[1], href: linkMatch[2] });
      } else {
        parts.push({ type: 'text', val: token });
      }
    } else if (/^\[\d+\]$/.test(token)) {
      const num = token.slice(1, -1);
      parts.push({ type: 'citation', num });
    } else {
      parts.push({ type: 'text', val: token });
    }

    lastIdx = m.index + token.length;
  }

  if (lastIdx < rawText.length) {
    parts.push({ type: 'text', val: rawText.substring(lastIdx) });
  }

  return parts.map((part, i) => {
    if (part.type === 'bold') {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{part.val}</strong>;
    }
    if (part.type === 'inlineCode') {
      return (
        <code key={i} style={{
          background: 'var(--bg-pill)',
          border: '1px solid var(--border-subtle)',
          padding: '2px 5px',
          borderRadius: '4px',
          fontSize: '0.88em',
          fontFamily: 'Consolas, Monaco, monospace',
          color: 'var(--accent-primary, #6366f1)',
          fontWeight: 500
        }}>
          {part.val}
        </code>
      );
    }
    if (part.type === 'link') {
      return (
        <a
          key={i}
          href={part.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-primary, #4f46e5)',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          {part.text}
          <ExternalLink size={10} style={{ opacity: 0.7 }} />
        </a>
      );
    }
    if (part.type === 'citation') {
      return (
        <button
          key={i}
          type="button"
          onClick={() => { if (typeof onCitationClick === 'function') onCitationClick(part.num); }}
          style={{
            background: 'rgba(99, 102, 241, 0.14)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: 'var(--accent-primary, #6366f1)',
            borderRadius: '99px',
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 5px',
            margin: '0 2px',
            cursor: 'pointer',
            lineHeight: 1,
            display: 'inline-block',
            verticalAlign: 'super',
            transition: 'all 0.15s ease'
          }}
          title={`View source [${part.num}]`}
        >
          {part.num}
        </button>
      );
    }
    return <span key={i}>{part.val}</span>;
  });
}

export default function ChatMessageContent({ content, onCitationClick }) {
  if (!content) return null;

  const blocks = parseMarkdown(content);

  return (
    <div className="chat-markdown-content" style={{ fontSize: '14.5px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.code} language={block.language} />;
        }
        const paragraphs = block.content.split(/\n\s*\n/);
        return (
          <div key={idx}>
            {paragraphs.map((para, pi) => (
              <React.Fragment key={pi}>
                {renderFormattedParagraph(para.trim(), onCitationClick)}
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
}
