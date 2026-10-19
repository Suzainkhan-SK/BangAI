import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  FileText, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Server, 
  RefreshCw,
  Trash2,
  Globe2
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';

export default function PrivacyPolicyPage({ onNavigateToLanding, onNavigateToDashboard }) {
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
      minHeight: '100vh',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      paddingTop: isMobile ? '32px' : '64px',
      paddingBottom: '80px',
      position: 'relative'
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
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={14} color="#3b82f6" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Legal & Compliance
            </span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(32px, 5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>
            Privacy Policy
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            <strong>Effective Date:</strong> October 19, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> October 19, 2026
          </p>
        </div>

        {/* Notice Card for Google & YouTube API Services Compliance */}
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1.5px solid rgba(59, 130, 246, 0.28)',
          marginBottom: '36px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Globe2 size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
              Google API Services & YouTube User Data Disclosure
            </h3>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
            BangAI uses <strong>YouTube API Services</strong> to allow users to authenticate their YouTube accounts and automatically upload their generated videos. By using BangAI's YouTube integration, you agree to be bound by the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}
            >
              YouTube Terms of Service
            </a>{' '}
            and the{' '}
            <a 
              href="http://www.google.com/policies/privacy" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}
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
              1. Introduction
            </h2>
            <p>
              BangAI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the <strong>BangAI</strong> platform located at{' '}
              <a href="https://bangai.netlify.app" style={{ color: '#60a5fa' }}>https://bangai.netlify.app</a>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, how we secure it, and your rights in relation to it when you use our autonomous video generation services, Stock Studio, Thumbnail Studio, and API integrations.
            </p>
          </section>

          {/* Section 2 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              2. Information We Collect
            </h2>
            <p>We collect information necessary to provide, manage, and optimize our video creation and distribution services:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Account Credentials:</strong> Email address, username, hashed password, and authentication session tokens (HMAC-SHA256 JWT).
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Creative Inputs:</strong> Story prompts, custom topics, selected templates, voice configurations, subtitle styling preferences, and generated video metadata.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Google OAuth & YouTube Data:</strong> When you connect your Google Account via official OAuth 2.0, we access and store:
                <ul style={{ paddingLeft: '20px', marginTop: '6px', listStyleType: 'circle' }}>
                  <li>Your YouTube channel name, channel ID, and profile thumbnail.</li>
                  <li>OAuth access tokens and refresh tokens (encrypted at rest in MongoDB Atlas) to upload your rendered videos upon your request.</li>
                  <li>Basic Google profile information (email address and display name).</li>
                </ul>
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Bring-Your-Own-Key (BYOK) Data:</strong> Personal API keys entered in Settings (e.g. Gemini, OpenAI, json2video, Pexels) are stored strictly within your isolated user partition at <code>/storage/users/{'{user_id}'}/config.toml</code> and are never shared across users.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              3. How We Use Google User Data (Google API Limited Use Disclosure)
            </h2>
            <p>
              BangAI’s use and transfer to any other app of information received from Google APIs adheres to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#60a5fa', textDecoration: 'underline' }}
              >
                Google API Services User Data Policy
              </a>, including the <strong>Limited Use</strong> requirements:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>
                  <CheckCircle2 size={16} />
                  <span>Permitted Uses</span>
                </div>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  Publishing generated videos to your channel upon your command, appending video links to your connected Google Sheet, and refreshing authorization tokens.
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertCircle size={16} />
                  <span>Strict Prohibitions</span>
                </div>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  We <strong>NEVER</strong> sell your Google data, transfer it to third parties for advertising, or use your private data to train generalized AI models.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              4. How to Revoke Access to Google User Data
            </h2>
            <p>
              You maintain total control over your connected Google Accounts. You may revoke BangAI’s access to your YouTube and Google data at any time through either of the following methods:
            </p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <li>
                <strong>Directly via Google Security Settings:</strong> Visit{' '}
                <a 
                  href="https://security.google.com/settings/security/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}
                >
                  https://security.google.com/settings/security/permissions
                </a>, locate <strong>Bang AI</strong> under third-party apps, and click <strong>&quot;Remove Access&quot;</strong>.
              </li>
              <li>
                <strong>Inside the BangAI Dashboard:</strong> Navigate to <strong>Settings &rarr; Connected YouTube Channels</strong> and click <strong>&quot;Disconnect Channel&quot;</strong>. This instantly deletes the stored OAuth refresh tokens from our database.
              </li>
            </ol>
          </section>

          {/* Section 5 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              5. Data Storage, Security & Retention
            </h2>
            <p>
              We enforce industry-standard security safeguards to protect your data:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <li>
                <strong>Encryption:</strong> All network traffic is encrypted via HTTPS / TLS 1.3. OAuth tokens and sensitive credentials are encrypted at rest in MongoDB Atlas.
              </li>
              <li>
                <strong>Multi-Tenant Isolation:</strong> User files, video projects, and personal configs are partitioned into dedicated isolated directories on cloud volumes (<code>/storage/users/{'{user_id}'}/</code>).
              </li>
              <li>
                <strong>Zero Client-Side Key Exposure:</strong> All third-party vision, voice, and LLM requests route through serverless proxies. Browser DevTools cannot inspect vendor API keys.
              </li>
              <li>
                <strong>Retention & Deletion:</strong> We retain account data as long as your account remains active. Upon account deletion, all stored user tokens, generated media, and configuration profiles are permanently expunged within 30 days.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              6. Third-Party Service Providers
            </h2>
            <p>
              To deliver high-speed automated rendering, BangAI interfaces with verified cloud partners:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <li><strong>Hosting & Compute:</strong> Netlify Cloud (Serverless), Modal.com (GPU Rendering Clusters).</li>
              <li><strong>Database:</strong> MongoDB Atlas (Cloud Database).</li>
              <li><strong>Media & AI Engines:</strong> Pexels / Pixabay (Royalty-free footage), ElevenLabs / json2video (Voice synthesis), Google Gemini (Script generation).</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              All partners are bound by strict data processing agreements and only process inputs required to render your specific tasks.
            </p>
          </section>

          {/* Section 7 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              7. Your Legal Rights (GDPR & CCPA)
            </h2>
            <p>
              Depending on your location, you hold legal rights regarding your personal data, including the right to request access, rectification, portability, or complete deletion of your data. To exercise any of these rights, contact us at <a href="mailto:support@bangai.netlify.app" style={{ color: '#60a5fa' }}>support@bangai.netlify.app</a>.
            </p>
          </section>

          {/* Section 8 */}
          <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              8. Contact & Legal Inquiries
            </h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or our data practices, please reach out to our privacy compliance team:
            </p>
            <div style={{ marginTop: '14px', padding: '16px', borderRadius: '12px', background: 'var(--bg-app)', display: 'inline-block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                <Mail size={16} color="#3b82f6" />
                <span>support@bangai.netlify.app</span>
              </div>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                BangAI Privacy & Compliance Team
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
