import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  PanelLeft,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Share2,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Sparkles,
  Film,
  Globe,
  Brain,
  Bot,
  User as UserIcon,
  ChevronDown,
  ExternalLink,
  Flame,
  ArrowRight,
  Zap,
  Code2,
  Eye,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';
import ChatPromptBar from '../components/Chat/ChatPromptBar';
import ChatMessageContent from '../components/Chat/ChatMessageContent';
import WebSearchSources from '../components/Chat/WebSearchSources';
import ThinkingAccordion from '../components/Chat/ThinkingAccordion';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';

const STORAGE_KEY = 'bangai_chat_sessions';

function generateId() {
  return 'chat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
}

function getStoredSessions() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveSessions(sessions) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {}
}

// Curated Top Free Models with Bang AI 4.5 Series Minimalist Branding
export const CHAT_MODELS = [
  {
    key: 'bang-ai-auto',
    name: 'Bang AI 4.5 Auto',
    tag: 'Auto • Smart Router',
    badge: 'AUTO',
    badgeColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
    desc: 'Smart router picks the best model dynamically for your prompt.'
  },
  {
    key: 'bang-ai-ultra',
    name: 'Bang AI 4.5 Ultra',
    tag: '1M Context • 65K Output',
    badge: '1M TOKENS',
    badgeColor: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    desc: 'Flagship powerhouse with 1M context, 65K max output, vision, and full coding mastery.'
  },
  {
    key: 'bang-ai-thinking',
    name: 'Bang AI 4.5 Thinking',
    tag: 'Deep Reasoning • Logic',
    badge: 'REASONING',
    badgeColor: 'linear-gradient(135deg, #a855f7, #ec4899)',
    desc: 'Solves complex logic, multi-step math, deep architectures, and deep thinking effort.'
  },
  {
    key: 'bang-ai-search',
    name: 'Bang AI 4.5 Search',
    tag: 'Web Search • Live Citations',
    badge: 'LIVE WEB',
    badgeColor: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    desc: 'Real-time web browsing, latest news citations, and viral market analysis.'
  },
  {
    key: 'bang-ai-flash',
    name: 'Bang AI 4.5 Flash',
    tag: 'Fastest • Low Latency',
    badge: 'FASTEST',
    badgeColor: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    desc: 'Sub-second speed for quick drafting, rapid brainstorming, and instant answers.'
  },
  {
    key: 'bang-ai-coder',
    name: 'Bang AI 4.5 Coder',
    tag: 'Code & Full Apps',
    badge: 'CODER',
    badgeColor: 'linear-gradient(135deg, #059669, #10b981)',
    desc: 'Specialized for complete software apps, portfolio websites, automation, and scripts.'
  },
  {
    key: 'bang-ai-vision',
    name: 'Bang AI 4.5 Vision',
    tag: 'Vision • Image Analysis',
    badge: 'VISION',
    badgeColor: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    desc: 'Multimodal visual analysis for images, diagrams, thumbnails, and screenshots.'
  }
];

const STARTER_PROMPTS = [
  {
    icon: '💻',
    title: 'Build a Portfolio Website',
    desc: 'Generate a complete, modern, responsive portfolio website in HTML, CSS & JavaScript',
    prompt: 'Build me a complete, modern, and beautiful developer portfolio website in HTML, CSS, and Vanilla JavaScript with a sleek dark mode and interactive projects section.',
    webSearch: false
  },
  {
    icon: '🎬',
    title: '75s Golden Short Blueprint',
    desc: 'Full 5-scene high-retention script with hooks, camera prompts & loop CTA',
    prompt: 'Write a full 75-second 5-scene golden blueprint YouTube Short script about the mystery of the Mariana Trench with scene timings, visual camera cues, and voiceover pacing.',
    webSearch: false
  },
  {
    icon: '🌐',
    title: 'Live Web Trend Research',
    desc: 'Real-time search for trending topics, algorithm shifts & live citations',
    prompt: 'Search the live web and tell me the biggest viral trends and algorithm updates happening on YouTube Shorts right now.',
    webSearch: true
  },
  {
    icon: '🧠',
    title: 'Deep Thinking & Logic',
    desc: 'Tackle a multi-step logic problem or complex architecture with deep reasoning',
    prompt: 'Solve this riddle with high reasoning effort: A farmer has 17 sheep, and all but 9 die. How many are left? Think step by step.',
    webSearch: false
  }
];

export default function ChatPage({ user, theme, onToggleTheme, onNavigate }) {
  const [sessions, setSessions] = useState(getStoredSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [highlightedCitation, setHighlightedCitation] = useState(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Model Selection state (defaults to Smart Auto-Router)
  const [selectedModelKey, setSelectedModelKey] = useState(() => {
    try {
      return localStorage.getItem('bangai_chat_model') || 'bang-ai-auto';
    } catch (e) {
      return 'bang-ai-auto';
    }
  });

  const messagesEndRef = useRef(null);
  const activeSessionRef = useRef(null);
  const dropdownRef = useRef(null);
  const { isMobile } = useBreakpoint();

  // On mobile, auto-collapse sidebar
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // Read initial session from URL hash if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const match = hash.match(/#\/chat\/(chat-[a-zA-Z0-9-]+)/);
      if (match && match[1]) {
        setActiveSessionId(match[1]);
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Keep active session ref updated
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  activeSessionRef.current = activeSession;

  // Selected Model Object
  const currentModelConfig = useMemo(() => {
    return CHAT_MODELS.find((m) => m.key === selectedModelKey) || CHAT_MODELS[0];
  }, [selectedModelKey]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading]);

  // Stop text-to-speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ─── MODEL SWITCHING ───
  const handleSelectModel = (key) => {
    setSelectedModelKey(key);
    try {
      localStorage.setItem('bangai_chat_model', key);
      audioEngine.playSfx('click');
    } catch (e) {}
    setModelDropdownOpen(false);
  };

  // ─── SESSION CREATION & SWITCHING ───
  const handleNewChat = () => {
    try { audioEngine.playSfx('click'); } catch (e) {}
    setActiveSessionId(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + '#/chat');
    }
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectSession = (id) => {
    try { audioEngine.playSfx('click'); } catch (e) {}
    setActiveSessionId(id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + `#/chat/${id}`);
    }
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    try { audioEngine.playSfx('click'); } catch (e) {}
    if (!confirm('Are you sure you want to delete this chat?')) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname + '#/chat');
      }
    }
  };

  const handleStartRename = (e, s) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditingTitle(s.title || 'Untitled');
  };

  const handleSaveRename = (e) => {
    e?.stopPropagation();
    if (!editingId) return;
    const title = editingTitle.trim() || 'Untitled Chat';
    setSessions((prev) =>
      prev.map((s) => (s.id === editingId ? { ...s, title, updatedAt: Date.now() } : s))
    );
    setEditingId(null);
    setEditingTitle('');
  };

  const stopStreamingRef = useRef(false);

  // ─── STOP GENERATION HANDLER ───
  const handleStopGeneration = () => {
    stopStreamingRef.current = true;
    setIsLoading(false);
  };

  // ─── MESSAGE DISPATCH ───
  const handleSendMessage = async ({ text, attachments = [], webSearch, reasoning }) => {
    let currentId = activeSessionId;
    let targetSession = sessions.find((s) => s.id === currentId);

    // Create session if none exists
    if (!targetSession) {
      currentId = generateId();
      const firstTitle = text.length > 35 ? text.substring(0, 35) + '...' : text || 'New conversation';
      targetSession = {
        id: currentId,
        title: firstTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      setSessions((prev) => [targetSession, ...prev]);
      setActiveSessionId(currentId);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname + `#/chat/${currentId}`);
      }
    }

    const imageAttachments = attachments.filter((a) => a.type === 'image');
    const fileAttachments = attachments.filter((a) => a.type === 'file');

    let combinedPrompt = text;
    if (fileAttachments.length > 0) {
      const fileContext = fileAttachments
        .map((f) => `[File Attachment: ${f.name}]\n${f.content || ''}`)
        .join('\n\n');
      combinedPrompt = `${fileContext}\n\n${text}`.trim();
    }

    const userMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: combinedPrompt,
      rawText: text,
      attachments,
      timestamp: Date.now()
    };

    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const startTime = Date.now();

    // Placeholder message for live streaming and authentic thinking process
    const assistantPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      isThinking: !!reasoning,
      thinkingTime: 1,
      thoughtDuration: '2s',
      reasoningContent: '',
      webSearch: null,
      routing: null,
      timestamp: Date.now() + 1
    };

    // Update session with user message and streaming assistant placeholder
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentId
          ? {
              ...s,
              title: s.messages.length === 0 ? (text.substring(0, 35) || 'New conversation') : s.title,
              updatedAt: Date.now(),
              messages: [...s.messages, userMessage, assistantPlaceholder]
            }
          : s
      )
    );

    setIsLoading(true);
    stopStreamingRef.current = false;

    // Live thinking ticker (increments elapsed seconds every 1s)
    let thinkingSeconds = 1;
    let thinkingInterval = null;
    if (reasoning) {
      thinkingInterval = setInterval(() => {
        thinkingSeconds += 1;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, thinkingTime: thinkingSeconds } : m
                  )
                }
              : s
          )
        );
      }, 1000);
    }

    try {
      // Build conversation history for API payload (no low slicing!)
      const historyPayload = [
        ...(targetSession.messages || []).map((m) => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: combinedPrompt }
      ];

      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token') || ''}`
        },
        body: JSON.stringify({
          mode: 'CHAT',
          modelKey: selectedModelKey,
          message: combinedPrompt,
          messages: historyPayload,
          images: imageAttachments.map((img) => img.data),
          webSearch: !!webSearch,
          reasoning: !!reasoning,
          threadId: currentId
        })
      });

      const rawText = await res.text();
      if (thinkingInterval) clearInterval(thinkingInterval);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        if (res.status === 504 || rawText.includes('Inactivity Timeout') || rawText.includes('504')) {
          throw new Error('Server request timed out. Please ensure Live Web Search is toggled OFF for heavy code generation, or switch to Bang AI 4.5 Flash.');
        }
        if (res.status === 502) {
          throw new Error('Connection gateway error (502). Please check network and retry.');
        }
        throw new Error(`Server returned HTTP ${res.status}: ${rawText.slice(0, 90)}`);
      }

      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || `Server responded with ${res.status}`);
      }

      const totalThoughtSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const fullText = data.message || 'No response returned.';
      const actualReasoning = data.reasoningContent || '';

      // First update thinking status to complete and attach citations
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isThinking: false,
                        thoughtDuration: `${totalThoughtSec}s`,
                        reasoningContent: actualReasoning,
                        webSearch: data.webSearch || null,
                        routing: data.routing || null
                      }
                    : m
                )
              }
            : s
        )
      );

      // Real-time typewriter streaming animation (like ChatGPT)
      let currentIdx = 0;
      const totalChars = fullText.length;
      // High-speed chunking for long code blocks / apps so user sees progressive typing
      const chunkSize = totalChars > 2500 ? 16 : (totalChars > 800 ? 8 : 4);
      const delayMs = 16;

      await new Promise((resolve) => {
        const streamTimer = setInterval(() => {
          if (stopStreamingRef.current) {
            clearInterval(streamTimer);
            setSessions((prev) =>
              prev.map((s) =>
                s.id === currentId
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: fullText, isStreaming: false } : m
                      )
                    }
                  : s
              )
            );
            resolve();
            return;
          }

          currentIdx = Math.min(totalChars, currentIdx + chunkSize);
          const nextSlice = fullText.slice(0, currentIdx);
          const isDone = currentIdx >= totalChars;

          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: nextSlice, isStreaming: !isDone } : m
                    )
                  }
                : s
            )
          );

          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

          if (isDone) {
            clearInterval(streamTimer);
            resolve();
          }
        }, delayMs);
      });

      try { audioEngine.playSfx('boom'); } catch (e) {}
    } catch (err) {
      if (thinkingInterval) clearInterval(thinkingInterval);
      console.error('[ChatPage] Error sending message:', err);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `⚠️ **Error generating response:** ${err.message}\n\nPlease try again or verify your connection.`,
                        isError: true,
                        isStreaming: false,
                        isThinking: false
                      }
                    : m
                )
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
      stopStreamingRef.current = false;
    }
  };

  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    try { audioEngine.playSfx('click'); } catch (e) {}
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleToggleSpeak = (msgId, text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(msgId);
  };

  const handleRegenerate = (msgIdx) => {
    if (!activeSession || isLoading) return;
    const historyUpToLastUser = [];
    for (let i = 0; i <= msgIdx; i++) {
      if (activeSession.messages[i]?.role === 'user') {
        historyUpToLastUser.push(activeSession.messages[i]);
      }
    }
    const lastUser = historyUpToLastUser[historyUpToLastUser.length - 1];
    if (lastUser) {
      handleSendMessage({
        text: lastUser.rawText || lastUser.content,
        attachments: lastUser.attachments || [],
        webSearch: webSearchEnabled,
        reasoning: reasoningEnabled
      });
    }
  };

  // Convert script to video in Bang AI Studio
  const handleConvertToVideo = (content) => {
    try { audioEngine.playSfx('click'); } catch (e) {}
    localStorage.setItem('bangai_pending_creation_prompt', content.substring(0, 1500));
    if (typeof onNavigate === 'function') {
      onNavigate('dashboard');
    } else {
      window.location.hash = '#/dashboard';
    }
  };

  // Share / Export Chat
  const handleExportChat = () => {
    if (!activeSession || !activeSession.messages.length) return;
    const transcript = activeSession.messages
      .map((m) => `### ${m.role === 'user' ? 'User' : 'Bang AI'}\n\n${m.content}\n`)
      .join('\n---\n\n');
    navigator.clipboard.writeText(transcript);
    alert('Conversation transcript copied to clipboard!');
  };

  // ─── FILTER & GROUP SESSIONS ───
  const filteredSessions = useMemo(() => {
    if (!searchFilter.trim()) return sessions;
    const q = searchFilter.toLowerCase();
    return sessions.filter((s) => (s.title || '').toLowerCase().includes(q));
  }, [sessions, searchFilter]);

  const groupedSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const groups = { today: [], yesterday: [], last7Days: [], older: [] };

    filteredSessions.forEach((s) => {
      const diff = now - (s.updatedAt || s.createdAt || now);
      if (diff < oneDay) groups.today.push(s);
      else if (diff < 2 * oneDay) groups.yesterday.push(s);
      else if (diff < 7 * oneDay) groups.last7Days.push(s);
      else groups.older.push(s);
    });

    return [
      { key: 'today', title: 'Today', items: groups.today },
      { key: 'yesterday', title: 'Yesterday', items: groups.yesterday },
      { key: 'last7Days', title: 'Previous 7 Days', items: groups.last7Days },
      { key: 'older', title: 'Older', items: groups.older }
    ].filter((g) => g.items.length > 0);
  }, [filteredSessions]);

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - var(--nav-h, 58px))',
      width: '100vw',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* ─── LEFT COLLAPSIBLE CHATGPT SIDEBAR ─── */}
      <aside style={{
        width: sidebarOpen ? '260px' : '0px',
        minWidth: sidebarOpen ? '260px' : '0px',
        height: '100%',
        background: 'var(--bg-sidebar)',
        borderRight: sidebarOpen ? '1px solid var(--border-subtle)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        zIndex: 100
      }}>
        {/* Sidebar Header & New Chat Button */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handleNewChat}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} />
                <span>New chat</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>⌘K</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              style={{
                marginLeft: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close sidebar"
            >
              <PanelLeft size={16} />
            </button>
          </div>

          {/* Search history input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '6px 8px'
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '100%'
              }}
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 14px 10px' }} className="thin-scroll">
          {groupedSessions.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              No chat conversations yet.
            </div>
          ) : (
            groupedSessions.map((group) => (
              <div key={group.key} style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  padding: '6px 8px 4px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {group.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {group.items.map((s) => {
                    const isActive = s.id === activeSessionId;
                    const isEditing = editingId === s.id;

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 8px',
                          borderRadius: '8px',
                          background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          border: `1px solid ${isActive ? 'var(--border-medium)' : 'transparent'}`,
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'background 0.12s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'var(--bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {isEditing ? (
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              autoFocus
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              style={{
                                flex: 1,
                                background: 'var(--bg-input)',
                                border: '1px solid var(--accent-primary)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                padding: '2px 4px',
                                fontSize: '12px'
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleSaveRename}
                              style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              paddingRight: '6px'
                            }}>
                              {s.title || 'Untitled conversation'}
                            </div>

                            {isActive && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={(e) => handleStartRename(e, s)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                  title="Rename chat"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSession(e, s.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                  title="Delete chat"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          background: 'var(--bg-sidebar)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#fff'
            }}>
              {(user?.name || user?.email || 'B')[0].toUpperCase()}
            </div>
            <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{user?.name || 'Creator'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all conversation history?')) {
                setSessions([]);
                setActiveSessionId(null);
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '11px'
            }}
            title="Clear all chats"
          >
            Clear
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONVERSATION CANVAS ─── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--bg-app)'
      }}>
        {/* Top Header Bar */}
        <header style={{
          height: '52px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-app)',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Open sidebar"
              >
                <PanelLeft size={16} />
              </button>
            )}

            {/* Claude Desktop / Modern Clean App Header Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}>
                <Sparkles size={14} />
              </div>
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeSession?.title || 'Bang AI 4.5'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeSession && activeSession.messages.length > 0 && (
              <button
                type="button"
                onClick={handleExportChat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Copy chat transcript"
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>
            )}

            {typeof onToggleTheme === 'function' && (
              <button
                type="button"
                onClick={() => {
                  try { audioEngine.playSfx('click'); } catch (e) {}
                  onToggleTheme();
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#6366f1" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleNewChat}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Start new chat"
            >
              <Plus size={16} />
            </button>
          </div>
        </header>

        {/* Message Feed / Conversation Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 16px 140px 16px'
        }} className="thin-scroll">
          {/* Empty State / Welcome Screen */}
          {(!activeSession || activeSession.messages.length === 0) && (
            <div style={{
              width: '100%',
              maxWidth: '800px',
              margin: 'auto 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '24px'
            }}>
              {/* Bang AI Glowing Icon */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}>
                <Sparkles size={30} color="#fff" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 750, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                  What will we create today?
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '520px', lineHeight: 1.5 }}>
                  Supercharged with 1M context, 65K max output tokens, multi-modal vision analysis, 5-scene golden scripts, and live web citations.
                </p>
              </div>

              {/* Starter Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                width: '100%',
                marginTop: '8px'
              }}>
                {STARTER_PROMPTS.map((starter, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleSendMessage({
                        text: starter.prompt,
                        attachments: [],
                        webSearch: true,
                        reasoning: false
                      });
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '6px',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: 'var(--shadow-card)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                      e.currentTarget.style.borderColor = 'var(--border-medium)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ fontSize: '20px' }}>{starter.icon}</div>
                    <div style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text-primary)' }}>{starter.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                      {starter.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Messages Feed */}
          {activeSession && activeSession.messages.length > 0 && (
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {activeSession.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isAssistant = msg.role === 'assistant';

                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      width: '100%',
                      justifyContent: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {/* Assistant Avatar */}
                    {isAssistant && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                      }}>
                        <Sparkles size={16} color="#fff" />
                      </div>
                    )}

                    {/* Message Bubble Container */}
                    <div style={{
                      maxWidth: isUser ? '85%' : '100%',
                      flex: isAssistant ? 1 : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}>
                      {/* Attached Images & Files on User Messages */}
                      {isUser && msg.attachments && msg.attachments.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginBottom: '6px',
                          justifyContent: 'flex-end'
                        }}>
                          {msg.attachments.map((att, ai) => (
                            <div key={ai}>
                              {att.type === 'image' ? (
                                <img
                                  src={att.data}
                                  alt={att.name}
                                  style={{
                                    maxWidth: '180px',
                                    maxHeight: '120px',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    border: '1px solid var(--border-subtle)'
                                  }}
                                />
                              ) : (
                                <span style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)'
                                }}>
                                  📄 {att.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Auto-Routing Badge for Assistant */}
                      {isAssistant && msg.routing?.isAuto && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 9px',
                          borderRadius: '99px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#10b981',
                          fontSize: '11px',
                          fontWeight: 650,
                          marginBottom: '6px'
                        }}>
                          <Sparkles size={11} />
                          <span>Auto-routed to {msg.routing.name} ({msg.routing.reason})</span>
                        </div>
                      )}

                      {/* Message Content Bubble */}
                      <div style={{
                        padding: isUser ? '10px 16px' : '0',
                        borderRadius: isUser ? '20px' : '0',
                        background: isUser ? 'var(--bg-input)' : 'transparent',
                        color: 'var(--text-primary)',
                        border: isUser ? '1px solid var(--border-subtle)' : 'none',
                        width: '100%'
                      }}>
                        {/* Thinking Accordion if reasoning requested or thinking in progress or reasoningContent available */}
                        {isAssistant && (msg.reasoning || msg.isThinking || msg.reasoningContent) && (
                          <ThinkingAccordion
                            duration={msg.thoughtDuration || "3s"}
                            isThinking={msg.isThinking}
                            thinkingTime={msg.thinkingTime}
                            thoughtText={msg.reasoningContent}
                          />
                        )}

                        {/* Web Search Sources Cards */}
                        {isAssistant && msg.webSearch && (
                          <WebSearchSources
                            webSearch={msg.webSearch}
                            highlightedIndex={highlightedCitation}
                          />
                        )}

                        {/* Main Body */}
                        {isUser ? (
                          <div style={{ fontSize: '15px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {msg.rawText || msg.content}
                          </div>
                        ) : (
                          <ChatMessageContent
                            content={msg.content}
                            isStreaming={msg.isStreaming}
                            onCitationClick={(num) => setHighlightedCitation(num)}
                          />
                        )}
                      </div>

                      {/* Assistant Action Buttons Toolbar */}
                      {isAssistant && !msg.isStreaming && msg.content && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '8px'
                        }}>
                          {/* Copy Message */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedMessageId === msg.id ? '#10b981' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px'
                            }}
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            {copiedMessageId === msg.id && <span>Copied</span>}
                          </button>

                          {/* Read Aloud */}
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg.id, msg.content)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: speakingMessageId === msg.id ? '#818cf8' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px'
                            }}
                            title={speakingMessageId === msg.id ? 'Stop reading' : 'Read aloud'}
                          >
                            {speakingMessageId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                          </button>

                          {/* Regenerate */}
                          <button
                            type="button"
                            onClick={() => handleRegenerate(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px'
                            }}
                            title="Regenerate response"
                          >
                            <RotateCcw size={13} />
                          </button>

                          {/* Convert to Short */}
                          <button
                            type="button"
                            onClick={() => handleConvertToVideo(msg.content)}
                            style={{
                              marginLeft: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(99, 102, 241, 0.12)',
                              border: '1px solid rgba(99, 102, 241, 0.28)',
                              color: 'var(--accent-primary, #6366f1)',
                              fontSize: '11px',
                              fontWeight: 650,
                              cursor: 'pointer'
                            }}
                            title="Send this script to Bang AI Studio to render into a Short"
                          >
                            <Film size={11} />
                            <span>Convert to Short</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}>
                        {(user?.name || user?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Generating / Thinking skeleton wave */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Bottom Prompt Bar */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          paddingBottom: '16px',
          background: 'linear-gradient(to top, var(--bg-app) 70%, transparent 100%)',
          zIndex: 40
        }}>
          <ChatPromptBar
            theme={theme}
            selectedModelKey={selectedModelKey}
            onSelectModelKey={(key) => {
              setSelectedModelKey(key);
              try {
                localStorage.setItem('bangai_chat_model', key);
              } catch (e) {}
            }}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isLoading={isLoading}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
            reasoningEnabled={reasoningEnabled}
            onToggleReasoning={() => setReasoningEnabled(!reasoningEnabled)}
            onSelectQuickAction={(type) => {
              if (type === 'hook') {
                handleSendMessage({
                  text: 'Give me 5 viral 3-second opening hooks in English for a YouTube Short.',
                  attachments: [],
                  webSearch: webSearchEnabled,
                  reasoning: reasoningEnabled
                });
              } else if (type === 'script') {
                handleSendMessage({
                  text: 'Write a full 75-second 5-scene golden blueprint script for my YouTube Short.',
                  attachments: [],
                  webSearch: webSearchEnabled,
                  reasoning: reasoningEnabled
                });
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
