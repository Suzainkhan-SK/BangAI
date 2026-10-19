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
      a: 'Bang AI supports fast-paced 15–75s viral Shorts, 5-act narrative cinematic videos, and long-form storytelling. We natively export in 9:16 Vertical (YouTube Shorts, Instagram Reels, TikTok), 16:9 Landscape (YouTube standard, LinkedIn, TV & Web), and 1:1 Square (Feed & Paid Ads) in pristine 1080p Full HD.'
    },
    {
      q: 'Are generated videos eligible for monetization on YouTube without copyright strikes?',
      a: 'Yes, 100%. All visuals are commercially licensed via Pexels and Pixabay APIs, neural voiceovers carry full commercial broadcast rights from ElevenLabs/json2video, and kinetic subtitle fonts use the permissive SIL Open Font License. Because our 5-act narrative engine writes original de novo scripts and dynamically mixes layered audio with smart-paced subtitles, your videos satisfy YouTube Partner Program (YPP) transformative originality guidelines and avoid "Reused Content" flags.'
    },
    {
      q: 'How does YouTube Auto-Publishing work and is my channel secure?',
      a: 'Bang AI connects to your YouTube channels using official Google Cloud OAuth 2.0 protocols with encrypted token vaulting. We only request permissions to upload your rendered videos and inspect upload statuses. Your account tokens are encrypted at rest in MongoDB Atlas, never shared with third parties, and you can disconnect channels or revoke access anytime directly via Google Security Settings.'
    },
    {
      q: 'What is BangAI Stock Studio and how does the 24-Hour Autopilot work?',
      a: 'Stock Studio is our cloud-native video engine hosted on a 20-worker parallel GPU cluster on Modal.com. The 24-Hour Autopilot feature lets you queue upcoming topics; our autonomous pipeline generates the screenplay, synthesizes narration, stitches stock footage, burns subtitles, and uploads the finished video to your connected YouTube channel on a scheduled automated cadence without manual intervention.'
    },
    {
      q: 'What languages and voice models are supported?',
      a: 'We support over 31+ languages with emotional pitch and cadence inflection, including authentic Hindi (with native Devanagari typography), Hinglish, Global English (US, UK, India, Australia), Spanish, French, German, and Portuguese. Every voice is calibrated for natural sentence breaks and dramatic tension.'
    },
    {
      q: 'Can I edit the screenplay, voice, and subtitles before exporting?',
      a: 'Absolutely. You have full creative control in the Bang AI Studio: inspect scene-by-scene script breakdowns, adjust voice pitch and pacing, preview audio in real time, customize subtitle color themes and font animations, and swap visual prompts before rendering.'
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
