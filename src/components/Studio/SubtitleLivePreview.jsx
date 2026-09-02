import React, { useState, useEffect, useMemo, useRef } from 'react';
import { normalizeSubtitleStyle, normalizeSubtitlePosition } from '../../lib/json2videoSubtitles.js';

export default function SubtitleLivePreview({
  subtitleSettings = {},
  text = 'Watch how these animated subtitles boost your viewer retention by 300%!'
}) {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const containerRef = useRef(null);

  const cleanText = (text || 'Watch how these animated subtitles boost your viewer retention by 300%!').trim();
  const words = useMemo(() => cleanText.split(/\s+/).filter(Boolean), [cleanText]);

  const style = normalizeSubtitleStyle(subtitleSettings.style);
  const position = normalizeSubtitlePosition(subtitleSettings.position);
  const maxWords = Math.max(1, Number(subtitleSettings.maxWordsPerLine) || 3);
  const isOneWord = style === 'classic-one-word';

  // Chunk words into groups of maxWordsPerLine
  const chunks = useMemo(() => {
    if (isOneWord) return words.map(w => [w]);
    const res = [];
    for (let i = 0; i < words.length; i += maxWords) {
      res.push(words.slice(i, i + maxWords));
    }
    return res.length > 0 ? res : [['Preview']];
  }, [words, maxWords, isOneWord]);

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const handler = (e) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  // Animate active word cursor (~350ms per word)
  useEffect(() => {
    if (prefersReducedMotion || words.length === 0) return;
    const interval = setInterval(() => {
      setActiveWordIndex(prev => (prev + 1) % words.length);
    }, 350);
    return () => clearInterval(interval);
  }, [words.length, prefersReducedMotion]);

  // Determine which chunk is currently visible and word index inside that chunk
  const currentChunkIndex = useMemo(() => {
    if (prefersReducedMotion) return 0;
    if (isOneWord) return activeWordIndex % chunks.length;
    let accumulated = 0;
    for (let i = 0; i < chunks.length; i++) {
      accumulated += chunks[i].length;
      if (activeWordIndex < accumulated) return i;
    }
    return 0;
  }, [activeWordIndex, chunks, isOneWord, prefersReducedMotion]);

  const currentChunk = chunks[currentChunkIndex] || chunks[0] || ['Preview'];
  const chunkStartWordIndex = useMemo(() => {
    if (isOneWord) return currentChunkIndex;
    let acc = 0;
    for (let i = 0; i < currentChunkIndex; i++) acc += chunks[i].length;
    return acc;
  }, [chunks, currentChunkIndex, isOneWord]);

  // Styling & scaling
  const frameWidth = 270;
  const scale = frameWidth / 1080; // ~0.25

  const rawFontSize = Number(subtitleSettings.fontSize) || 78;
  const clampedFontSize = Math.max(56, Math.min(150, Math.round(rawFontSize)));
  const scaledFontSize = Math.max(12, Math.round(clampedFontSize * scale));

  const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
  const fontFamily = hasDevanagari ? 'Noto Sans Devanagari' : (subtitleSettings.fontFamily || 'Montserrat');
  const allCaps = hasDevanagari ? false : (subtitleSettings.allCaps !== false);
  const wordColor = subtitleSettings.wordColor || '#FFE600';
  const lineColor = subtitleSettings.lineColor || '#FFFFFF';
  const outlineColor = subtitleSettings.outlineColor || '#000000';
  const outlineWidth = Number(subtitleSettings.outlineWidth !== undefined ? subtitleSettings.outlineWidth : 8);
  const scaledOutlineWidth = Math.max(0, Math.round(outlineWidth * scale));
  const boxColor = subtitleSettings.boxColor || 'rgba(0,0,0,0.75)';
  const shadowColor = subtitleSettings.shadowColor || '#000000';
  const shadowOffset = Number(subtitleSettings.shadowOffset) || 0;
  const scaledShadowOffset = Math.round(shadowOffset * scale);

  // Position placement (top percentage and alignment)
  let topPercent = '78%';
  let textAlign = 'center';
  let alignItems = 'center';

  if (position.startsWith('top-')) topPercent = '12%';
  else if (position === 'mid-top-center') topPercent = '25%';
  else if (position.startsWith('center-')) topPercent = '50%';
  else if (position === 'mid-bottom-center') topPercent = '78%';
  else if (position.startsWith('bottom-')) topPercent = '88%';

  if (position.endsWith('-left')) {
    textAlign = 'left';
    alignItems = 'flex-start';
  } else if (position.endsWith('-right')) {
    textAlign = 'right';
    alignItems = 'flex-end';
  }

  const textShadowStyle = (shadowOffset > 0 && shadowColor)
    ? `${scaledShadowOffset}px ${scaledShadowOffset}px ${Math.round(scaledShadowOffset * 1.5)}px ${shadowColor}`
    : 'none';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      margin: '12px 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.02em',
        textTransform: 'uppercase'
      }}>
        <span>📱 Live preview — matches burned-in subtitles</span>
      </div>

      {/* 9:16 Mock Phone Screen */}
      <div
        ref={containerRef}
        style={{
          width: `${frameWidth}px`,
          height: `${Math.round(frameWidth * (16 / 9))}px`,
          background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
          borderRadius: '24px',
          border: '2px solid var(--border-subtle, rgba(255,255,255,0.12))',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5), inset 0 0 24px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Subtle camera punch hole */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '10px',
          height: '10px',
          background: '#000',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)',
          zIndex: 5
        }} />

        {/* Ambient video simulation backdrop */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Subtitle layer */}
        <div style={{
          position: 'absolute',
          top: topPercent,
          left: '12px',
          right: '12px',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: alignItems,
          textAlign: textAlign,
          pointerEvents: 'none',
          zIndex: 3
        }}>
          <div style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            justifyContent: textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center'),
            gap: style === 'boxed-word' ? '4px' : '6px',
            padding: style === 'boxed-line' ? '6px 12px' : '2px 4px',
            background: style === 'boxed-line' ? boxColor : 'transparent',
            borderRadius: style === 'boxed-line' ? '8px' : '0',
            fontFamily: fontFamily,
            fontSize: `${scaledFontSize}px`,
            fontWeight: 900,
            lineHeight: 1.25,
            textTransform: allCaps ? 'uppercase' : 'none',
            textShadow: textShadowStyle,
            WebkitTextStroke: scaledOutlineWidth > 0 ? `${scaledOutlineWidth}px ${outlineColor}` : 'none',
            paintOrder: 'stroke fill',
            transition: 'all 0.15s ease'
          }}>
            {currentChunk.map((word, idx) => {
              const globalWordIdx = chunkStartWordIndex + idx;
              const isCurrent = globalWordIdx === activeWordIndex;
              const isPast = globalWordIdx <= activeWordIndex;

              let wordCol = lineColor;
              let bg = 'transparent';
              let pad = '0';
              let br = '0';

              if (style === 'classic') {
                wordCol = lineColor;
              } else if (style === 'classic-progressive') {
                wordCol = (isPast || prefersReducedMotion) ? wordColor : lineColor;
              } else if (style === 'classic-one-word') {
                wordCol = wordColor;
              } else if (style === 'boxed-line') {
                wordCol = (isCurrent || prefersReducedMotion) ? wordColor : lineColor;
              } else if (style === 'boxed-word') {
                wordCol = isCurrent ? wordColor : lineColor;
                if (isCurrent) {
                  bg = boxColor;
                  pad = '2px 6px';
                  br = '6px';
                }
              }

              return (
                <span
                  key={`${globalWordIdx}-${word}`}
                  style={{
                    color: wordCol,
                    background: bg,
                    padding: pad,
                    borderRadius: br,
                    transform: isCurrent && (style === 'classic-progressive' || style === 'boxed-word' || style === 'classic-one-word') ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.12s ease, color 0.12s ease'
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Bottom indicator */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          height: '3px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px'
        }} />
      </div>
    </div>
  );
}
