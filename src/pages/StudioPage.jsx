import React from 'react';
import StudioLab from '../components/Studio/StudioLab';
import AppShell from '../components/Layout/AppShell';
import { useVideoSettings } from '../state/videoSettings';
import { useBreakpoint } from '../hooks/useMediaQuery';

import { getVoiceById, getAllVoices } from '../data/voices';

export default function StudioPage({
  tab = 'voices',
  user,
  currentRoutePath = 'studio/voices',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const { settings, updateSettings } = useVideoSettings();
  const { isMobile } = useBreakpoint();

  const handleApplySettings = (newSettings) => {
    updateSettings(newSettings);
    if (typeof onNavigate === 'function') {
      onNavigate('dashboard');
    }
  };

  const handleClose = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('dashboard');
    }
  };

  const handleTabChange = (newTab) => {
    if (typeof onNavigate === 'function') {
      onNavigate('studio/' + newTab);
    }
  };

  return (
    <AppShell
      user={user}
      currentRoutePath={currentRoutePath}
      onNavigate={onNavigate}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      <div style={{
        flex: 1,
        width: '100%',
        height: isMobile ? 'auto' : '100%',
        minHeight: '100%',
        overflowY: isMobile ? 'visible' : 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <StudioLab
          initialTab={tab}
          onTabChange={handleTabChange}
          selectedVoiceId={settings.voiceId}
          onSelectVoice={(voiceId, elVoiceId) => {
            const chosen = getVoiceById(voiceId) || getAllVoices().find(v => v.id === voiceId || v.elevenLabsId === voiceId);
            updateSettings({
              voiceId: chosen?.id || voiceId,
              elevenLabsVoiceId: elVoiceId || chosen?.elevenLabsId || (chosen?.source === 'elevenlabs' ? chosen.id : 'pNInz6obpgDQGcFmaJgB')
            });
          }}
          voiceSpeed={settings.voiceSpeed}
          onVoiceSpeedChange={(voiceSpeed) => updateSettings({ voiceSpeed })}
          subtitleSettings={settings.subtitleSettings}
          onSubtitleChange={(subtitleSettings) => updateSettings({ subtitleSettings })}
          selectedMusicId={settings.musicId}
          onSelectMusic={(musicId) => updateSettings({ musicId })}
          musicVolume={settings.musicVolume}
          onMusicVolumeChange={(musicVolume) => updateSettings({ musicVolume })}
          onApplySettingsToVideo={handleApplySettings}
          onClose={handleClose}
        />
      </div>
    </AppShell>
  );
}
