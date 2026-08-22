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
  Square
} from 'lucide-react';
import { VOICES } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';
import { detectMode } from '../../utils/detectIntent';

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
    label: 'Ask ShortsAI Claude Coach',
    desc: 'Ask anything about viral hooks, pacing, YouTube algorithms',
    icon: MessageSquare,
    color: '#0ea5e9',
    placeholder: 'Ask anything about retention, hooks, algorithms, or strategy...'
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

  const isGenerating = !!props.isGenerating;
  const textareaRef = useRef(null);

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
          borderRadius: '24px',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-prompt)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Top Direct Mode Switcher Pills + Auto-Upload Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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

          {/* Auto-Upload to YouTube Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setAutoUploadToYouTube(!autoUploadToYouTube);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: 700,
                border: `1px solid ${autoUploadToYouTube ? '#ef4444' : 'var(--border-subtle)'}`,
                background: autoUploadToYouTube ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-input)',
                color: autoUploadToYouTube ? '#ef4444' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="When enabled, n8n will automatically upload the finished 4K video to YouTube Shorts upon completion"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={autoUploadToYouTube ? '#ef4444' : 'currentColor'}>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Auto-Upload: {autoUploadToYouTube ? 'ON' : 'OFF'}</span>
            </button>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Command size={10} /> <code>/</code>
            </span>
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
              effectiveMode === 'CHAT' ? "Ask ShortsAI anything... (e.g. 'What makes a 3-second hook viral in Hindi?')" :
              effectiveMode === 'REFINE_STORY' ? "Tell ShortsAI how to refine the story... (e.g. 'Make hook more dramatic and focus on the ending')" :
              "Ask ShortsAI to generate any video... (Type '/' for commands or enter topic)"
            }
            rows={2}
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
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Quick Config Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={currentVoiceId}
                onChange={(e) => setVoiceValue(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  paddingRight: '14px'
                }}
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    🎙️ {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={currentStyleId}
                onChange={(e) => setStyleValue(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  paddingRight: '14px'
                }}
              >
                {VISUAL_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    🎨 {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={currentLanguage}
                onChange={(e) => setLanguageValue(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  paddingRight: '14px'
                }}
              >
                <option value="Hinglish">🗣️ Hinglish</option>
                <option value="Hindi">🗣️ Hindi</option>
                <option value="English">🗣️ English</option>
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
                width: '36px',
                height: '36px',
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
                width: '36px',
                height: '36px',
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
    </div>
  );
}
