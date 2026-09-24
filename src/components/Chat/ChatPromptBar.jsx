import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  Brain,
  Mic,
  MicOff,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  X,
  Sparkles,
  Wand2,
  Film,
  ChevronDown,
  Zap
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

const AVAILABLE_MODELS = [
  {
    key: 'bang-ai-auto',
    name: 'Bang AI 4.5 Auto',
    shortName: '4.5 Auto',
    badge: 'AUTO',
    badgeBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    desc: 'Smart router picks best model dynamically',
    icon: Sparkles
  },
  {
    key: 'bang-ai-ultra',
    name: 'Bang AI 4.5 Ultra',
    shortName: '4.5 Ultra',
    badge: '1M CONTEXT',
    badgeBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    desc: 'Flagship powerhouse • 65K output • Full code & video',
    icon: Zap
  },
  {
    key: 'bang-ai-thinking',
    name: 'Bang AI 4.5 Thinking',
    shortName: '4.5 Thinking',
    badge: 'REASONING',
    badgeBg: 'linear-gradient(135deg, #a855f7, #ec4899)',
    desc: 'Deep logic, math & multi-step thinking effort',
    icon: Brain
  },
  {
    key: 'bang-ai-search',
    name: 'Bang AI 4.5 Search',
    shortName: '4.5 Search',
    badge: 'LIVE WEB',
    badgeBg: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    desc: 'Real-time web browsing & news citations',
    icon: Globe
  },
  {
    key: 'bang-ai-flash',
    name: 'Bang AI 4.5 Flash',
    shortName: '4.5 Flash',
    badge: 'FASTEST',
    badgeBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    desc: 'Sub-second speed for quick drafting & brainstorming',
    icon: Sparkles
  },
  {
    key: 'bang-ai-coder',
    name: 'Bang AI 4.5 Coder',
    shortName: '4.5 Coder',
    badge: 'CODE & APPS',
    badgeBg: 'linear-gradient(135deg, #059669, #10b981)',
    desc: 'Portfolio sites, web apps, scripts & n8n automations',
    icon: Wand2
  },
  {
    key: 'bang-ai-vision',
    name: 'Bang AI 4.5 Vision',
    shortName: '4.5 Vision',
    badge: 'VISION',
    badgeBg: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    desc: 'Image analysis, diagram auditing & thumbnails',
    icon: ImageIcon
  }
];

export default function ChatPromptBar({
  theme = 'dark',
  selectedModelKey = 'bang-ai-auto',
  onSelectModelKey,
  onSendMessage,
  onStopGeneration,
  isLoading = false,
  webSearchEnabled = false,
  onToggleWebSearch,
  reasoningEnabled = false,
  onToggleReasoning,
  onSelectQuickAction
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ type: 'image'|'file', name, data, size }]
  const [menuOpen, setMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const menuRef = useRef(null);
  const modelMenuRef = useRef(null);
  const recognitionRef = useRef(null);

  const currentModel = AVAILABLE_MODELS.find((m) => m.key === selectedModelKey) || AVAILABLE_MODELS[0];
  const ActiveIcon = currentModel.icon;

  // Handle clicking outside the model popover
  useEffect(() => {
    function handleModelOutside(e) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setModelMenuOpen(false);
      }
    }
    if (modelMenuOpen) {
      document.addEventListener('mousedown', handleModelOutside);
      return () => document.removeEventListener('mousedown', handleModelOutside);
    }
  }, [modelMenuOpen]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setText((prev) => (prev ? prev + ' ' + transcript.trim() : transcript.trim()));
          }
        };

        recognition.onerror = (event) => {
          console.warn('[SpeechRecognition] Error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Close plus menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 200)}px`;
    }
  }, [text]);

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try { audioEngine.playSfx('click'); } catch (e) {}

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isLoading) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    try { audioEngine.playSfx('click'); } catch (e) {}

    onSendMessage({
      text: trimmed,
      attachments: [...attachments],
      webSearch: webSearchEnabled,
      reasoning: reasoningEnabled
    });

    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setAttachments((prev) => [
          ...prev,
          {
            type: 'image',
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            data: uploadEvent.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setMenuOpen(false);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const fileContent = uploadEvent.target.result;
        setAttachments((prev) => [
          ...prev,
          {
            type: 'file',
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            content: typeof fileContent === 'string' ? fileContent.substring(0, 200000) : ''
          }
        ]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
    setMenuOpen(false);
  };

  const handleAddLink = () => {
    const url = prompt('Enter a website or YouTube URL for Bang AI to analyze:');
    if (url && url.trim()) {
      setText((prev) => (prev ? `${prev}\nAnalyze this web link: ${url.trim()}` : `Analyze this web link: ${url.trim()}`));
    }
    setMenuOpen(false);
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSend = text.trim().length > 0 || attachments.length > 0;

  return (
    <div style={{
      width: '100%',
      maxWidth: '820px',
      margin: '0 auto',
      padding: '0 16px',
      position: 'relative'
    }}>
      {/* ─── HIDDEN FILE INPUTS ─── */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.csv,.js,.py,.html,.css"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ─── MAIN CHATGPT CAPSULE CONTAINER ─── */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '26px',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-prompt, 0 10px 30px rgba(0, 0, 0, 0.12))',
        backdropFilter: 'blur(16px)',
        padding: '10px 14px 10px 14px',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {/* Attachment Badges Tray */}
        {attachments.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-pill)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {att.type === 'image' ? (
                  <img
                    src={att.data}
                    alt={att.name}
                    style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                ) : (
                  <FileText size={14} color="#818cf8" />
                )}
                <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {att.name}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({att.size})</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
          {/* Plus Action Menu Button */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: menuOpen ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              title="Add attachments or actions"
            >
              <Paperclip size={16} />
            </button>

            {/* ChatGPT-style Popup Menu */}
            {menuOpen && (
              <div style={{
                position: 'absolute',
                bottom: '44px',
                left: '0',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: '16px',
                padding: '6px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 200,
                minWidth: '220px'
              }}>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ImageIcon size={16} color="#38bdf8" />
                  <span>Attach Image (Vision)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileText size={16} color="#10b981" />
                  <span>Upload Document</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LinkIcon size={16} color="#fbbf24" />
                  <span>Add Web Link</span>
                </button>

                {typeof onSelectQuickAction === 'function' && (
                  <>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                    <button
                      type="button"
                      onClick={() => { onSelectQuickAction('hook'); setMenuOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Sparkles size={16} color="#ec4899" />
                      <span>3s Viral Hook Crafter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { onSelectQuickAction('script'); setMenuOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Film size={16} color="#8b5cf6" />
                      <span>75s Golden Blueprint</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Auto-expanding Textarea */}
          <textarea
            ref={textareaRef}
            className="chat-prompt-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Listening... Speak now...' : 'Ask Bang AI anything, or search the web...'}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '15px',
              lineHeight: '1.4',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              padding: '6px 0',
              maxHeight: '200px',
              minHeight: '24px'
            }}
          />

          {/* Speech-to-Text Mic Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isRecording ? '#ef4444' : 'transparent',
                border: 'none',
                color: isRecording ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                boxShadow: isRecording ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none'
              }}
              title={isRecording ? 'Stop voice recording' : 'Voice input (Dictation)'}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          {/* Send / Stop Button */}
          {isLoading ? (
            <button
              type="button"
              onClick={() => {
                try { audioEngine.playSfx('click'); } catch (e) {}
                if (typeof onStopGeneration === 'function') onStopGeneration();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--text-primary)',
                border: 'none',
                color: 'var(--bg-app)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Stop generating"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: canSend ? 'var(--text-primary)' : 'var(--bg-input)',
                border: 'none',
                color: canSend ? 'var(--bg-app)' : 'var(--text-muted)',
                cursor: canSend ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              title="Send message"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Bottom Tools & Mode Pills Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '3px',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          {/* Left Mode Pill Badges & Model Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Model Selector Pill (Claude Desktop / ChatGPT Style) */}
            <div style={{ position: 'relative' }} ref={modelMenuRef}>
              <button
                type="button"
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '99px',
                  background: modelMenuOpen ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                  border: `1px solid ${modelMenuOpen ? 'var(--accent-primary, #6366f1)' : 'var(--border-subtle)'}`,
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Select Bang AI Model"
              >
                <ActiveIcon size={12} color="#6366f1" />
                <span>{currentModel.shortName}</span>
                <ChevronDown size={11} style={{ transform: modelMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', opacity: 0.7 }} />
              </button>

              {/* Claude Desktop Floating Popover */}
              {modelMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: 0,
                    width: '290px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-lg, 0 12px 30px -5px rgba(0,0,0,0.45))',
                    padding: '6px',
                    zIndex: 200,
                    backdropFilter: 'blur(16px)'
                  }}
                  className="thin-scroll"
                >
                  <div style={{
                    padding: '6px 8px 4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Bang AI Models
                  </div>
                  {AVAILABLE_MODELS.map((m) => {
                    const isSelected = m.key === selectedModelKey || (m.key === 'bang-ai-auto' && !selectedModelKey);
                    const IconComp = m.icon;
                    return (
                      <div
                        key={m.key}
                        onClick={() => {
                          try { audioEngine.playSfx('click'); } catch (e) {}
                          if (typeof onSelectModelKey === 'function') onSelectModelKey(m.key);
                          if (m.key === 'bang-ai-thinking' && !reasoningEnabled && typeof onToggleReasoning === 'function') {
                            onToggleReasoning(true);
                          }
                          if (m.key === 'bang-ai-search' && !webSearchEnabled && typeof onToggleWebSearch === 'function') {
                            onToggleWebSearch(true);
                          }
                          setModelMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 9px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--bg-input)' : 'transparent',
                          border: `1px solid ${isSelected ? 'var(--border-subtle)' : 'transparent'}`,
                          marginBottom: '3px',
                          transition: 'background 0.12s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg-input)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-card-hover)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? 'var(--accent-primary, #6366f1)' : 'var(--text-muted)',
                            flexShrink: 0
                          }}>
                            <IconComp size={13} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 600, color: 'var(--text-primary)' }}>
                              {m.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                              {m.desc}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: m.badgeBg,
                          color: '#fff',
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          marginLeft: '6px'
                        }}>
                          {m.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Pill */}
            <button
              type="button"
              onClick={() => {
                try { audioEngine.playSfx('click'); } catch (e) {}
                if (typeof onToggleWebSearch === 'function') onToggleWebSearch();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '99px',
                background: webSearchEnabled ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-input)',
                border: `1px solid ${webSearchEnabled ? 'rgba(14, 165, 233, 0.4)' : 'transparent'}`,
                color: webSearchEnabled ? 'var(--accent-cyan, #0284c7)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={webSearchEnabled ? 'Live Web Search is active' : 'Click to enable Live Web Search'}
            >
              <Globe size={11} />
              <span>Search</span>
              {webSearchEnabled && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0284c7' }} />
              )}
            </button>

            {/* Think / Deep Reasoning Pill with High / Off Effort */}
            <button
              type="button"
              onClick={() => {
                try { audioEngine.playSfx('click'); } catch (e) {}
                if (typeof onToggleReasoning === 'function') onToggleReasoning();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '99px',
                background: reasoningEnabled ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-input)',
                border: `1px solid ${reasoningEnabled ? 'rgba(168, 85, 247, 0.4)' : 'transparent'}`,
                color: reasoningEnabled ? 'var(--accent-secondary, #9333ea)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={reasoningEnabled ? 'Deep Reasoning Effort: High (Thinking Mode Active)' : 'Deep Reasoning Effort: Off'}
            >
              <Brain size={11} />
              <span>Deep Think: {reasoningEnabled ? 'High' : 'Off'}</span>
              {reasoningEnabled && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#9333ea', boxShadow: '0 0 5px #9333ea' }} />
              )}
            </button>
          </div>

          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Bang AI 4.5</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>1M Context • 65K Output</span>
          </div>
        </div>
      </div>

      {/* ChatGPT Footnote Disclaimer */}
      <div style={{
        textAlign: 'center',
        padding: '8px 0 2px 0',
        fontSize: '11px',
        color: 'var(--text-muted)',
        userSelect: 'none'
      }}>
        Bang AI can make mistakes. Verify important info and viral statistics.
      </div>
    </div>
  );
}
