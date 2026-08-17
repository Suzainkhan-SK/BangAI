import React from 'react';
import { Wand2, Globe, Hash, Sparkles, MessageSquare } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function TopicPromptBuilder({ 
  topicInput, 
  setTopicInput, 
  language, 
  setLanguage,
  genre,
  setGenre,
  onApplyPrompt
}) {
  const quickIdeas = [
    'Bermuda Triangle Flight 19 mystery',
    'Talking Fruits viral supermarket escape comedy',
    'Dragons Eastern vs Western ancient war in CGI',
    'Ratan Tata last 24 hours emotional tribute',
    'Quantum Superintelligence 2050 deep dive',
    'Unsolved ancient civilizations under Sahara desert'
  ];

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wand2 size={16} color="#818cf8" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            Story Topic & AI Prompt
          </span>
        </div>
        <span className="badge-pill badge-indigo">
          Stage 0 Classifier
        </span>
      </div>

      {/* Textarea Input */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          placeholder="Describe your video idea, story premise, or paste any topic (e.g., 'Flight 19 mystery in Bermuda Triangle in Hinglish')..."
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(10, 15, 26, 0.8)',
            border: '1px solid var(--border-medium)',
            borderRadius: '12px',
            padding: '12px',
            color: '#ffffff',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-medium)')}
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          {topicInput.length} chars
        </div>
      </div>

      {/* AI Inspiration Chips */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} color="#f59e0b" />
          <span>Quick Inspiration Tags:</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {quickIdeas.map((idea, idx) => (
            <button
              key={idx}
              onClick={() => {
                audioEngine.playSfx('click');
                onApplyPrompt(idea);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(99, 102, 241, 0.15)';
                e.target.style.color = '#ffffff';
                e.target.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                e.target.style.color = 'var(--text-secondary)';
                e.target.style.borderColor = 'var(--border-subtle)';
              }}
            >
              + {idea.split(' ')[0]} {idea.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Language & Genre Dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Language */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Voiceover Language:
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(10, 15, 26, 0.8)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Hinglish">🇮🇳 Hinglish (70% Hindi / 30% English)</option>
              <option value="Hindi">🇮🇳 Pure Hindi (शुद्ध हिंदी)</option>
              <option value="English">🇺🇸 English (Global)</option>
              <option value="Spanish">🇪🇸 Spanish (Español)</option>
            </select>
          </div>
        </div>

        {/* Genre */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Story Category:
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(10, 15, 26, 0.8)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Mystery & Thriller">🔍 Mystery & Thriller</option>
            <option value="Mythology & Legends">🐉 Mythology & Legends</option>
            <option value="Animated Comedy">🍍 Animated Comedy (Pixar 3D)</option>
            <option value="Historical & Biography">💔 Historical & Biography</option>
            <option value="Sci-Fi & Future Tech">🚀 Sci-Fi & Quantum AI</option>
            <option value="Horror & Paranormal">👻 Horror & Paranormal</option>
          </select>
        </div>
      </div>
    </div>
  );
}
