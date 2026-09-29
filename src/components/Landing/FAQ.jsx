import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Sparkles } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function FAQ() {
  const { isMobile } = useBreakpoint();
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'What video lengths, formats, and aspect ratios does Bang AI support?',
      a: 'Bang AI is completely flexible. You can generate fast-paced 15–60s viral shorts, multi-act storytelling videos, and in-depth multi-minute explainers. We natively support 9:16 Vertical (Shorts, Reels, TikTok), 16:9 Landscape (YouTube, LinkedIn, TV & Web), and 1:1 Square (Instagram Feed & Paid Ads).'
    },
    {
      q: 'Which platforms can I publish to automatically?',
      a: 'You can publish directly with 1-click to YouTube (Shorts & regular videos with automated SEO titles, descriptions, and pinned comments), Instagram Reels, TikTok, and LinkedIn. You can also download the raw master MP4 in full 1080p or 4K with burned-in kinetic subtitles.'
    },
    {
      q: 'What languages and voice models are supported?',
      a: 'We support over 31+ languages with crystal-clear phonetic pronunciation, including Hindi, Hinglish (blend of Hindi & English), Global English (US, UK, India, Australia), Spanish, French, German, Japanese, and Portuguese. Powered by ElevenLabs Turbo v2.5 and our library of 9,650+ voices.'
    },
    {
      q: 'Are the generated videos eligible for monetization and free of copyright strikes?',
      a: 'Yes, 100%. All visual generations, ElevenLabs voiceovers, and curated soundtrack scores come with full commercial rights. You own your content and can monetize immediately on YouTube Partner Program, TikTok Creator Rewards, and Meta Reels bonuses.'
    },
    {
      q: 'What AI engines power the video and script creation?',
      a: 'Bang AI uses a multi-model neural orchestration: Wan 2.1 and Grok Imagine for realistic video scenes, ElevenLabs Turbo v2.5 for human-like emotional speech, our Stage 0–3 Autonomous Screenplay Architect for calibrated narrative pacing, and intelligent -18dB audio ducking for crystal-clear acoustics.'
    },
    {
      q: 'Can I edit the screenplay, voice, and subtitles before exporting?',
      a: 'Absolutely. You have full creative control in the Bang AI Studio: inspect scene-by-scene script breakdowns, adjust voice pitch and pacing, preview audio in real time, swap visual prompts, and customize subtitle color themes and font animations before rendering.'
    }
  ];

  const toggle = (idx) => {
    audioEngine.playSfx('click');
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section id="faq" style={{
      paddingTop: isMobile ? '48px' : '80px',
      paddingBottom: isMobile ? '48px' : '80px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)'
    }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <HelpCircle size={13} />
            <span>Got Questions?</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Everything you need to know about the Bang AI autonomous video engine.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                className="saas-card"
                style={{
                  padding: isMobile ? '16px' : '20px 24px',
                  borderRadius: '16px',
                  border: `1.5px solid ${isOpen ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                  background: isOpen ? 'var(--bg-elevated)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isOpen ? '0 8px 24px rgba(99, 102, 241, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <h3 style={{
                    fontSize: isMobile ? '15px' : '16.5px',
                    fontWeight: 700,
                    color: isOpen ? '#38bdf8' : 'var(--text-primary)',
                    margin: 0,
                    lineHeight: 1.4,
                    transition: 'color 0.15s ease'
                  }}>
                    {faq.q}
                  </h3>

                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isOpen ? '#38bdf8' : 'var(--text-muted)',
                    flexShrink: 0
                  }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isOpen && (
                  <p style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: isMobile ? '13px' : '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: '14px 0 0 0'
                  }}>
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
