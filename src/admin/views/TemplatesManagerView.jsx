import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldAlert, Clock, RefreshCw, RotateCcw,
  Sliders, UserCheck, AlertTriangle, CheckCircle2,
  Search, Lock, Unlock, Eye, Sparkles, Filter,
  Power, FileText, ExternalLink, HelpCircle, Video,
  Play, Download, Copy, Check, Radio, Activity, Film, X,
  Layers, Share2, ArrowUpRight, BarChart3, TrendingUp
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
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
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
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
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
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
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
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
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
    tagline: '60s+ · 4 Scenes · 1080p',
    duration: '60s+',
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
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
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
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
    scenes: '5 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-mythical-heists',
    color: '#10b981',
    status: 'UPCOMING'
  }
];

export default function TemplatesManagerView() {
  const [activeTab, setActiveTab] = useState('governance'); // 'governance' | 'users' | 'videos' | 'logs' | 'templates'
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
  
  // Realtime Logs & Videos State
  const [logs, setLogs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [logsSummary, setLogsSummary] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10); // 0 = Off, 5, 10, 30 seconds
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [logsTemplateFilter, setLogsTemplateFilter] = useState('ALL');
  const [logsStatusFilter, setLogsStatusFilter] = useState('ALL');

  // Generated Videos Section State
  const [selectedVideoUser, setSelectedVideoUser] = useState('ALL');
  const [selectedVideoTemplate, setSelectedVideoTemplate] = useState('ALL');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null); // for video modal player

  // New Template Wizard State
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: 'World Mysteries',
    emoji: '✨',
    duration: '75s+',
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
    handleLoadLogs(true);
  }, []);

  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      handleLoadLogs(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

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

  const handleLoadLogs = async (silent = false) => {
    if (!silent) setLoadingLogs(true);
    try {
      const res = await adminService.getTemplateGenerationLogs(200);
      if (res && res.success) {
        if (Array.isArray(res.logs)) setLogs(res.logs);
        if (Array.isArray(res.videos)) setVideos(res.videos);
        if (Array.isArray(res.userStats)) setUserStats(res.userStats);
        if (res.summary) setLogsSummary(res.summary);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      if (!silent) showToast(`Error loading logs: ${err.message}`);
    } finally {
      if (!silent) setLoadingLogs(false);
    }
  };

  const handleCopyLink = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    showToast('📋 Video link copied to clipboard!');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleViewUserVideos = (userEmail) => {
    setSelectedVideoUser(userEmail || 'ALL');
    setActiveTab('videos');
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
          duration: '75s+',
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

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (sec < 60) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Combine userUsageList (24h quotas & limits) with userStats (all-time generations & completed videos)
  const combinedUserMap = new Map();

  userUsageList.forEach(u => {
    const email = (u.userEmail || '').toLowerCase();
    if (!email) return;
    combinedUserMap.set(email, {
      ...u,
      userEmail: email,
      completedVideosCount: 0,
      youtubeUploadedCount: 0,
      templateCounts: {},
      totalGenerations: u.totalAllTime || u.usedIn24h || 0
    });
  });

  userStats.forEach(s => {
    const email = (s.userEmail || '').toLowerCase();
    if (!email) return;
    if (combinedUserMap.has(email)) {
      const existing = combinedUserMap.get(email);
      existing.completedVideosCount = s.completedVideosCount || 0;
      existing.youtubeUploadedCount = s.youtubeUploadedCount || 0;
      existing.templateCounts = s.templateCounts || {};
      existing.totalGenerations = s.totalGenerations || existing.totalAllTime || 0;
      existing.totalAllTime = s.totalGenerations || existing.totalAllTime || 0;
      if (!existing.lastGeneratedAt && s.lastGeneratedAt) existing.lastGeneratedAt = s.lastGeneratedAt;
      if (!existing.userId && s.userId) existing.userId = s.userId;
    } else {
      combinedUserMap.set(email, {
        userId: s.userId || '',
        userEmail: email,
        usedIn24h: s.generationsLast24h || 0,
        totalAllTime: s.totalGenerations || 0,
        totalGenerations: s.totalGenerations || 0,
        dailyLimit: dailyLimit,
        isCustomLimit: false,
        isLimitReached: enforceDailyLimit && (s.generationsLast24h >= dailyLimit),
        lastGeneratedAt: s.lastGeneratedAt,
        lastTemplateId: null,
        lastTemplateTitle: null,
        nextResetTime: null,
        completedVideosCount: s.completedVideosCount || 0,
        youtubeUploadedCount: s.youtubeUploadedCount || 0,
        templateCounts: s.templateCounts || {}
      });
    }
  });

  const allUsersList = Array.from(combinedUserMap.values());

  // Filtered Users List
  const filteredUsers = allUsersList.filter(u => {
    const matchesSearch = !searchQuery || 
      (u.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.userId || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (quotaFilter === 'locked') return u.isLimitReached;
    if (quotaFilter === 'available') return !u.isLimitReached;
    return true;
  });

  // Unique users with generations for dropdown selector
  const uniqueUsersList = Array.from(new Set([
    ...allUsersList.map(u => (u.userEmail || '').toLowerCase()),
    ...logs.map(l => (l.userEmail || '').toLowerCase()),
    ...videos.map(v => (v.userEmail || '').toLowerCase())
  ])).filter(Boolean);

  // Filtered Generated Videos List
  const filteredVideos = videos.filter(v => {
    const matchesUser = selectedVideoUser === 'ALL' || (v.userEmail || '').toLowerCase() === selectedVideoUser.toLowerCase();
    const matchesTemplate = selectedVideoTemplate === 'ALL' || v.templateId === selectedVideoTemplate;
    const matchesSearch = !videoSearchQuery ||
      (v.title || '').toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
      (v.prompt || '').toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
      (v.userEmail || '').toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
      (v.channelTitle || '').toLowerCase().includes(videoSearchQuery.toLowerCase());
    return matchesUser && matchesTemplate && matchesSearch;
  });

  // Filtered Live Generation Logs List
  const filteredLogs = logs.filter(l => {
    const matchesTemplate = logsTemplateFilter === 'ALL' || l.templateId === logsTemplateFilter;
    const matchesStatus = logsStatusFilter === 'ALL' ||
      (logsStatusFilter === 'completed' && (l.status === 'COMPLETED' || l.videoUrl || l.youtubeUrl)) ||
      (logsStatusFilter === 'pending' && l.status !== 'COMPLETED' && !l.videoUrl && !l.youtubeUrl);
    const matchesSearch = !logsSearchQuery ||
      (l.userEmail || '').toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
      (l.templateTitle || '').toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
      (l.prompt || '').toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
      (l.channelTitle || '').toLowerCase().includes(logsSearchQuery.toLowerCase());
    return matchesTemplate && matchesStatus && matchesSearch;
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
              Generated Videos
            </span>
            <Film size={16} color="var(--admin-accent-cyan)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>
            {videos.length} Ready
          </div>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
            {logsSummary?.totalYouTubeUploads || 0} published to YouTube Shorts
          </span>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
              Generations (24h / All-Time)
            </span>
            <Sparkles size={16} color="var(--admin-accent-amber)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
            {stats.generationsLast24h || logsSummary?.generationsLast24h || 0}
            <span style={{ fontSize: '13px', color: 'var(--admin-text-sub)', fontWeight: 600, marginLeft: '6px' }}>
              / {stats.totalGenerationsAllTime || logsSummary?.totalGenerations || 0} total
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
            Across {userUsageList.length || userStats.length} active creator accounts
          </span>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
              Realtime Engine
            </span>
            <Activity size={16} color={maintenanceMode ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)'} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: maintenanceMode ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)' }}>
            {maintenanceMode ? 'Maintenance' : 'Live & Active'}
          </div>
          <span style={{ fontSize: '11px', color: maintenanceMode ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)', fontWeight: 600 }}>
            ● {autoRefreshInterval > 0 ? `Auto-sync every ${autoRefreshInterval}s` : 'Manual Sync Mode'}
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--admin-border-glass)', marginBottom: '20px', paddingBottom: '2px', flexWrap: 'wrap' }}>
        {[
          { id: 'governance', label: 'Daily Limits & Master Governance', icon: Sliders },
          { id: 'users', label: `User Stats & Quotas (${allUsersList.length})`, icon: UserCheck },
          { id: 'videos', label: `Generated Videos & Links (${videos.length})`, icon: Video },
          { id: 'logs', label: `Live Generation Logs (${logs.length})`, icon: Activity },
          { id: 'templates', label: `Template Pipelines (${templates.length})`, icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if ((tab.id === 'logs' || tab.id === 'videos') && logs.length === 0) handleLoadLogs(false);
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
                    <th>All-Time / 24h Stats</th>
                    <th>Quota Status</th>
                    <th>Videos with Links</th>
                    <th>Templates Used</th>
                    <th>Last Active</th>
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
                          <span style={{ fontSize: '10px', color: 'var(--admin-accent-amber)', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                            ★ Custom Override: {u.dailyLimit}/day
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'var(--admin-accent-purple)',
                            fontWeight: 800,
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Film size={11} /> {u.totalAllTime || u.totalGenerations || u.usedIn24h} Total
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: u.isLimitReached ? 'var(--admin-accent-red)' : 'var(--admin-accent-green)'
                          }}>
                            ({u.usedIn24h}/{u.dailyLimit} in 24h)
                          </span>
                        </div>
                      </td>
                      <td>
                        {u.isLimitReached ? (
                          <span className="admin-badge admin-badge-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            <Lock size={10} style={{ marginRight: '4px' }} /> Locked ({u.usedIn24h}/{u.dailyLimit})
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-success">
                            <Unlock size={10} style={{ marginRight: '4px' }} /> Available
                          </span>
                        )}
                      </td>
                      <td>
                        {u.completedVideosCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleViewUserVideos(u.userEmail)}
                            className="admin-badge admin-badge-cyan"
                            style={{
                              cursor: 'pointer',
                              border: '1px solid var(--admin-accent-cyan)',
                              background: 'rgba(6, 182, 212, 0.15)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                            title="Click to view all generated videos & direct links for this user"
                          >
                            <Video size={12} />
                            {u.completedVideosCount} Video{u.completedVideosCount > 1 ? 's' : ''} ↗
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                            0 links yet
                          </span>
                        )}
                      </td>
                      <td>
                        {u.templateCounts && Object.keys(u.templateCounts).length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                            {Object.entries(u.templateCounts).map(([tId, count]) => (
                              <span
                                key={tId}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'var(--admin-bg-elevated)',
                                  fontSize: '10px',
                                  fontFamily: 'var(--admin-font-mono)',
                                  color: 'var(--admin-text-sub)'
                                }}
                              >
                                {tId}: {count}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                            {u.lastTemplateTitle || u.lastTemplateId || '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                          {formatTimeAgo(u.lastGeneratedAt)}
                        </span>
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
                            onClick={() => handleViewUserVideos(u.userEmail)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--admin-accent-cyan)' }}
                            title="View videos generated by this user"
                          >
                            <Play size={11} style={{ marginRight: '3px' }} />
                            Videos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetUserLimit(u.userEmail, u.userId)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--admin-accent-green)' }}
                            title="Reset this user's daily limit immediately"
                          >
                            <RotateCcw size={11} style={{ marginRight: '3px' }} />
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => setOverrideModal({ open: true, userEmail: u.userEmail, limit: u.dailyLimit })}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 7px', fontSize: '11px' }}
                            title="Set custom override capacity"
                          >
                            <Sliders size={11} />
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

      {/* TAB 3: GENERATED VIDEOS & DIRECT OUTPUT LINKS */}
      {activeTab === 'videos' && (
        <div>
          {/* Filter & Search Bar */}
          <div className="admin-card" style={{ marginBottom: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Video size={18} color="var(--admin-accent-cyan)" />
                  Autonomous Generated Videos &amp; Direct Output Links
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0 }}>
                  Live gallery and direct stream/download links for all autonomous AI videos generated across templates.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleLoadLogs(false)}
                  disabled={loadingLogs}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
                  Refresh Videos
                </button>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--admin-text-sub)' }} />
                <input
                  type="text"
                  placeholder="Search by title, prompt, user..."
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  className="admin-input"
                  style={{ paddingLeft: '30px', fontSize: '12px', width: '100%' }}
                />
              </div>

              {/* User Selector Dropdown */}
              <div>
                <select
                  value={selectedVideoUser}
                  onChange={(e) => setSelectedVideoUser(e.target.value)}
                  className="admin-select"
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  <option value="ALL">All Users ({uniqueUsersList.length})</option>
                  {uniqueUsersList.map(email => {
                    const uStat = userStats.find(s => (s.userEmail || '').toLowerCase() === email);
                    const count = uStat?.totalGenerations || videos.filter(v => (v.userEmail || '').toLowerCase() === email).length;
                    return (
                      <option key={email} value={email}>
                        {email} ({count} video{count !== 1 ? 's' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Template Selector Dropdown */}
              <div>
                <select
                  value={selectedVideoTemplate}
                  onChange={(e) => setSelectedVideoTemplate(e.target.value)}
                  className="admin-select"
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  <option value="ALL">All AI Templates</option>
                  {OFFICIAL_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Indicator */}
            {(selectedVideoUser !== 'ALL' || selectedVideoTemplate !== 'ALL' || videoSearchQuery) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--admin-border-glass)', fontSize: '12px' }}>
                <span style={{ color: 'var(--admin-text-sub)' }}>Active filters:</span>
                {selectedVideoUser !== 'ALL' && (
                  <span className="admin-badge admin-badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    User: {selectedVideoUser}
                    <button
                      type="button"
                      onClick={() => setSelectedVideoUser('ALL')}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedVideoTemplate !== 'ALL' && (
                  <span className="admin-badge admin-badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Template: {selectedVideoTemplate}
                    <button
                      type="button"
                      onClick={() => setSelectedVideoTemplate('ALL')}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedVideoUser('ALL'); setSelectedVideoTemplate('ALL'); setVideoSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-accent-cyan)', cursor: 'pointer', fontSize: '11.5px', textDecoration: 'underline' }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Videos Grid */}
          {filteredVideos.length === 0 ? (
            <div className="admin-card" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
              <Film size={40} color="var(--admin-text-sub)" style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
                No generated video links found
              </h4>
              <p style={{ fontSize: '12.5px', margin: 0, maxWidth: '440px', marginInline: 'auto' }}>
                {selectedVideoUser !== 'ALL'
                  ? `No completed videos found for ${selectedVideoUser}. Video links will appear here as soon as n8n finishes rendering.`
                  : 'As users generate autonomous template videos, their MP4 download links and YouTube Shorts will appear here automatically in real time.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {filteredVideos.map((video, idx) => {
                const isCopied = copiedLink === (video._id || video.id || idx);
                const tpl = OFFICIAL_TEMPLATES.find(t => t.id === video.templateId);

                return (
                  <div
                    key={video._id || video.id || idx}
                    className="admin-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '16px',
                      border: '1px solid var(--admin-border-glass)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Header row: Template badge + Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: tpl ? `${tpl.color}20` : 'rgba(99, 102, 241, 0.15)',
                          color: tpl ? tpl.color : 'var(--admin-accent-cyan)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{tpl?.emoji || '🎬'}</span>
                          {video.templateTitle || tpl?.title || video.templateId}
                        </span>

                        <span className={`admin-badge ${video.videoUrl || video.youtubeUrl ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                          ● {video.status || (video.videoUrl ? 'COMPLETED' : 'PROCESSING')}
                        </span>
                      </div>

                      {/* Video Title */}
                      <h4 style={{
                        fontSize: '14.5px',
                        fontWeight: 800,
                        margin: '0 0 8px 0',
                        color: 'var(--admin-text-main)',
                        lineHeight: 1.35
                      }}>
                        {video.title || 'Autonomous AI Video'}
                      </h4>

                      {/* Creator info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                        <span>By:</span>
                        <strong style={{ color: 'var(--admin-text-main)' }}>{video.userEmail}</strong>
                        <span>•</span>
                        <span>{formatTimeAgo(video.createdAt)}</span>
                      </div>

                      {/* Prompt / Topic */}
                      <div style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--admin-bg-elevated)',
                        fontSize: '11.5px',
                        color: 'var(--admin-text-sub)',
                        marginBottom: '12px',
                        lineHeight: 1.4,
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <strong style={{ color: 'var(--admin-text-main)', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Story Topic / Prompt:
                        </strong>
                        {video.prompt || 'Autonomous AI Script Brainstorming'}
                      </div>

                      {/* Channel / Destination */}
                      {video.channelTitle ? (
                        <div style={{ fontSize: '11px', color: 'var(--admin-accent-amber)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📺 Published to:</span>
                          <strong>{video.channelTitle}</strong>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginBottom: '12px' }}>
                          <span>💾 Delivery: Direct MP4 Download</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div style={{ paddingTop: '12px', borderTop: '1px solid var(--admin-border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {video.videoUrl ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewVideo(video)}
                            className="admin-btn admin-btn-primary"
                            style={{ flex: 1, padding: '6px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <Play size={12} />
                            Watch Video
                          </button>

                          <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            title="Direct MP4 Download"
                          >
                            <Download size={12} />
                            MP4
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(video.videoUrl, video._id || video.id || idx)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '11.5px' }}
                            title="Copy Direct MP4 Link"
                          >
                            {isCopied ? <Check size={12} color="var(--admin-accent-green)" /> : <Copy size={12} />}
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          padding: '8px',
                          borderRadius: '6px',
                          background: 'rgba(234, 179, 8, 0.08)',
                          border: '1px solid rgba(234, 179, 8, 0.2)',
                          fontSize: '11px',
                          color: 'var(--admin-accent-amber)',
                          textAlign: 'center'
                        }}>
                          ⏳ Rendering in background pipeline...
                        </div>
                      )}

                      {video.youtubeUrl && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-btn admin-btn-secondary"
                            style={{
                              flex: 1,
                              padding: '5px 10px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                              color: 'var(--admin-accent-red)',
                              borderColor: 'rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            <Share2 size={12} />
                            Watch on YouTube ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(video.youtubeUrl, `yt-${video._id || idx}`)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                            title="Copy YouTube Short Link"
                          >
                            {copiedLink === `yt-${video._id || idx}` ? <Check size={11} color="var(--admin-accent-green)" /> : <Copy size={11} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TEMPLATE PIPELINES GRID */}
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
                      <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{t.duration || '75s+'}</div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--admin-accent-green)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--admin-accent-green)',
                    boxShadow: '0 0 8px var(--admin-accent-green)'
                  }} />
                  Live Realtime Feed
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                  Autonomous Generation Activity Feed
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0 }}>
                Realtime incoming stream from MongoDB Atlas <code>template_generations</code> &amp; <code>threads</code> collections.
                {autoRefreshInterval > 0 && ` Auto-syncing every ${autoRefreshInterval}s.`} Last synced: {lastRefreshedAt.toLocaleTimeString()}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Polling Interval Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>Sync:</span>
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="admin-select"
                  style={{ fontSize: '11.5px', padding: '4px 8px' }}
                >
                  <option value={5}>Every 5s (Fast)</option>
                  <option value={10}>Every 10s (Optimal)</option>
                  <option value={30}>Every 30s</option>
                  <option value={0}>Manual Only (Paused)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleLoadLogs(false)}
                disabled={loadingLogs}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
                Reload Feed
              </button>
            </div>
          </div>

          {/* Live Filter Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--admin-text-sub)' }} />
              <input
                type="text"
                placeholder="Filter logs by user, prompt, title..."
                value={logsSearchQuery}
                onChange={(e) => setLogsSearchQuery(e.target.value)}
                className="admin-input"
                style={{ paddingLeft: '30px', fontSize: '12px', width: '100%' }}
              />
            </div>

            <select
              value={logsTemplateFilter}
              onChange={(e) => setLogsTemplateFilter(e.target.value)}
              className="admin-select"
              style={{ fontSize: '12px' }}
            >
              <option value="ALL">All Templates</option>
              {OFFICIAL_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.emoji} {t.title}</option>
              ))}
            </select>

            <select
              value={logsStatusFilter}
              onChange={(e) => setLogsStatusFilter(e.target.value)}
              className="admin-select"
              style={{ fontSize: '12px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="completed">Completed / With Link</option>
              <option value="pending">Dispatched / Rendering</option>
            </select>
          </div>

          {/* Logs Table */}
          {loadingLogs && logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
              Streaming live logs from MongoDB Atlas...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
              No generation logs match the current filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User / Account</th>
                    <th>Template</th>
                    <th>Custom Story Prompt</th>
                    <th>Delivery Channel</th>
                    <th>Output Links</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => {
                    const hasVideo = !!log.videoUrl;
                    const hasYt = !!log.youtubeUrl;
                    return (
                      <tr key={log._id || log.id || idx}>
                        <td style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                          <div style={{ fontSize: '10px', color: 'var(--admin-text-sub)' }}>
                            {formatTimeAgo(log.createdAt)}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--admin-text-main)' }}>{log.userEmail || 'anonymous'}</strong>
                          {log.threadId && (
                            <div style={{ fontSize: '10px', fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-text-sub)' }}>
                              {log.threadId}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{log.templateTitle || log.templateId}</span>
                        </td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.prompt}>
                          {log.prompt || <em style={{ color: 'var(--admin-text-sub)' }}>Autonomous Brainstorm</em>}
                        </td>
                        <td>
                          {log.channelTitle ? (
                            <span style={{ color: 'var(--admin-accent-amber)', fontWeight: 600 }}>
                              📺 {log.channelTitle}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--admin-text-sub)' }}>
                              Direct Download
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                            {hasVideo ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewVideo(log)}
                                  className="admin-badge admin-badge-cyan"
                                  style={{ cursor: 'pointer', padding: '3px 6px', fontSize: '10.5px', border: '1px solid var(--admin-accent-cyan)', background: 'transparent' }}
                                  title="Preview Video"
                                >
                                  <Play size={10} style={{ marginRight: '2px' }} /> Play
                                </button>
                                <a
                                  href={log.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="admin-badge admin-badge-cyan"
                                  style={{ padding: '3px 6px', fontSize: '10.5px', textDecoration: 'none' }}
                                  title="Direct MP4 Download"
                                >
                                  <Download size={10} />
                                </a>
                              </>
                            ) : (
                              <span style={{ fontSize: '10.5px', color: 'var(--admin-accent-amber)' }}>
                                ⏳ Rendering
                              </span>
                            )}

                            {hasYt && (
                              <a
                                href={log.youtubeUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: '10.5px',
                                  color: 'var(--admin-accent-red)',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  marginLeft: '4px'
                                }}
                              >
                                YouTube ↗
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`admin-badge ${hasVideo || hasYt || log.status === 'COMPLETED' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                            ● {log.status || (hasVideo ? 'COMPLETED' : 'dispatched')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Video Preview Player Modal */}
      {previewVideo && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '640px', padding: '20px', background: '#0e121a', border: '1px solid var(--admin-border-glass)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--admin-accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {previewVideo.templateTitle || 'Autonomous AI Video'}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0 0', color: '#fff' }}>
                  {previewVideo.title || 'Generated AI Video'}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', margin: '2px 0 0 0' }}>
                  Generated for <strong>{previewVideo.userEmail}</strong> • {formatTimeAgo(previewVideo.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '4px 8px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Player */}
            <div style={{ borderRadius: '8px', overflow: 'hidden', background: '#000', marginBottom: '14px' }}>
              {previewVideo.videoUrl ? (
                <video
                  src={previewVideo.videoUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '55vh', display: 'block' }}
                />
              ) : previewVideo.youtubeUrl ? (
                <div style={{ padding: '30px', textAlign: 'center' }}>
                  <p style={{ color: '#fff', marginBottom: '12px' }}>This video is published directly to YouTube Shorts.</p>
                  <a
                    href={previewVideo.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> Open on YouTube
                  </a>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
                  No video link available for playback.
                </div>
              )}
            </div>

            {/* Prompt breakdown */}
            {previewVideo.prompt && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                fontSize: '11.5px',
                color: 'var(--admin-text-sub)',
                marginBottom: '14px',
                maxHeight: '60px',
                overflowY: 'auto'
              }}>
                <strong style={{ color: '#fff', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Story Prompt / Hook:</strong>
                {previewVideo.prompt}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {previewVideo.videoUrl && (
                <>
                  <a
                    href={previewVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="admin-btn admin-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '12px' }}
                  >
                    <Download size={13} /> Download MP4
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(previewVideo.videoUrl, 'modal-mp4')}
                    className="admin-btn admin-btn-secondary"
                    style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedLink === 'modal-mp4' ? <Check size={13} color="var(--admin-accent-green)" /> : <Copy size={13} />}
                    Copy MP4 Link
                  </button>
                </>
              )}

              {previewVideo.youtubeUrl && (
                <a
                  href={previewVideo.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn admin-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '12px', color: 'var(--admin-accent-red)' }}
                >
                  <Share2 size={13} /> YouTube Short ↗
                </a>
              )}

              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
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
