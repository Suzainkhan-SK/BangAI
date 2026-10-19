import React from 'react';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  HelpCircle,
  Scale,
  DollarSign,
  Copyright
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';

export default function TermsPage({ onNavigateToLanding, onNavigateToDashboard }) {
  const { isMobile } = useBreakpoint();

  const handleBack = () => {
    audioEngine.playSfx('click');
    if (onNavigateToLanding) {
      onNavigateToLanding();
    } else if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      window.location.hash = '';
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - var(--nav-h, 58px))',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      paddingTop: isMobile ? '28px' : '48px',
      paddingBottom: '80px',
      position: 'relative',
      overflowY: 'visible'
    }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Navigation Back Button */}
        <button
          onClick={handleBack}
          className="admin-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '32px'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </button>

        {/* Header Hero */}
        <div style={{ marginBottom: '40px' }}>
          <div className="glow-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            marginBottom: '16px'
          }}>
            <Scale size={14} color="#8b5cf6" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Terms & Conditions
            </span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(32px, 5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>
            Terms of Service
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            <strong>Effective Date:</strong> October 19, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> October 19, 2026
          </p>
        </div>

        {/* Notice Card for YouTube Terms of Service Agreement */}
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1.5px solid rgba(239, 68, 68, 0.28)',
          marginBottom: '36px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ExternalLink size={20} color="#f87171" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', margin: 0 }}>
              Mandatory YouTube Terms of Service Agreement
            </h3>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
            BangAI utilizes YouTube API Services for automated video publishing and channel synchronization. By connecting your YouTube account or publishing videos via BangAI, you explicitly acknowledge and agree to be bound by the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#f87171', textDecoration: 'underline', fontWeight: 600 }}
            >
              YouTube Terms of Service
            </a>. In addition, your data is processed according to the{' '}
            <a 
              href="http://www.google.com/policies/privacy" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#f87171', textDecoration: 'underline', fontWeight: 600 }}
            >
              Google Privacy Policy
            </a>.
          </p>
        </div>

        {/* Content Body */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'var(--text-secondary)'
        }}>

          {/* Section 1 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, registering for, or using the BangAI website, APIs, or software services (collectively, the &quot;Service&quot;), you agree to comply with and be legally bound by these Terms of Service. If you do not agree to these terms, you must not access or use the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              2. Intellectual Property & Commercial Output Ownership
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>100% Commercial Ownership:</strong> As between you and BangAI, you own all rights, title, and interest in and to the final videos, screenplays, and media generated through your account on BangAI, subject to third-party underlying stock and voice licenses.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Monetization Rights:</strong> You are fully authorized to monetize your generated videos across YouTube (including the YouTube Partner Program), TikTok, Instagram Reels, Facebook, LinkedIn, paid advertising campaigns, and client work.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Platform License:</strong> You grant BangAI a non-exclusive, worldwide, royalty-free license solely to host, process, cache, and transmit your inputs and generated videos as necessary to operate and deliver the Service to you.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              3. User Conduct & Acceptable Use Policy
            </h2>
            <p>You agree not to use BangAI for any unlawful or abusive purposes. Specifically, you represent and warrant that you will not submit prompts or generate content that:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <li>Infringes on any third-party copyright, trademark, patent, or proprietary rights.</li>
              <li>Promotes hate speech, violent extremism, terrorism, or illegal harassment.</li>
              <li>Generates defamatory, slanderous, sexually explicit, or non-consensual deepfake media.</li>
              <li>Violates the terms, policies, or Community Guidelines of YouTube, Meta, TikTok, or Google.</li>
              <li>Attempts to reverse engineer, decompile, or disrupt our cloud rendering clusters, n8n infrastructure, or serverless proxies.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              BangAI reserves the right to immediately suspend or terminate accounts that violate this Acceptable Use Policy without refund.
            </p>
          </section>

          {/* Section 4 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              4. DMCA & Copyright Infringement Policy
            </h2>
            <p>
              BangAI respects the intellectual property rights of others and operates in full compliance with the Digital Millennium Copyright Act (17 U.S.C. § 512). If you believe your copyrighted work has been infringed by any content processed or displayed on BangAI, please send a written Notice of Claimed Infringement to our Designated Copyright Agent:
            </p>
            <div style={{ marginTop: '14px', padding: '16px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Designated DMCA Copyright Agent:
              </div>
              <div style={{ fontSize: '13px' }}>
                Legal Department — BangAI Media<br />
                Email: <a href="mailto:support@bangai.netlify.app" style={{ color: '#60a5fa' }}>support@bangai.netlify.app</a><br />
                Subject: &quot;DMCA Copyright Infringement Notice&quot;
              </div>
            </div>
            <p style={{ fontSize: '13px', marginTop: '10px' }}>
              Your notice must include: (1) identification of the copyrighted work, (2) identification of the infringing material, (3) your contact details, (4) a statement of good faith belief, and (5) a physical or electronic signature.
            </p>
          </section>

          {/* Section 5 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              5. Third-Party Media & APIs
            </h2>
            <p>
              BangAI integrates with reputable third-party APIs to assemble your videos:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <li><strong>Stock Footage:</strong> Sourced via Pexels and Pixabay APIs under their respective royalty-free commercial licenses.</li>
              <li><strong>Voice Synthesis:</strong> Powered by ElevenLabs and json2video commercial voice APIs.</li>
              <li><strong>Automated Publishing:</strong> Powered by YouTube API Services.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              While our system automatically selects commercially cleared assets, users are advised to review final renders before publishing.
            </p>
          </section>

          {/* Section 6 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              6. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. BangAI does not guarantee specific YouTube view counts, viral growth, or monetization acceptance by third-party platforms.
            </p>
            <p style={{ marginTop: '10px' }}>
              In no event shall BangAI, its directors, or affiliates be liable for any indirect, incidental, punitive, or consequential damages resulting from your use or inability to use the Service.
            </p>
          </section>

          {/* Section 7 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              7. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. When changes occur, we will update the &quot;Last Updated&quot; date at the top of this page. Your continued use of the Service following posted revisions signifies your acceptance.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
