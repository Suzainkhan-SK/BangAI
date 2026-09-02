import React from 'react';
import StudioLab from '../components/Studio/StudioLab';
import { useVideoSettings } from '../state/videoSettings';

export default function StudioPage({ tab = 'voices', onNavigate }) {
  const { settings, updateSettings } = useVideoSettings();

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
    <div style={{ flex: 1, width: '100%', minHeight: 'calc(100vh - 64px)' }}>
      <StudioLab
        initialTab={tab}
        onTabChange={handleTabChange}
        selectedVoiceId={settings.voiceId}
        onSelectVoice={(voiceId) => updateSettings({ voiceId })}
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
  );
}
