import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How does ShortsAI generate 75-second multi-scene videos?',
      a: 'ShortsAI uses a 5-stage production pipeline: Stage 0 classifies your topic; Stage 1 plans the 5-beat emotional story arc; Stage 2 writes 5 distinct 15-second scenes with strict 190–200 character speech limits; Stage 3 quality audits the screenplay; and Stage 4 renders 5 parallel Grok Imagine 1.5 video scenes and synthesizes ElevenLabs narration.'
    },
    {
      q: 'Can I generate videos in Hindi, Hinglish, or other languages?',
      a: 'Yes! ShortsAI natively supports Hinglish (70% Hindi / 30% English), Pure Hindi, Global English, and Spanish with accurate phonetic pronunciation and animated Devanagari/Latin captions.'
    },
    {
      q: 'Does it automatically post to my YouTube channel?',
      a: 'Yes! When you click 1-Click Upload, the n8n backend connects to YouTube Data API v3, uploads the 1080x1920 9:16 master MP4, adds your optimized title and description, and posts a high-engagement pinned comment.'
    },
    {
      q: 'Why are videos exactly 75 seconds with 5 scenes?',
      a: 'YouTube Shorts algorithm prioritizes videos over 60 seconds with high average percentage viewed (APV). The 5-scene structure (Hook → Setup → Build → Climax → Resolution) is scientifically optimized to maximize 3-second retention and end-to-end completion rate.'
    },
    {
      q: 'What visual art styles are supported?',
      a: 'You can choose between Cinematic Realistic (35mm photorealism), Pixar 3D Animation (stylized cartoon), Cinematic Dark Dramatic (mystery/horror), Cinematic Sci-Fi Documentary, Realistic Archival (historical vintage), and Cinematic CGI Epic (mythology & VFX).'
    }
  ];

  const toggle = (idx) => {
    audioEngine.playSfx('click');
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section id="faq" style={{ padding: '80px 0', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <HelpCircle size={13} />
            <span>Got Questions?</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                className="saas-card"
                style={{
                  padding: '18px 20px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {faq.q}
                  </h3>
                  <div style={{ color: 'var(--accent-primary)' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
                {isOpen && (
                  <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
