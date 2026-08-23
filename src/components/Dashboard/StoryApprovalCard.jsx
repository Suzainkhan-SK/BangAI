import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Flame, 
  Layers, 
  Volume2, 
  Clock, 
  FileText, 
  Check, 
  ArrowRight,
  Loader2,
  Film,
  Wand2,
  ChevronDown,
  ChevronUp,
  Zap,
  Tag,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

// Canonical Preset Definitions for Story Brief (Stage 1)
const STORY_PRESETS = [
  {
    id: 'title_only',
    label: 'Refine Title Only',
    mode: 'title_only',
    icon: '🔥',
    canonicalPrompt: 'Refine only the suggestedTitle of the story brief. Do not change viralHook or storyBrief.'
  },
  {
    id: 'hook_only',
    label: 'Refine Hook Only',
    mode: 'hook_only',
    icon: '⚡',
    canonicalPrompt: 'Refine only the viralHook (3-second hook) for maximum curiosity and retention. Do not change suggestedTitle or storyBrief.'
  },
  {
    id: 'brief_only',
    label: 'Refine Story Brief Only',
    mode: 'brief_only',
    icon: '📝',
    canonicalPrompt: 'Refine only the 5-act narrative storyBrief. Maintain the suggestedTitle and viralHook.'
  },
  {
    id: 'emotional',
    label: 'Make It More Emotional',
    mode: 'tone_shift',
    icon: '❤️',
    canonicalPrompt: 'Adjust the tone of the story brief to be deeply emotional, heartfelt, and resonant.'
  },
  {
    id: 'dramatic',
    label: 'Make It More Dramatic',
    mode: 'tone_shift',
    icon: '🎭',
    canonicalPrompt: 'Inject high tension, intense drama, and suspense throughout the story brief.'
  },
  {
    id: 'funnier',
    label: 'Make It Funnier',
    mode: 'tone_shift',
    icon: '😂',
    canonicalPrompt: 'Adjust the tone of the story brief to be witty, entertaining, comedic, and humorous.'
  },
  {
    id: 'simplify_lang',
    label: 'Simplify The Language',
    mode: 'language_shift',
    icon: '🗣️',
    canonicalPrompt: 'Simplify the vocabulary and language structure of the story brief so it is easy to understand for everyone.'
  },
  {
    id: 'full_story',
    label: 'Full Refine',
    mode: 'full',
    icon: '✨',
    canonicalPrompt: 'Perform a complete creative polish across title, 3-second hook, and 5-act narrative brief for peak viral retention.'
  }
];

// Canonical Preset Definitions for Screenplay (Stage 2 - 5 Scenes)
const SCREENPLAY_PRESETS = [
  {
    id: 'voiceover_only',
    label: 'Refine Voiceover Text Only',
    mode: 'voiceover_only',
    icon: '🎙️',
    canonicalPrompt: 'Refine only the voiceoverText of all 5 scenes. Do not change any videoPrompt.'
  },
  {
    id: 'visuals_only',
    label: 'Refine Visual Prompts Only',
    mode: 'visuals_only',
    icon: '🎨',
    canonicalPrompt: 'Refine only the videoPrompt visual prompts for all 5 scenes. Do not change the voiceoverText.'
  },
  {
    id: 'length_fix',
    label: 'Fix Voiceover Length Only',
    mode: 'length_fix',
    icon: '📏',
    canonicalPrompt: 'Strictly adjust the voiceoverText length across all 5 scenes to hit the exact 190-200 character target per scene.'
  },
  {
    id: 'cinematic_visuals',
    label: 'Make Visuals More Cinematic',
    mode: 'visuals_only',
    icon: '🎥',
    canonicalPrompt: 'Elevate the videoPrompt visual prompts across all scenes with cinematic 8k lighting, dynamic camera motion, and vivid atmosphere.'
  },
  {
    id: 'hook_scene',
    label: 'Strengthen The Hook Scene',
    mode: 'scene_specific',
    scenes: [1],
    icon: '🪝',
    canonicalPrompt: 'Strengthen Scene 1 (0-15s hook) voiceover and visual prompt for immediate pattern interrupt and retention.'
  },
  {
    id: 'full_scenes',
    label: 'Full Refine',
    mode: 'full',
    icon: '✨',
    canonicalPrompt: 'Perform a comprehensive full refinement of voiceoverText and videoPrompt across all 5 scenes.'
  }
];

export default function StoryApprovalCard({
  story,
  scenes,
  onApprove,
  onReject,
  onRefine,
  threadLanguage = 'English',
  isSubmitting = false
}) {
  const [approvedState, setApprovedState] = useState(null);
  const [showAllScenes, setShowAllScenes] = useState(true);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [selectedScenes, setSelectedScenes] = useState([]); // [1, 2, 3, 4, 5] for scene-specific
  const [isRefining, setIsRefining] = useState(false);

  if (!story) return null;

  const displayScenes = (scenes && Array.isArray(scenes) && scenes.length > 0) 
    ? scenes 
    : (story.scenes && Array.isArray(story.scenes) ? story.scenes : null);

  const isFinalScenesStage = !!displayScenes;

  // Refinement result metadata from n8n callback
  const changeSummary = story.changeSummary || null;
  const changedFields = Array.isArray(story.changedFields) ? story.changedFields : [];
  const changedScenes = Array.isArray(story.changedScenes) ? story.changedScenes : [];
  const refineFailed = story.refineFailed === true;
  const failReason = story.failReason || null;
  const refineRound = story.refineRound || 1;

  // Helper to check if a field changed
  const isFieldChanged = (fieldName) => {
    return changedFields.includes(fieldName) || 
           (fieldName === 'title' && (changedFields.includes('suggestedTitle') || changedFields.includes('title'))) ||
           (fieldName === 'viralHook' && (changedFields.includes('viralHook') || changedFields.includes('hook'))) ||
           (fieldName === 'storyBrief' && (changedFields.includes('storyBrief') || changedFields.includes('brief')));
  };

  // Helper to check if a scene changed
  const isSceneChanged = (sceneNum, sceneObj) => {
    return changedScenes.includes(sceneNum) || 
           changedScenes.includes(sceneNum - 1) || 
           sceneObj?.refined === true;
  };

  // Character count color helper for 190-200 target
  const getCharCountBadgeStyle = (charCount) => {
    if (charCount >= 190 && charCount <= 200) {
      return {
        color: '#10b981',
        background: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        status: 'Optimal (190-200)'
      };
    } else if ((charCount >= 180 && charCount < 190) || (charCount > 200 && charCount <= 210)) {
      return {
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        status: 'Acceptable (180-210)'
      };
    } else {
      return {
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        status: charCount < 180 ? 'Too Short (<180)' : 'Too Long (>210)'
      };
    }
  };

  const handleApprove = () => {
    audioEngine.playSfx('success');
    setApprovedState('approved');
    onApprove(story.approveUrl);
  };

  const handleReject = () => {
    audioEngine.playSfx('click');
    setApprovedState('rejected');
    onReject(story.cancelUrl);
  };

  // Toggle scene selection for scene-specific refinement
  const toggleSceneSelect = (sceneNum) => {
    audioEngine.playSfx('click');
    setSelectedScenes(prev => {
      if (prev.includes(sceneNum)) {
        return prev.filter(n => n !== sceneNum);
      } else {
        return [...prev, sceneNum].sort((a, b) => a - b);
      }
    });
  };

  // Select/Unselect Preset
  const handleSelectPreset = (preset) => {
    audioEngine.playSfx('click');
    if (selectedPresetId === preset.id) {
      setSelectedPresetId(null);
      if (preset.mode === 'scene_specific') setSelectedScenes([]);
    } else {
      setSelectedPresetId(preset.id);
      if (preset.scenes) {
        setSelectedScenes(preset.scenes);
      } else if (preset.mode === 'scene_specific') {
        if (selectedScenes.length === 0) setSelectedScenes([1]);
      } else {
        setSelectedScenes([]);
      }
    }
  };

  const handleRefineSubmit = (e) => {
    if (e) e.preventDefault();
    if (isRefining) return;

    // Find active preset if selected
    const activePresetList = isFinalScenesStage ? SCREENPLAY_PRESETS : STORY_PRESETS;
    const activePreset = activePresetList.find(p => p.id === selectedPresetId);

    let refineMode = activePreset?.mode || (selectedScenes.length > 0 ? 'scene_specific' : 'full');
    let refineScenes = selectedScenes;
    let presetCanonicalSentence = activePreset?.canonicalPrompt || '';

    // If scenes are manually selected
    if (selectedScenes.length > 0 && refineMode !== 'scene_specific') {
      refineMode = 'scene_specific';
    }

    if (refineMode === 'scene_specific' && selectedScenes.length > 0 && !presetCanonicalSentence) {
      presetCanonicalSentence = `Refine only Scene ${selectedScenes.join(', ')}. Keep all other scenes completely unchanged.`;
    }

    const freeText = refineText.trim();

    // Build human-readable refinePrompt according to contract:
    // If user typed free text only: send free text.
    // If user only clicked a preset: send preset canonical sentence.
    // If user did both: send preset sentence + " Additional instruction from creator: " + free text.
    let finalRefinePrompt = '';
    if (presetCanonicalSentence && freeText) {
      finalRefinePrompt = `${presetCanonicalSentence} Additional instruction from creator: ${freeText}`;
    } else if (presetCanonicalSentence && !freeText) {
      finalRefinePrompt = presetCanonicalSentence;
    } else if (!presetCanonicalSentence && freeText) {
      finalRefinePrompt = freeText;
    }

    if (!finalRefinePrompt.trim()) return;

    audioEngine.playSfx('shimmer');
    setIsRefining(true);

    if (typeof onRefine === 'function') {
      onRefine({
        refinePrompt: finalRefinePrompt.trim(),
        refineMode,
        refineScenes: refineMode === 'scene_specific' ? refineScenes : [],
        actionType: isFinalScenesStage ? 'REFINE_SCENES' : 'REFINE_STORY',
        approveUrl: story?.approveUrl || story?.resumeUrl || story?.cancelUrl
      });
    }
  };

  return (
    <div className="saas-card animate-float" style={{
      maxWidth: '840px',
      margin: '0 auto 28px auto',
      padding: '24px',
      border: `2px solid ${isFinalScenesStage ? '#10b981' : 'var(--accent-primary)'}`,
      boxShadow: isFinalScenesStage ? '0 12px 40px rgba(16, 185, 129, 0.25)' : '0 12px 40px rgba(99, 102, 241, 0.25)',
      background: 'var(--bg-card)',
      borderRadius: '20px'
    }}>
      {/* ─── 0. REFINEMENT RESULT BANNERS ─────────────────────────────── */}
      {/* Case A: Refinement Failure Banner */}
      {refineFailed && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444', marginBottom: '2px' }}>
                Refinement Constraints Not Met
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {failReason || 'The AI Doctor could not satisfy your exact constraints. Please adjust instructions and retry.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRefineOpen(true)}
            className="btn-outline"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              fontSize: '11.5px',
              padding: '4px 10px',
              flexShrink: 0,
              gap: '4px'
            }}
          >
            <RefreshCw size={12} />
            <span>Retry Refine</span>
          </button>
        </div>
      )}

      {/* Case B: Refinement Success / Change Summary Banner */}
      {!refineFailed && changeSummary && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={18} color="#10b981" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                Refinement Applied (Round {refineRound})
              </span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10.5px' }}>
                ✓ Updated
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {changeSummary}
            </div>
          </div>
        </div>
      )}

      {/* ─── 1. TOP HEADER BANNER ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: isFinalScenesStage ? 'linear-gradient(135deg, #10b981, #38bdf8)' : 'var(--grad-gemini)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isFinalScenesStage ? <Film size={16} color="#ffffff" /> : <Sparkles size={16} color="#ffffff" />}
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isFinalScenesStage ? '🎬 Final 5-Scene Production Screenplay Ready for Approval' : '⚡ AI Story Ready for Review & Approval'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isFinalScenesStage 
                ? 'Review 5 scene voiceovers (190-200 chars) & visual prompts • Approve or refine with presets below' 
                : 'Generated by n8n Strategy Engine • 75s (5 Acts) • Approve or refine with presets below'}
            </div>
          </div>
        </div>

        <span className={`badge ${isFinalScenesStage ? 'badge-cyan' : 'badge-brand'}`} style={{ fontSize: '11px' }}>
          {isFinalScenesStage ? '✓ 5 Final Scenes' : '⚡ 1-Tap Review'}
        </span>
      </div>

      {/* ─── 2. META SPECS GRID ───────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Genre / Format</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {story.genre || story.category || 'Viral Short'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pacing & Structure</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
            5 Acts • 75s Total
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Language</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
            {story.language || threadLanguage || 'English'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Visual Style Hint</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
            {story.visualStyle || 'Cinematic'}
          </div>
        </div>
      </div>

      {/* ─── 3. SUGGESTED TITLE ──────────────────────────────────────── */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Suggested Video Title:
          </div>
          {isFieldChanged('title') && (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10px' }}>
              ✓ Refined
            </span>
          )}
        </div>
        <div style={{
          fontSize: '15px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          background: 'var(--bg-input)',
          padding: '10px 14px',
          borderRadius: '10px',
          border: isFieldChanged('title') ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
          boxShadow: isFieldChanged('title') ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}>
          <span>🔥</span>
          <span>{story.suggestedTitle || story.title}</span>
        </div>
      </div>

      {/* ─── 4. VIRAL HOOK (First 3 Seconds) ─────────────────────────── */}
      {story.viralHook && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={12} /> Viral Hook (First 3 Seconds):
            </div>
            {isFieldChanged('viralHook') && (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10px' }}>
                ✓ Refined
              </span>
            )}
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            background: 'rgba(245, 158, 11, 0.08)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: isFieldChanged('viralHook') ? '1.5px solid #10b981' : '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: isFieldChanged('viralHook') ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
            lineHeight: 1.5,
            transition: 'all 0.2s ease'
          }}>
            "{story.viralHook}"
          </div>
        </div>
      )}

      {/* ─── 5. SCENE CARDS VIEW (Stage 2) with 190-200 Char Count ───── */}
      {displayScenes && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#10b981" />
              <span>Full 5-Scene Master Screenplay ({displayScenes.length} Scenes)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllScenes(!showAllScenes)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11.5px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {showAllScenes ? 'Collapse' : 'Expand All'}
            </button>
          </div>

          {showAllScenes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayScenes.map((s, idx) => {
                const sceneNum = idx + 1;
                const charCount = s.voiceoverCharCount !== undefined ? s.voiceoverCharCount : (s.voiceoverText || '').length;
                const charBadge = getCharCountBadgeStyle(charCount);
                const sceneChanged = isSceneChanged(sceneNum, s);

                return (
                  <div
                    key={idx}
                    style={{
                      background: sceneChanged ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-input)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: sceneChanged ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                      boxShadow: sceneChanged ? '0 0 14px rgba(16, 185, 129, 0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-brand" style={{ fontSize: '11px' }}>
                          Scene {sceneNum} of 5 • {s.duration || 15}s
                        </span>
                        {sceneChanged && (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10.5px' }}>
                            ✓ Scene {sceneNum} Refined
                          </span>
                        )}
                      </div>

                      {/* Character Count UI (Requirement 5) */}
                      <div 
                        title={`Target: 190-200 characters. Status: ${charBadge.status}`}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: charBadge.color,
                          background: charBadge.background,
                          border: `1px solid ${charBadge.borderColor}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>{charCount} / 190–200 chars</span>
                        <span style={{ fontSize: '9px', opacity: 0.85 }}>({charBadge.status})</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.5 }}>
                      <strong>🎙️ Voiceover:</strong> "{s.voiceoverText}"
                    </div>

                    <div style={{
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      lineHeight: 1.4
                    }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>🎨 Visual Prompt:</strong> {s.videoPrompt}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 6. 5-ACT NARRATIVE BRIEF (Stage 1) ──────────────────────── */}
      {!displayScenes && story.storyBrief && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={12} /> 5-Act Narrative Brief:
            </div>
            {isFieldChanged('storyBrief') && (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10px' }}>
                ✓ Refined
              </span>
            )}
          </div>
          <div style={{
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-input)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: isFieldChanged('storyBrief') ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
            boxShadow: isFieldChanged('storyBrief') ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
            whiteSpace: 'pre-line',
            lineHeight: 1.6,
            transition: 'all 0.2s ease'
          }}>
            {story.storyBrief}
          </div>
        </div>
      )}

      {/* ─── 7. INLINE AI AGENT REFINEMENT PANEL (Presets + Free Text) ─ */}
      <div style={{
        marginBottom: '16px',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        background: isRefineOpen ? 'rgba(236, 72, 153, 0.04)' : 'transparent',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <button
          type="button"
          onClick={() => setIsRefineOpen(!isRefineOpen)}
          style={{
            width: '100%',
            padding: '11px 14px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: '#ec4899',
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wand2 size={15} />
            <span>
              {isFinalScenesStage ? '✍️ Refine 5-Scene Screenplay with AI Doctor' : '✍️ Refine Story Brief with AI Doctor'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isRefineOpen ? 'Close Panel' : 'Presets & Custom Text'}
            </span>
            {isRefineOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {isRefineOpen && (
          <form onSubmit={handleRefineSubmit} style={{ padding: '0 14px 14px 14px' }}>
            {/* Presets Header */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sliders size={12} /> Refinement Presets:
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {(isFinalScenesStage ? SCREENPLAY_PRESETS : STORY_PRESETS).map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'var(--bg-input)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      border: `1.5px solid ${isSelected ? '#ec4899' : 'var(--border-subtle)'}`,
                      borderRadius: '99px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '5px 12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Multi-Scene Selection Buttons (Screenplay Stage Only) */}
            {isFinalScenesStage && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                background: 'var(--bg-input)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                  🎯 Target Specific Scenes (Multi-Select):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((sceneNum) => {
                    const isTargeted = selectedScenes.includes(sceneNum);
                    return (
                      <button
                        key={sceneNum}
                        type="button"
                        onClick={() => toggleSceneSelect(sceneNum)}
                        style={{
                          background: isTargeted ? '#10b981' : 'transparent',
                          color: isTargeted ? '#ffffff' : 'var(--text-secondary)',
                          border: `1px solid ${isTargeted ? '#10b981' : 'var(--border-medium)'}`,
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isTargeted ? <CheckSquare size={13} /> : <Square size={13} />}
                        <span>Scene {sceneNum}</span>
                      </button>
                    );
                  })}
                  {selectedScenes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedScenes([])}
                      style={{
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: 'none',
                        fontSize: '11px',
                        cursor: 'pointer',
                        marginLeft: '4px',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Free-Text Refinement Input Box (Always Available) */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                ✍️ Custom Instruction (Optional or Standalone):
              </div>
              <textarea
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder={isFinalScenesStage 
                  ? "Type custom instructions alone or add to selected preset (e.g. 'Make Scene 3 visual prompt an aerial drone camera shot and tighten scene 4 voiceover')..."
                  : "Type custom instructions alone or add to selected preset (e.g. 'Emphasize the secret revelation in act 4 and make the ending more emotional')..."
                }
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: 1.4,
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {selectedPresetId || selectedScenes.length > 0 || refineText.trim() ? (
                  <span style={{ color: 'var(--text-primary)' }}>
                    Ready to send: <strong>{selectedPresetId || (selectedScenes.length > 0 ? `Scenes ${selectedScenes.join(', ')}` : 'Custom Text')}</strong>
                  </span>
                ) : (
                  <span>Select a preset above or type custom instructions</span>
                )}
              </div>

              <button
                type="submit"
                disabled={(!selectedPresetId && selectedScenes.length === 0 && !refineText.trim()) || isRefining}
                className="btn-glow"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  fontSize: '12.5px',
                  padding: '7px 18px',
                  gap: '6px',
                  opacity: (!selectedPresetId && selectedScenes.length === 0 && !refineText.trim()) || isRefining ? 0.5 : 1,
                  cursor: (!selectedPresetId && selectedScenes.length === 0 && !refineText.trim()) || isRefining ? 'not-allowed' : 'pointer'
                }}
              >
                {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                <span>{isRefining ? 'Refining with AI Agent...' : 'Send Refine Instruction to n8n'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── 8. MAIN ACTION BUTTONS ──────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '16px'
      }}>
        <button
          type="button"
          onClick={handleReject}
          disabled={approvedState !== null || isSubmitting}
          className="btn-outline"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            fontSize: '13px',
            padding: '8px 18px',
            gap: '6px'
          }}
        >
          <XCircle size={15} />
          <span>Cancel & Terminate</span>
        </button>

        <button
          type="button"
          onClick={handleApprove}
          disabled={approvedState !== null || isSubmitting}
          className="btn-glow"
          style={{
            background: isFinalScenesStage ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--grad-primary)',
            fontSize: '13px',
            padding: '8px 22px',
            gap: '8px'
          }}
        >
          {approvedState === 'approved' ? (
            <>
              <Check size={16} />
              <span>{isFinalScenesStage ? 'Approved! Rendering Video...' : 'Approved! Generating Scenes...'}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>{isFinalScenesStage ? 'Approve 5 Scenes & Render Video' : 'Approve Story & Generate 5 Scenes'}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
