import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowUp, 
  X, 
  Zap, 
  MessageSquare, 
  Wand2, 
  Film, 
  Flame, 
  Tag, 
  Command, 
  Loader2, 
  Globe, 
  Palette, 
  Mic, 
  Square,
  ChevronDown,
  Check,
  Plus,
  ExternalLink,
  Table,
  Layers,
  Star
} from 'lucide-react';
import { VOICES, VOICE_LANGUAGES, getVoiceById } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';
import { detectMode } from '../../utils/detectIntent';
import { useBreakpoint } from '../../hooks/useMediaQuery';

const SLASH_COMMANDS = [
  {
    cmd: '/video',
    mode: 'VIDEO_GENERATION',
    label: 'Generate 75s Video',
    desc: 'Full 5-act cinematic screenplay & audio pipeline',
    icon: Film,
    color: '#6366f1',
    placeholder: 'Enter a topic to generate a 75s YouTube Short...'
  },
  {
    cmd: '/chat',
    mode: 'CHAT',
    label: 'Ask Bang AI Coach',
    desc: 'Ask anything about viral hooks, pacing, YouTube algorithms',
    icon: MessageSquare,
    color: '#0ea5e9',
    placeholder: 'Ask anything about retention, hooks, algorithms, or strategy...'
  },
  {
    cmd: '/studio',
    mode: 'STUDIO',
    label: 'Audiovisual Studio Lab',
    desc: 'Test 21+ ElevenLabs voices, live subtitle rendering & BGM',
    icon: Sparkles,
    color: '#10b981',
    placeholder: 'Open Audiovisual Studio Lab to test voices, subtitles & music...'
  },
  {
    cmd: '/hook',
    mode: 'CHAT',
    label: 'Generate Viral Hooks',
    desc: 'Craft 3-second pattern interrupts for maximum retention',
    icon: Flame,
    color: '#f59e0b',
    placeholder: 'Enter topic to generate high-converting 3-second hooks...'
  },
  {
    cmd: '/twist',
    mode: 'REFINE_STORY',
    label: 'Add Shocking Plot Twist',
    desc: 'Inject an unpredictable climax beat into the screenplay',
    icon: Zap,
    color: '#8b5cf6',
    placeholder: 'Describe the plot twist or angle you want to inject...'
  },
  {
    cmd: '/tags',
    mode: 'CHAT',
    label: 'SEO Tags & Description',
    desc: 'Generate high-ranking YouTube tags and metadata',
    icon: Tag,
    color: '#10b981',
    placeholder: 'Enter topic to generate high-ranking tags & SEO description...'
  }
];

export default function CanvasPromptBar(props) {
  const promptValue = props.prompt ?? '';
  const setPromptValue = (val) => {
    if (typeof props.setPrompt === 'function') props.setPrompt(val);
    if (typeof props.onPromptChange === 'function') props.onPromptChange(val);
  };

  const currentVoiceId = props.voiceId || props.selectedVoice || 'adam';
  const activeVoiceObj = getVoiceById(currentVoiceId) || VOICES.find(v => v.id === currentVoiceId || v.elevenLabsId === currentVoiceId) || VOICES[0];
  const isCustomVoice = !VOICES.some(v => v.id === currentVoiceId || v.elevenLabsId === currentVoiceId);

  const setVoiceValue = (val) => {
    if (typeof props.setVoiceId === 'function') props.setVoiceId(val);
    if (typeof props.onVoiceChange === 'function') props.onVoiceChange(val);
  };

  const currentStyleId = props.styleId || props.selectedStyle || 'cinematic';
  const setStyleValue = (val) => {
    if (typeof props.setStyleId === 'function') props.setStyleId(val);
    if (typeof props.onStyleChange === 'function') props.onStyleChange(val);
  };

  const currentLanguage = props.language || props.selectedLanguage || 'Hinglish';
  const setLanguageValue = (val) => {
    if (typeof props.setLanguage === 'function') props.setLanguage(val);
    if (typeof props.onLanguageChange === 'function') props.onLanguageChange(val);
  };

  const autoUploadToYouTube = props.autoUploadToYouTube ?? false;
  const setAutoUploadToYouTube = props.setAutoUploadToYouTube || (() => {});

  const channels = props.channels || [];
  const selectedChannelId = props.selectedChannelId || '';
  const setChannelValue = (val) => {
    if (typeof props.setSelectedChannelId === 'function') props.setSelectedChannelId(val);
    if (typeof props.onChannelChange === 'function') props.onChannelChange(val);
  };

  const sheets = props.sheets || [];
  const selectedSheetId = props.selectedSheetId || '';
  const setSheetValue = (val) => {
    if (typeof props.setSelectedSheetId === 'function') props.setSelectedSheetId(val);
    if (typeof props.onSheetChange === 'function') props.onSheetChange(val);
  };

  const autoLogToSheet = props.autoLogToSheet ?? true;
  const setAutoLogToSheet = props.setAutoLogToSheet || (() => {});

  const activeChannel = channels.find(c => c.channelId === selectedChannelId) || (channels.length > 0 ? (channels.find(c => c.isDefault) || channels[0]) : null);
  const activeSheet = sheets.find(s => s.sheetId === selectedSheetId || s.spreadsheetId === selectedSheetId) || (sheets.length > 0 ? (sheets.find(s => s.isDefault) || sheets[0]) : null);

  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showSheetDropdown, setShowSheetDropdown] = useState(false);
  const channelDropdownRef = useRef(null);
  const sheetDropdownRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target)) {
        setShowChannelDropdown(false);
      }
      if (sheetDropdownRef.current && !sheetDropdownRef.current.contains(e.target)) {
        setShowSheetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGenerating = !!props.isGenerating;
  const textareaRef = useRef(null);
  const { isMobile, isXSmall, isTouch } = useBreakpoint();

  // Manual Mode Lock (null = auto-detect)
  const [explicitMode, setExplicitMode] = useState(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter slash commands based on input
  const slashQuery = promptValue.startsWith('/') ? promptValue.toLowerCase() : '';
  const filteredCommands = SLASH_COMMANDS.filter(c => 
    c.cmd.startsWith(slashQuery) || c.label.toLowerCase().includes(slashQuery.replace('/', ''))
  );

  // Determine Effective Mode
  const effectiveMode = explicitMode || (
    promptValue.startsWith('/chat') || promptValue.startsWith('/hook') || promptValue.startsWith('/tags') ? 'CHAT' :
    promptValue.startsWith('/refine') || promptValue.startsWith('/twist') ? 'REFINE_STORY' :
    promptValue.startsWith('/video') ? 'VIDEO_GENERATION' :
    detectMode(promptValue)
  );

  // Show/Hide Slash Menu based on typing "/"
  useEffect(() => {
    if (promptValue.startsWith('/') && !promptValue.includes(' ') && promptValue.length < 10) {
      setShowSlashMenu(true);
      setSelectedIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  }, [promptValue]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [promptValue]);

  const handleSelectCommand = (cmdObj) => {
    audioEngine.playSfx('click');
    setExplicitMode(cmdObj.mode);
    setPromptValue('');
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!promptValue.trim() || isGenerating) return;

    audioEngine.playSfx('boom');
    
    // Clean prompt of leading slash command if any
    let cleanedPrompt = promptValue;
    SLASH_COMMANDS.forEach(c => {
      if (cleanedPrompt.startsWith(c.cmd + ' ')) {
        cleanedPrompt = cleanedPrompt.replace(c.cmd + ' ', '');
      } else if (cleanedPrompt.startsWith(c.cmd)) {
        cleanedPrompt = cleanedPrompt.replace(c.cmd, '');
      }
    });

    const finalMode = effectiveMode;
    if (typeof props.onGenerate === 'function') props.onGenerate(finalMode, cleanedPrompt || promptValue);
    else if (typeof props.onSubmit === 'function') props.onSubmit(finalMode, cleanedPrompt || promptValue);
  };

  const handleKeyDown = (e) => {
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectCommand(filteredCommands[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{
      width: '100%',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* ─── 1. POPUP SLASH COMMAND AUTOCOMPLETE MENU ─────────────── */}
      {showSlashMenu && filteredCommands.length > 0 && (
        <div className="saas-card animate-float" style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          marginBottom: '12px',
          padding: '10px',
          borderRadius: '20px',
          border: '1.5px solid var(--border-glow)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-prompt)',
          zIndex: 200,
          maxHeight: '290px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '4px 10px 8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Slash Commands</span>
            <span>↑↓ Navigate • ↵ Select</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={cmd.cmd}
                  onClick={() => handleSelectCommand(cmd)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '12px',
                    background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    border: `1.5px solid ${isSelected ? cmd.color : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: `${cmd.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cmd.color,
                      border: `1px solid ${cmd.color}35`
                    }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{cmd.label}</span>
                        <code style={{ fontSize: '11px', color: cmd.color, background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>
                          {cmd.cmd}
                        </code>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {cmd.desc}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 2. GEMINI / GROK FLOATING PROMPT BOX ───────────────────────── */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-gemini-input)',
          border: '1.5px solid var(--border-glow)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '10px 12px' : '12px 18px',
          boxShadow: 'var(--shadow-prompt)',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '8px' : '10px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Top Direct Mode Switcher Pills + Auto-Upload Toggle
            On phones this collapses to a single horizontally swipeable rail so the
            prompt box stays short enough to leave the conversation visible. */}
        <div
          className={isMobile ? 'rail' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            overflowX: isMobile ? 'auto' : 'visible',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: isMobile ? 'nowrap' : 'wrap', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setExplicitMode(explicitMode === 'VIDEO_GENERATION' ? null : 'VIDEO_GENERATION');
              }}
              style={{
                background: effectiveMode === 'VIDEO_GENERATION' ? 'var(--grad-primary)' : 'var(--bg-input)',
                color: effectiveMode === 'VIDEO_GENERATION' ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${effectiveMode === 'VIDEO_GENERATION' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                borderRadius: '99px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Film size={12} />
              <span>/video</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setExplicitMode(explicitMode === 'CHAT' ? null : 'CHAT');
              }}
              style={{
                background: effectiveMode === 'CHAT' ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'var(--bg-input)',
                color: effectiveMode === 'CHAT' ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${effectiveMode === 'CHAT' ? '#0ea5e9' : 'var(--border-subtle)'}`,
                borderRadius: '99px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={12} />
              <span>/chat</span>
            </button>

          </div>

          {/* Target YouTube Channel & Google Sheet Selectors (Change Anytime) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            {/* 1. YouTube Channel Dropdown Popover */}
            <div ref={channelDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playSfx('click');
                  setShowChannelDropdown(!showChannelDropdown);
                  setShowSheetDropdown(false);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: activeChannel ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-subtle)',
                  background: activeChannel ? 'rgba(239, 68, 68, 0.14)' : 'var(--bg-input)',
                  color: activeChannel ? '#fca5a5' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Select target YouTube Channel for upload (Change anytime)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span style={{ maxWidth: isMobile ? '90px' : '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeChannel ? activeChannel.channelTitle : 'YouTube: Auto'}
                </span>
                <ChevronDown size={12} />
              </button>

              {showChannelDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '280px',
                  background: 'var(--bg-card, #121826)',
                  border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                  borderRadius: '16px',
                  padding: '10px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 200
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px 8px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                    SELECT YOUTUBE CHANNEL (CHANGE ANYTIME)
                  </div>

                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {channels.map((ch) => {
                      const isSelected = (selectedChannelId === ch.channelId) || (!selectedChannelId && ch.isDefault);
                      return (
                        <div
                          key={ch.channelId}
                          onClick={() => {
                            audioEngine.playSfx('click');
                            setChannelValue(ch.channelId);
                            setAutoUploadToYouTube(true);
                            setShowChannelDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            border: isSelected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            {ch.avatarUrl ? (
                              <img src={ch.avatarUrl} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                            ) : (
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                {ch.channelTitle?.[0] || 'Y'}
                              </div>
                            )}
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {ch.channelTitle}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {ch.customUrl || `@${ch.channelId.substring(0, 8)}`}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check size={14} color="#ef4444" />}
                        </div>
                      );
                    })}

                    <div
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setChannelValue('');
                        setShowChannelDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: !selectedChannelId ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        ⚡ Master Account (System Default)
                      </div>
                      {!selectedChannelId && <Check size={14} color="var(--accent-primary)" />}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChannelDropdown(false);
                        if (typeof props.onOpenProfile === 'function') props.onOpenProfile('youtube');
                        else window.location.hash = '#/profile';
                      }}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 6px'
                      }}
                    >
                      <Plus size={13} />
                      <span>+ Connect Channel in Profile</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-Upload</span>
                      <button
                        type="button"
                        onClick={() => setAutoUploadToYouTube(!autoUploadToYouTube)}
                        style={{
                          background: autoUploadToYouTube ? '#ef4444' : 'var(--bg-input)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '99px',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {autoUploadToYouTube ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Google Sheet Dropdown Popover */}
            <div ref={sheetDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playSfx('click');
                  setShowSheetDropdown(!showSheetDropdown);
                  setShowChannelDropdown(false);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: activeSheet ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-subtle)',
                  background: activeSheet ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-input)',
                  color: activeSheet ? '#6ee7b7' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Select Google Sheet to log video data (Change anytime)"
              >
                <Table size={13} color="#10b981" />
                <span style={{ maxWidth: isMobile ? '90px' : '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeSheet ? activeSheet.title : 'Sheets: Auto-Log'}
                </span>
                <ChevronDown size={12} />
              </button>

              {showSheetDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '280px',
                  background: 'var(--bg-card, #121826)',
                  border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                  borderRadius: '16px',
                  padding: '10px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 200
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px 8px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                    SELECT GOOGLE SHEET (CHANGE ANYTIME)
                  </div>

                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {sheets.map((s) => {
                      const isSelected = (selectedSheetId === s.sheetId) || (selectedSheetId === s.spreadsheetId) || (!selectedSheetId && s.isDefault);
                      return (
                        <div
                          key={s.sheetId || s.spreadsheetId}
                          onClick={() => {
                            audioEngine.playSfx('click');
                            setSheetValue(s.sheetId || s.spreadsheetId);
                            setAutoLogToSheet(true);
                            setShowSheetDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            border: isSelected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <Table size={16} color="#10b981" />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {s.title || 'Production Log'}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                Tab: {s.sheetName || 'Sheet1'}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check size={14} color="#10b981" />}
                        </div>
                      );
                    })}

                    <div
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setSheetValue('');
                        setShowSheetDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: !selectedSheetId ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        ⚡ Master Sheet (System Default)
                      </div>
                      {!selectedSheetId && <Check size={14} color="var(--accent-primary)" />}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSheetDropdown(false);
                        if (typeof props.onOpenProfile === 'function') props.onOpenProfile('sheets');
                        else window.location.hash = '#/profile';
                      }}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 6px'
                      }}
                    >
                      <Plus size={13} />
                      <span>+ Connect / Create Sheet in Profile</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-Log</span>
                      <button
                        type="button"
                        onClick={() => setAutoLogToSheet(!autoLogToSheet)}
                        style={{
                          background: autoLogToSheet ? '#10b981' : 'var(--bg-input)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '99px',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {autoLogToSheet ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isMobile && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Command size={10} /> <code>/</code>
              </span>
            )}
          </div>
        </div>

        {/* Text Input Row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <textarea
            ref={textareaRef}
            id="shorts-prompt-input"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder={
              isMobile
                ? (effectiveMode === 'CHAT'
                    ? 'Ask Bang AI anything…'
                    : effectiveMode === 'REFINE_STORY'
                      ? 'How should I refine the story?'
                      : "Describe your video idea… ('/' for commands)")
                : effectiveMode === 'CHAT' ? "Ask Bang AI anything... (e.g. 'What makes a 3-second hook viral in Hindi?')" :
                  effectiveMode === 'REFINE_STORY' ? "Tell Bang AI how to refine the story... (e.g. 'Make hook more dramatic and focus on the ending')" :
                  "Ask Bang AI to generate any video... (Type '/' for commands or enter topic)"
            }
            rows={isMobile ? 1 : 2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14.5px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              lineHeight: 1.5,
              resize: 'none',
              paddingRight: promptValue ? '32px' : '0'
            }}
            onKeyDown={handleKeyDown}
          />

          {promptValue && (
            <button
              type="button"
              onClick={() => {
                setPromptValue('');
                if (textareaRef.current) textareaRef.current.focus();
              }}
              style={{
                position: 'absolute',
                right: 0,
                top: '4px',
                background: 'var(--border-subtle)',
                border: 'none',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Clear input"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Settings Dropdowns + Send Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: '8px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Quick Config Dropdowns — one swipeable line on phones */}
          <div
            className={isMobile ? 'rail' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              overflowX: isMobile ? 'auto' : 'visible',
              minWidth: 0,
              flex: 1
            }}
          >
            {/* 1. Voice Selector Pill */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <select
                value={currentVoiceId}
                aria-label="Narration voice"
                onChange={(e) => {
                  if (e.target.value === '__open_studio__') {
                    if (typeof props.onOpenStudio === 'function') props.onOpenStudio('voices');
                    return;
                  }
                  setVoiceValue(e.target.value);
                }}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  paddingTop: isTouch ? '7px' : '5px',
                  paddingBottom: isTouch ? '7px' : '5px',
                  paddingLeft: isTouch ? '14px' : '12px',
                  paddingRight: '14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  maxWidth: isMobile ? '54vw' : 'none',
                  textOverflow: 'ellipsis'
                }}
              >
                {/* If selected voice is from 9,650 JSON2Video library, display it prominently */}
                {isCustomVoice && activeVoiceObj && (
                  <option value={activeVoiceObj.id}>
                    💎 {activeVoiceObj.name} ({activeVoiceObj.flag || activeVoiceObj.language || 'Premium'})
                  </option>
                )}
                <optgroup label="⚡ Native ElevenLabs Voices">
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      🎙️ {v.name} ({v.flag || v.gender || 'Universal'})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 Full Voice Library">
                  <option value="__open_studio__">🌐 Browse 9,650+ Voices in Studio...</option>
                </optgroup>
              </select>
            </div>

            {/* 2. Visual Style Preference Pill */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <select
                value={currentStyleId}
                onChange={(e) => setStyleValue(e.target.value)}
                aria-label="Visual style preference"
                title="Style Preference: AI will adapt cinematography based on your selected visual style"
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  paddingTop: isTouch ? '7px' : '5px',
                  paddingBottom: isTouch ? '7px' : '5px',
                  paddingLeft: isTouch ? '14px' : '12px',
                  paddingRight: '14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  maxWidth: isMobile ? '54vw' : 'none',
                  textOverflow: 'ellipsis'
                }}
              >
                {VISUAL_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    🎨 Style Preference: {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Language Pill */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <select
                value={currentLanguage}
                onChange={(e) => setLanguageValue(e.target.value)}
                aria-label="Narration language"
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  paddingTop: isTouch ? '7px' : '5px',
                  paddingBottom: isTouch ? '7px' : '5px',
                  paddingLeft: isTouch ? '14px' : '12px',
                  paddingRight: '14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  maxWidth: isMobile ? '54vw' : 'none',
                  textOverflow: 'ellipsis'
                }}
              >
                <option value="Hinglish">🔮 Hinglish (Hindi + English)</option>
                {VOICE_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.label}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Target YouTube Channel Pill */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <select
                value={selectedChannelId}
                onChange={(e) => {
                  if (e.target.value === '__connect_channel__') {
                    if (typeof props.onOpenProfile === 'function') props.onOpenProfile('youtube');
                    else window.location.hash = '#/profile';
                    return;
                  }
                  setChannelValue(e.target.value);
                  if (e.target.value && !autoUploadToYouTube) {
                    setAutoUploadToYouTube(true);
                  }
                }}
                aria-label="Target YouTube Channel"
                title="Target YouTube Channel: AI will generate and upload your Short to this specific channel"
                style={{
                  background: selectedChannelId ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-input)',
                  color: selectedChannelId ? '#fca5a5' : 'var(--text-secondary)',
                  border: selectedChannelId ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  paddingTop: isTouch ? '7px' : '5px',
                  paddingBottom: isTouch ? '7px' : '5px',
                  paddingLeft: isTouch ? '14px' : '12px',
                  paddingRight: '14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  maxWidth: isMobile ? '54vw' : 'none',
                  textOverflow: 'ellipsis'
                }}
              >
                {channels.length > 0 ? (
                  <>
                    <optgroup label="🔴 Connected YouTube Channels">
                      {channels.map((ch) => (
                        <option key={ch.channelId} value={ch.channelId}>
                          🔴 {ch.channelTitle} {ch.customUrl ? `(${ch.customUrl})` : ''}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚙️ Channel Options">
                      <option value="">⚡ Master Account (System Default)</option>
                      <option value="__connect_channel__">➕ Manage Channels in Profile...</option>
                    </optgroup>
                  </>
                ) : (
                  <>
                    <option value="">⚡ Master Account (Default)</option>
                    <option value="__connect_channel__">🔴 + Connect YouTube Channel...</option>
                  </>
                )}
              </select>
            </div>

            {/* 5. Production Google Sheet Pill */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <select
                value={selectedSheetId}
                onChange={(e) => {
                  if (e.target.value === '__connect_sheet__') {
                    if (typeof props.onOpenProfile === 'function') props.onOpenProfile('sheets');
                    else window.location.hash = '#/profile';
                    return;
                  }
                  setSheetValue(e.target.value);
                  if (e.target.value && !autoLogToSheet) {
                    setAutoLogToSheet(true);
                  }
                }}
                aria-label="Production Google Sheet"
                title="Google Sheet: Logs metadata, prompts, tags, script, and YouTube URLs to this spreadsheet"
                style={{
                  background: selectedSheetId ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                  color: selectedSheetId ? '#6ee7b7' : 'var(--text-secondary)',
                  border: selectedSheetId ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  paddingTop: isTouch ? '7px' : '5px',
                  paddingBottom: isTouch ? '7px' : '5px',
                  paddingLeft: isTouch ? '14px' : '12px',
                  paddingRight: '14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  maxWidth: isMobile ? '54vw' : 'none',
                  textOverflow: 'ellipsis'
                }}
              >
                {sheets.length > 0 ? (
                  <>
                    <optgroup label="📊 Connected Google Sheets">
                      {sheets.map((s) => (
                        <option key={s.sheetId || s.spreadsheetId} value={s.sheetId || s.spreadsheetId}>
                          📊 {s.title || 'Production Log'} ({s.sheetName || 'Sheet1'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚙️ Sheet Options">
                      <option value="">⚡ Master Sheet (System Default)</option>
                      <option value="__connect_sheet__">➕ Add / Connect Sheet in Profile...</option>
                    </optgroup>
                  </>
                ) : (
                  <>
                    <option value="">⚡ Production Log Sheet (Default)</option>
                    <option value="__connect_sheet__">📊 + Connect / Create Google Sheet...</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                audioEngine.playSfx('click');
                if (typeof props.onStop === 'function') props.onStop();
              }}
              style={{
                width: isTouch ? '42px' : '36px',
                height: isTouch ? '42px' : '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.55)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              title="Stop / Terminate Generation"
            >
              <Square size={13} fill="#ffffff" strokeWidth={0} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!promptValue.trim()}
              style={{
                width: isTouch ? '42px' : '36px',
                height: isTouch ? '42px' : '36px',
                borderRadius: '50%',
                background: promptValue.trim() ? 'var(--grad-gemini)' : 'var(--bg-input)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: promptValue.trim() ? '#ffffff' : 'var(--text-muted)',
                cursor: promptValue.trim() ? 'pointer' : 'not-allowed',
                boxShadow: promptValue.trim() ? '0 0 20px rgba(56, 189, 248, 0.45)' : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              title="Send (Enter)"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>

      {/* Style & Prompt Priority Helper Note — desktop only; on phones the
          vertical space is better spent on the conversation above the bar. */}
      {!isMobile && (
      <div style={{
        marginTop: '6px',
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px'
      }}>
        <span>💡</span>
        <span>
          <strong>Tip:</strong> You can also name a style directly in your prompt, e.g. <em>"anime style"</em>, <em>"documentary look"</em> — words in your prompt take priority.
        </span>
      </div>
      )}
    </div>
  );
}
