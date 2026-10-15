import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldAlert, Clock, RefreshCw, RotateCcw,
  Sliders, UserCheck, AlertTriangle, CheckCircle2,
  Search, Lock, Unlock, Eye, Sparkles, Filter,
  Power, FileText, ExternalLink, HelpCircle
} from 'lucide-react';
import { adminService } from '../adminService';

// Real BangAI Templates matching TemplatesPage.jsx
export const OFFICIAL_TEMPLATES = [
  {
    id: 'world-mysteries',
    emoji: '🛸',
    title: 'World Mysteries & Paranormal',
    category: 'World Mysteries',
    desc: 'Self-researches unrepeated paranormal mysteries, scripts 5 cinematic scenes, renders photorealistic AI video, and uploads directly to YouTube — zero manual review.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    videoTitle: "The Bermuda Triangle's Darkest Secret",
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    n8nWorkflowId: 'NXZyaUNBciJ9gzCT',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-world-mysteries',
    youtubeUrl: 'https://youtube.com/shorts/r3LTM0G7BTc?si=a5xHNd5fSDyfAny9',
    youtubeId: 'r3LTM0G7BTc',
    color: '#6366f1',
    status: 'ACTIVE'
  },
  {
    id: 'last-24-hours',
    emoji: '⏳',
    title: 'Last 24 Hours [True Stories]',
    category: 'True Stories',
    desc: 'Counts down the poignant and dramatic final 24 hours of legendary figures, heroic sacrifices, and historic events with empathetic narration and emotional hooks.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    videoTitle: 'Princess Diana: The Final 24 Hours',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    n8nWorkflowId: 'SpEEzOq1LHWbGbti',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-last-24-hours',
    youtubeUrl: 'https://youtube.com/shorts/1ySvtrgDTnE?si=pMbTnIisLg7ftrg-',
    youtubeId: '1ySvtrgDTnE',
    color: '#f59e0b',
    status: 'ACTIVE'
  },
  {
    id: '3am-horror',
    emoji: '👻',
    title: '3-AM Horror & Paranormal',
    category: 'Horror & Paranormal',
    desc: 'Bone-chilling psychological terror and terrifying 3 AM encounters. Maximum camera movement, eerie suspense, and dark sound design crafted for viral retention.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    videoTitle: 'The Dyatlov Incident: 3 AM Anomaly',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    n8nWorkflowId: 'sY13UPWrlpUWyNJR',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-3am-horror',
    youtubeUrl: 'https://youtube.com/shorts/vOb4jIQkAOY?si=bPQqp7MGmRkW00uF',
    youtubeId: 'vOb4jIQkAOY',
    color: '#ef4444',
    status: 'ACTIVE'
  },
  {
    id: 'ancient-history',
    emoji: '🏛️',
    title: 'Ancient History & Lost Civilizations',
    category: 'True Stories',
    desc: 'Deep-dives into forgotten dynasties, ancient monoliths, and lost technological wonders.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-ancient-history',
    color: '#8b5cf6',
    status: 'UPCOMING'
  },
  {
    id: 'dark-psychology',
    emoji: '🧠',
    title: 'Dark Psychology & Human Behavior',
    category: 'Horror & Paranormal',
    desc: 'Reveals behavioral quirks, subconscious micro-signals, and persuasion breakdowns.',
    tagline: '60s · 4 Scenes · 1080p',
    duration: '60s',
    scenes: '4 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-dark-psychology',
    color: '#06b6d4',
    status: 'UPCOMING'
  },
  {
    id: 'cosmic-space',
    emoji: '🌌',
    title: 'Deep Space & Cosmic Wonders',
    category: 'Space & Tech',
    desc: 'Explores black hole anomalies, quantum paradoxes, and deep cosmos discoveries.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-cosmic-space',
    color: '#3b82f6',
    status: 'UPCOMING'
  },
  {
    id: 'mythical-heists',
    emoji: '💎',
    title: 'Legendary Heists & Unsolved Enigmas',
    category: 'World Mysteries',
    desc: 'Fast-paced breakdowns of impossible vaults, art heists, and unexplained escapes.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-mythical-heists',
    color: '#10b981',
    status: 'UPCOMING'
  }
];

export default function TemplatesManagerView() {
  const [activeTab, setActiveTab] = useState('governance'); // 'governance' | 'templates' | 'users' | 'logs'
  const [templates, setTemplates] = useState(OFFICIAL_TEMPLATES);
  const [blocklist, setBlocklist] = useState('nsfw, hate, violence, illegal, deepfake_celebrity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Governance Settings State
  const [dailyLimit, setDailyLimit] = useState(1);
  const [limitWindow, setLimitWindow] = useState('24h'); // '24h' | 'calendar'
  const [enforceDailyLimit, setEnforceDailyLimit] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceNotice, setMaintenanceNotice] = useState('AI Template generation is currently undergoing scheduled maintenance. Please check back shortly.');
  
  // User Quotas & Logs State
  const [userUsageList, setUserUsageList] = useState([]);
  const [stats, setStats] = useState({ totalGenerationsAllTime: 0, generationsLast24h: 0, activeUsersCount: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [quotaFilter, setQuotaFilter] = useState('all'); // 'all' | 'locked' | 'available'
  const [overrideModal, setOverrideModal] = useState({ open: false, userEmail: '', limit: 1 });
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // New Template Wizard State
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: 'World Mysteries',
    emoji: '✨',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-',
    desc: 'Autonomous high-retention 5-scene viral template.'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchTemplatesData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getTemplates();
      if (res && res.success && res.data) {
        const d = res.data;
        if (Array.isArray(d.templates) && d.templates.length > 0) {
          const merged = OFFICIAL_TEMPLATES.map(orig => {
            const remote = d.templates.find(r => r.id === orig.id);
            return remote ? { ...orig, ...remote } : orig;
          });
          setTemplates(merged);
        }
        if (d.blocklist !== undefined) setBlocklist(d.blocklist);
        if (d.dailyLimit !== undefined) setDailyLimit(Number(d.dailyLimit));
        if (d.limitWindow !== undefined) setLimitWindow(d.limitWindow);
        if (d.enforceDailyLimit !== undefined) setEnforceDailyLimit(!!d.enforceDailyLimit);
        if (d.maintenanceMode !== undefined) setMaintenanceMode(!!d.maintenanceMode);
        if (d.maintenanceNotice !== undefined) setMaintenanceNotice(d.maintenanceNotice);
        if (d.userUsageList) setUserUsageList(d.userUsageList);
        if (d.stats) setStats(d.stats);
      }
    } catch (e) {
      console.warn('[TemplatesManagerView] Failed to fetch templates data:', e.message);
      showToast(`Error fetching data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesData();
  }, []);

  const handleSaveGovernance = async () => {
    setSaving(true);
    try {
      const res = await adminService.saveTemplateGovernance({
        dailyLimit: Number(dailyLimit) || 1,
        limitWindow,
        enforceDailyLimit,
        maintenanceMode,
        maintenanceNotice,
        blocklist
      });
      if (res.success) {
        showToast('✅ Template Governance & Daily Limits successfully saved to MongoDB Atlas!');
        fetchTemplatesData();
      } else {
        showToast(`❌ Error: ${res.error || 'Failed to save settings'}`);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetUserLimit = async (userEmail, userId) => {
    if (!window.confirm(`Reset 24h template limit for ${userEmail}? This user will be immediately able to generate again.`)) {
      return;
    }
    try {
      const res = await adminService.resetUserTemplateLimit(userEmail, userId);
      if (res.success) {
        showToast(`✅ Limit reset for ${userEmail}!`);
        fetchTemplatesData();
      } else {
        showToast(`❌ Failed to reset limit: ${res.error}`);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleResetAllLimits = async () => {
    const confirmation = window.prompt('⚠️ WARNING: This will immediately reset the 24h template generation limit for ALL users platform-wide. Type "RESET ALL" to confirm:');
    if (confirmation !== 'RESET ALL') {
      showToast('Action cancelled.');
      return;
    }

    setSaving(true);
    try {
      const res = await adminService.resetAllTemplateLimits();
      if (res.success) {
        showToast('✅ ALL users daily template limits have been reset!');
        fetchTemplatesData();
      } else {
        showToast(`❌ Failed: ${res.error}`);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyUserOverride = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.setUserTemplateOverride(overrideModal.userEmail, overrideModal.limit);
      if (res.success) {
        showToast(`✅ Custom limit applied for ${overrideModal.userEmail}!`);
        setOverrideModal({ open: false, userEmail: '', limit: 1 });
        fetchTemplatesData();
      } else {
        showToast(`❌ Failed: ${res.error}`);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleToggleActive = async (template) => {
    const updated = { ...template, status: template.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
    setTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
    try {
      await adminService.saveTemplate(updated);
      showToast(`Template "${template.title}" status changed to ${updated.status}!`);
    } catch (e) {
      showToast(`Error updating template: ${e.message}`);
    }
  };

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await adminService.getTemplateGenerationLogs(100);
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      showToast(`Error loading logs: ${err.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.title) return;

    setSaving(true);
    const item = {
      id: newTemplate.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ...newTemplate,
      status: 'ACTIVE',
      tagline: `${newTemplate.duration} · ${newTemplate.scenes} · ${newTemplate.resolution}`,
      aiBrain: 'Claude Haiku 4.5 & Gemini'
    };

    try {
      const res = await adminService.saveTemplate(item);
      if (res.success) {
        setTemplates([item, ...templates]);
        setShowWizard(false);
        setNewTemplate({
          title: '',
          category: 'World Mysteries',
          emoji: '✨',
          duration: '75s',
          scenes: '5 Scenes',
          resolution: '1080p',
          webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-',
          desc: 'Autonomous high-retention 5-scene viral template.'
        });
        showToast(`✅ Template "${item.title}" deployed to MongoDB Atlas!`);
      }
    } catch (err) {
      showToast(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatCountdown = (dateStr) => {
    if (!dateStr) return 'Ready';
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return 'Ready now';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m left`;
  };

  const filteredUsers = userUsageList.filter(u => {
    const matchesSearch = !searchQuery || 
      (u.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.userId || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (quotaFilter === 'locked') return u.isLimitReached;
    if (quotaFilter === 'available') return !u.isLimitReached;
    return true;
  });

  const filteredTemplates = activeCategoryFilter === 'All'
    ? templates
    : templates.filter(t => t.category === activeCategoryFilter);

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <h1 className="admin-view-title" style={{ margin: 0 }}>
              AI Templates & Daily Quota Governance
            </h1>
          </div>
          <p className="admin-view-desc">
            Full master control over the <strong>AI Templates page</strong>: enforce per-user 24-hour video limits, live user quota resets, emergency maintenance, and n8n webhook pipeline routing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchTemplatesData}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="admin-btn admin-btn-primary"
          >
            + New Template
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: 'var(--admin-accent-cyan)',
          fontSize: '13.5px',
          fontWeight: 600,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚡</span>
          {toastMsg}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="admin-grid admin-grid-4" style={{ marginBottom: '20px' }}>
        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
              Daily Limit Policy
            </span>
            <Shield size={16} color="var(--admin-accent-cyan)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
            {enforceDailyLimit ? `${dailyLimit} Video / 24h` : 'Unlimited'}
          </div>
          <span style={{ fontSize: '11px', color: enforceDailyLimit ? 'var(--admin-accent-green)' : 'var(--admin-text-sub)', fontWeight: 600 }}>
            ● {enforceDailyLimit ? 'Enforced on All Users' : 'Daily Limits Bypassed'}
          </span>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
              Quota Window
            </span>
            <Clock size={16} color="var(--admin-accent-purple)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
            {limitWindow === '24h' ? '24h Rolling' : 'Midnight UTC'}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
            {limitWindow === '24h' ? 'Calculated from generation timestamp' : 'Resets at 00:00 UTC daily'}
          </span>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
              Generations (24h)
            </span>
            <Sparkles size={16} color="var(--admin-accent-amber)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
            {stats.generationsLast24h || 0}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
            Total all-time: {stats.totalGenerationsAllTime || 0}
          </span>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
              System Status
            </span>
            <Power size={16} color={maintenanceMode ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)'} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: maintenanceMode ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)' }}>
            {maintenanceMode ? 'Maintenance' : 'Active & Online'}
          </div>
          <span style={{ fontSize: '11px', color: maintenanceMode ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)', fontWeight: 600 }}>
            ● {maintenanceMode ? 'Generations Paused Platform-Wide' : 'Ready for User Requests'}
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--admin-border-glass)', marginBottom: '20px', paddingBottom: '2px' }}>
        {[
          { id: 'governance', label: 'Daily Limits & Master Governance', icon: Sliders },
          { id: 'users', label: `Active User Quotas (${userUsageList.length})`, icon: UserCheck },
          { id: 'templates', label: `Template Pipelines (${templates.length})`, icon: Sparkles },
          { id: 'logs', label: 'Live Generation Logs', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'logs' && logs.length === 0) handleLoadLogs();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--admin-accent-cyan)' : '2px solid transparent',
                color: isActive ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DAILY LIMITS & GOVERNANCE */}
      {activeTab === 'governance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                  Airtight 24-Hour Daily Generation Limits
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
                  Controls the exact number of autonomous AI videos each user is permitted to generate per day across all templates.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAllLimits}
                disabled={saving}
                className="admin-btn admin-btn-secondary"
                style={{
                  color: 'var(--admin-accent-red)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px'
                }}
              >
                <RotateCcw size={14} />
                Reset All Users' Limits
              </button>
            </div>

            <div className="admin-grid admin-grid-3" style={{ gap: '16px', marginBottom: '18px' }}>
              {/* Daily Limit Input */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glass)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '6px' }}>
                  Daily Video Limit Per User
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                    className="admin-input"
                    style={{ width: '90px', fontSize: '16px', fontWeight: 800, textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
                    video(s) / user / day (Default: 1)
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--admin-text-sub)', margin: '8px 0 0 0' }}>
                  Enforced server-side in <code>generate-template.js</code>. Rejects excess requests with HTTP 429.
                </p>
              </div>

              {/* Limit Window Select */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glass)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '6px' }}>
                  Quota Window Calculation
                </label>
                <select
                  value={limitWindow}
                  onChange={(e) => setLimitWindow(e.target.value)}
                  className="admin-select"
                  style={{ width: '100%' }}
                >
                  <option value="24h">24-Hour Rolling Window (Exact 24h from video generation)</option>
                  <option value="calendar">Calendar Day (Resets at 00:00 UTC)</option>
                </select>
                <p style={{ fontSize: '11px', color: 'var(--admin-text-sub)', margin: '8px 0 0 0' }}>
                  Rolling 24h is recommended to prevent burst generations right before midnight.
                </p>
              </div>

              {/* Master Enforcement Switch */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glass)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '6px' }}>
                  Enforce Daily Limits
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setEnforceDailyLimit(!enforceDailyLimit)}
                    className={`admin-btn ${enforceDailyLimit ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {enforceDailyLimit ? '🔒 Limits Active (1/day)' : '🔓 Limits Disabled (Free)'}
                  </button>
                  <span style={{ fontSize: '11.5px', color: enforceDailyLimit ? 'var(--admin-accent-green)' : 'var(--admin-accent-amber)', fontWeight: 600 }}>
                    {enforceDailyLimit ? 'Protected' : 'Unlimited Mode'}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Emergency Maintenance Switch */}
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              background: maintenanceMode ? 'rgba(239, 68, 68, 0.08)' : 'var(--admin-bg-elevated)',
              border: maintenanceMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--admin-border-glass)',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color={maintenanceMode ? 'var(--admin-accent-red)' : 'var(--admin-accent-amber)'} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                    Emergency Maintenance Mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`admin-btn ${maintenanceMode ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    background: maintenanceMode ? 'var(--admin-accent-red)' : undefined,
                    color: maintenanceMode ? '#fff' : undefined
                  }}
                >
                  {maintenanceMode ? '⛔ Maintenance Active' : '✅ System Online'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 8px 0' }}>
                When active, template generation is locked platform-wide for regular users. Administrators can still generate for testing.
              </p>
              <textarea
                rows={2}
                value={maintenanceNotice}
                onChange={(e) => setMaintenanceNotice(e.target.value)}
                placeholder="Notice displayed to users on the Templates Page..."
                className="admin-textarea"
                style={{ width: '100%', fontSize: '12px' }}
              />
            </div>

            {/* Keyword Moderation Blocklist */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                Autonomous Script Moderation Keyword Blocklist
              </label>
              <input
                type="text"
                value={blocklist}
                onChange={(e) => setBlocklist(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
                placeholder="Comma-separated prohibited words..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--admin-border-glass)' }}>
              <button
                type="button"
                onClick={handleSaveGovernance}
                disabled={saving}
                className="admin-btn admin-btn-primary"
                style={{ padding: '8px 24px', fontSize: '13px', fontWeight: 800 }}
              >
                {saving ? 'Saving...' : '💾 Save Governance Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE USER QUOTAS */}
      {activeTab === 'users' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                User Daily Quotas & Cooldown Manager
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0 }}>
                Live monitor of all users who have generated template videos in the active window. You can instantly reset limits or grant custom capacity.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--admin-text-sub)' }} />
                <input
                  type="text"
                  placeholder="Search user email or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-input"
                  style={{ paddingLeft: '30px', fontSize: '12px', width: '220px' }}
                />
              </div>

              <select
                value={quotaFilter}
                onChange={(e) => setQuotaFilter(e.target.value)}
                className="admin-select"
                style={{ fontSize: '12px' }}
              >
                <option value="all">All Active Users</option>
                <option value="locked">Limit Reached (Locked)</option>
                <option value="available">Quota Available</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '8px',
              background: 'var(--admin-bg-elevated)',
              color: 'var(--admin-text-sub)',
              fontSize: '13px'
            }}>
              <CheckCircle2 size={32} color="var(--admin-accent-green)" style={{ margin: '0 auto 10px auto', display: 'block' }} />
              <strong>No users are currently locked out by the 24-hour daily limit.</strong>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                All registered accounts have available video generations.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th>User / Account</th>
                    <th>24h Usage</th>
                    <th>Status</th>
                    <th>Last Template</th>
                    <th>Reset Countdown</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.userEmail || u.userId}>
                      <td>
                        <strong style={{ color: 'var(--admin-text-main)' }}>{u.userEmail}</strong>
                        {u.userId && (
                          <div style={{ fontSize: '10.5px', fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-text-sub)' }}>
                            ID: {u.userId}
                          </div>
                        )}
                        {u.isCustomLimit && (
                          <span style={{ fontSize: '10px', color: 'var(--admin-accent-amber)', fontWeight: 700 }}>
                            ★ Custom Limit Override: {u.dailyLimit}/day
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 800,
                          color: u.isLimitReached ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)'
                        }}>
                          {u.usedIn24h} / {u.dailyLimit}
                        </span>
                      </td>
                      <td>
                        {u.isLimitReached ? (
                          <span className="admin-badge admin-badge-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            <Lock size={10} style={{ marginRight: '4px' }} /> Locked (1/1)
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-success">
                            <Unlock size={10} style={{ marginRight: '4px' }} /> Available
                          </span>
                        )}
                      </td>
                      <td>
                        {u.lastTemplateTitle || u.lastTemplateId || '—'}
                      </td>
                      <td>
                        {u.isLimitReached ? (
                          <span style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '11px', color: 'var(--admin-accent-cyan)' }}>
                            ⏳ {formatCountdown(u.nextResetTime)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-accent-green)', fontSize: '11px' }}>
                            ● Ready now
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleResetUserLimit(u.userEmail, u.userId)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--admin-accent-green)' }}
                            title="Reset this user's daily limit immediately"
                          >
                            <RotateCcw size={12} style={{ marginRight: '4px' }} />
                            Reset Limit
                          </button>
                          <button
                            type="button"
                            onClick={() => setOverrideModal({ open: true, userEmail: u.userEmail, limit: u.dailyLimit })}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Set custom override capacity"
                          >
                            <Sliders size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEMPLATE PIPELINES GRID */}
      {activeTab === 'templates' && (
        <div>
          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {['All', 'World Mysteries', 'True Stories', 'Horror & Paranormal', 'Space & Tech'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: activeCategoryFilter === cat ? 'var(--admin-accent-cyan)' : 'var(--admin-bg-elevated)',
                  color: activeCategoryFilter === cat ? '#000' : 'var(--admin-text-main)',
                  border: '1px solid var(--admin-border-glass)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="admin-grid admin-grid-3" style={{ marginBottom: '24px' }}>
            {filteredTemplates.map(t => (
              <div key={t.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{t.emoji}</span>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                          {t.title}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--admin-accent-cyan)', fontWeight: 600 }}>
                          {t.category}
                        </span>
                      </div>
                    </div>
                    <span className={`admin-badge ${t.status === 'ACTIVE' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                      ● {t.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                    {t.desc}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--admin-bg-elevated)',
                    marginBottom: '12px',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ color: 'var(--admin-text-sub)' }}>DURATION</div>
                      <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{t.duration || '75s'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--admin-text-sub)' }}>SCENES</div>
                      <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{t.scenes || '5 Scenes'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--admin-text-sub)' }}>QUALITY</div>
                      <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{t.resolution || '1080p'}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                    AI Brain: <strong style={{ color: 'var(--admin-text-main)' }}>{t.aiBrain || 'Claude Haiku 4.5 & Gemini'}</strong>
                  </div>

                  {t.n8nWorkflowId && (
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginBottom: '8px' }}>
                      n8n Workflow ID: <strong style={{ fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-accent-purple)' }}>{t.n8nWorkflowId}</strong>
                    </div>
                  )}

                  <div style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.2)',
                    fontSize: '10.5px',
                    fontFamily: 'var(--admin-font-mono)',
                    color: 'var(--admin-text-sub)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    Webhook: {t.webhook}
                  </div>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--admin-border-glass)', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(t)}
                    className={`admin-btn ${t.status === 'ACTIVE' ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                  >
                    {t.status === 'ACTIVE' ? 'Pause Pipeline' : 'Activate Pipeline'}
                  </button>

                  {t.youtubeUrl && (
                    <a
                      href={t.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--admin-accent-cyan)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}
                    >
                      Watch Short ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REAL-TIME GENERATION LOGS */}
      {activeTab === 'logs' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                Template Generation Audit History
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0 }}>
                Chronological real-time log of autonomous video requests received from the frontend.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadLogs}
              disabled={loadingLogs}
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
              Reload Logs
            </button>
          </div>

          {loadingLogs ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
              Loading audit logs from MongoDB...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
              No generation logs recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User Email</th>
                    <th>Template</th>
                    <th>Custom Topic / Prompt</th>
                    <th>YouTube Channel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={log._id || idx}>
                      <td style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--admin-text-main)' }}>{log.userEmail || 'anonymous'}</strong>
                      </td>
                      <td>
                        {log.templateTitle || log.templateId}
                      </td>
                      <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.prompt || <em style={{ color: 'var(--admin-text-sub)' }}>Auto-Brainstormed</em>}
                      </td>
                      <td>
                        {log.channelTitle ? `📺 ${log.channelTitle}` : <em style={{ color: 'var(--admin-text-sub)' }}>Download Only</em>}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-success">
                          ● {log.status || 'dispatched'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Custom User Override Modal */}
      {overrideModal.open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--admin-text-main)' }}>
              Custom Daily Quota Override
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 14px 0' }}>
              Override the standard 24-hour limit specifically for <strong>{overrideModal.userEmail}</strong>.
            </p>

            <form onSubmit={handleApplyUserOverride} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Daily Allowed Videos
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideModal.limit}
                  onChange={(e) => setOverrideModal(prev => ({ ...prev, limit: parseInt(e.target.value) || 0 }))}
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder="Set 0 for unlimited, or e.g. 5"
                />
                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                  Enter 0 for unlimited daily generations, or a specific number (e.g. 5).
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                  Save Custom Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOverrideModal({ open: false, userEmail: '', limit: 1 })}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Template Wizard Modal */}
      {showWizard && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0' }}>
              Deploy New Autonomous Video Template
            </h3>
            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Space & Cosmic Wonders"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  className="admin-input"
                />
              </div>

              <div className="admin-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    value={newTemplate.emoji}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, emoji: e.target.value }))}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                    Niche Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="admin-select"
                  >
                    <option value="World Mysteries">World Mysteries</option>
                    <option value="True Stories">True Stories</option>
                    <option value="Horror & Paranormal">Horror & Paranormal</option>
                    <option value="Space & Tech">Space & Tech</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  n8n Webhook Endpoint
                </label>
                <input
                  type="text"
                  value={newTemplate.webhook}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, webhook: e.target.value }))}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Description & Story Arc
                </label>
                <textarea
                  rows={3}
                  value={newTemplate.desc}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, desc: e.target.value }))}
                  className="admin-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Deploy to MongoDB Atlas'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
