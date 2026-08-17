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
  HelpCircle,
  Command
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
    color: 'var(--accent-primary)',
    placeholder: 'Enter a topic to generate a 75s YouTube Short...'
  },
  {
    cmd: '/chat',
    mode: 'CHAT',
    label: 'Ask ShortsAI Claude Coach',
    desc: 'Ask anything about viral hooks, pacing, YouTube algorithms',
    icon: MessageSquare,
    color: 'var(--accent-cyan)',
    placeholder: 'Ask anything about retention, hooks, algorithms, or strategy...'
  },
  {
    cmd: '/refine',
    mode: 'REFINE_STORY',
    label: 'Refine Current Story',
    desc: 'Improve story brief, tighten hook, or add mystery',
    icon: Wand2,
    color: '#ec4899',
    placeholder: 'How would you like to improve this story? (e.g. make hook scarier)...'
  },
  {
    cmd: '/hook',
    mode: 'CHAT',
    label: '5 Viral Hooks Generator',
    desc: 'Generate 5 high-retention 3-second opening hooks',
    icon: Flame,
    color: '#f59e0b',
    placeholder: 'Enter your topic to generate 5 shocking 3-second hooks...'
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

  const currentMusicId = props.musicId || props.selectedMusic || 'mystery';
  const setMusicValue = (val) => {
    if (typeof props.setMusicId === 'function') props.setMusicId(val);
    if (typeof props.onMusicChange === 'function') props.onMusicChange(val);
  };

  const currentLanguage = props.language || props.selectedLanguage || 'Hinglish';
  const setLanguageValue = (val) => {
    if (typeof props.setLanguage === 'function') props.setLanguage(val);
    if (typeof props.onLanguageChange === 'function') props.onLanguageChange(val);
  };

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
      maxWidth: '780px',
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
          marginBottom: '10px',
          padding: '8px',
          borderRadius: '18px',
          border: '1.5px solid var(--border-glow)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-prompt)',
          zIndex: 200,
          maxHeight: '280px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '10.5px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '4px 8px 8px 8px',
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
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.cmd}
                  onClick={() => handleSelectCommand(cmd)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cmd.color,
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{cmd.label}</span>
                        <code style={{ fontSize: '11px', color: cmd.color, background: 'var(--bg-input)', padding: '1px 6px', borderRadius: '4px' }}>
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

      {/* ─── 2. GEMINI FLOATING PROMPT BOX ───────────────────────── */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-gemini-input)',
          border: '1.5px solid var(--border-glow)',
          borderRadius: '26px',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-prompt)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Top Direct Mode Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Film size={11} />
              <span>/video</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setExplicitMode(explicitMode === 'CHAT' ? null : 'CHAT');
              }}
              style={{
                background: effectiveMode === 'CHAT' ? 'var(--grad-gemini)' : 'var(--bg-input)',
                color: effectiveMode === 'CHAT' ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${effectiveMode === 'CHAT' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                borderRadius: '99px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={11} />
              <span>/chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setExplicitMode(explicitMode === 'REFINE_STORY' ? null : 'REFINE_STORY');
              }}
              style={{
                background: effectiveMode === 'REFINE_STORY' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'var(--bg-input)',
                color: effectiveMode === 'REFINE_STORY' ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${effectiveMode === 'REFINE_STORY' ? '#ec4899' : 'var(--border-subtle)'}`,
                borderRadius: '99px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Wand2 size={11} />
              <span>/refine</span>
            </button>
          </div>

          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Command size={10} /> Type <code>/</code> for commands
          </span>
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
              effectiveMode === 'REFINE_STORY' ? "Tell ShortsAI how to refine the story... (e.g. 'Make hook more dramatic')" :
              "Ask ShortsAI to generate any video... (Type '/' for commands or enter topic)"
            }
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              lineHeight: 1.45,
              resize: 'none',
              paddingRight: promptValue ? '28px' : '0'
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
                top: '2px',
                background: 'var(--border-subtle)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Settings Pills + Send Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '4px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Quick Config Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <select
              value={currentVoiceId}
              onChange={(e) => setVoiceValue(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  🎙️ {v.name} ({v.gender})
                </option>
              ))}
            </select>

            <select
              value={currentStyleId}
              onChange={(e) => setStyleValue(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {VISUAL_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  🎨 {s.name}
                </option>
              ))}
            </select>

            <select
              value={currentLanguage}
              onChange={(e) => setLanguageValue(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Hinglish">🗣️ Hinglish</option>
              <option value="Hindi">🗣️ Hindi</option>
              <option value="English">🗣️ English</option>
            </select>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!promptValue.trim() || isGenerating}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: promptValue.trim() ? 'var(--grad-gemini)' : 'var(--bg-input)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: promptValue.trim() ? '#ffffff' : 'var(--text-muted)',
              cursor: promptValue.trim() && !isGenerating ? 'pointer' : 'not-allowed',
              boxShadow: promptValue.trim() ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
