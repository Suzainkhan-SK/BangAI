import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_MUSIC_ID, resolveMusicId } from '../data/musicTracks.js';
import { migrateSubtitleSettings } from '../lib/json2videoSubtitles.js';

const STORAGE_KEY = 'bangai_video_settings_v1';

export const DEFAULT_VIDEO_SETTINGS = {
  settingsVersion: 2,
  voiceId: 'adam',
  elevenLabsVoiceId: '',
  voiceSpeed: 1.10,
  styleId: 'cinematic',
  visualStyle: 'Cinematic Realistic',
  language: 'Hinglish',
  musicId: DEFAULT_MUSIC_ID,
  musicTrackUrl: '',
  musicVolume: 0.08,
  privacyStatus: 'public',
  subtitleSettings: {
    presetId: 'mrbeast-viral',
    style: 'classic-progressive',
    fontFamily: 'Montserrat',
    fontSize: 78,
    wordColor: '#FFE600',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 10,
    shadowColor: '#000000',
    shadowOffset: 0,
    boxColor: '',
    position: 'mid-bottom-center',
    allCaps: true,
    maxWordsPerLine: 3
  }
};

export function sanitizeVideoSettings(input) {
  const raw = input && typeof input === 'object' ? input : {};
  
  // Voice Speed clamp 0.5 - 4.0 (default 1.10)
  const rawSpeed = Number(raw.voiceSpeed);
  const voiceSpeed = isFinite(rawSpeed) && rawSpeed > 0 ? Math.max(0.5, Math.min(4, Number(rawSpeed.toFixed(2)))) : 1.10;

  // Music Volume clamp 0 - 0.4 with isFinite (default 0.08)
  const rawVol = Number(raw.musicVolume);
  const musicVolume = isFinite(rawVol) ? Math.max(0, Math.min(0.4, Number(rawVol.toFixed(2)))) : 0.08;

  // Privacy Status whitelist
  const rawPrivacy = String(raw.privacyStatus || raw.privacy || '').toLowerCase().trim();
  const privacyStatus = ['public', 'private', 'unlisted'].includes(rawPrivacy) ? rawPrivacy : 'public';

  // Subtitle Settings with migration helper
  const rawSubs = raw.subtitleSettings && typeof raw.subtitleSettings === 'object' ? raw.subtitleSettings : DEFAULT_VIDEO_SETTINGS.subtitleSettings;
  const subtitleSettings = migrateSubtitleSettings({
    ...DEFAULT_VIDEO_SETTINGS.subtitleSettings,
    ...rawSubs
  });

  return {
    settingsVersion: Number(raw.settingsVersion) || 2,
    voiceId: raw.voiceId || DEFAULT_VIDEO_SETTINGS.voiceId,
    elevenLabsVoiceId: raw.elevenLabsVoiceId || '',
    voiceSpeed,
    styleId: raw.styleId || DEFAULT_VIDEO_SETTINGS.styleId,
    visualStyle: raw.visualStyle || DEFAULT_VIDEO_SETTINGS.visualStyle,
    language: raw.language || DEFAULT_VIDEO_SETTINGS.language,
    musicId: resolveMusicId(raw.musicId || DEFAULT_VIDEO_SETTINGS.musicId),
    musicTrackUrl: raw.musicTrackUrl || '',
    musicVolume,
    privacyStatus,
    subtitleSettings
  };
}

function loadInitialSettings() {
  if (typeof window === 'undefined') return DEFAULT_VIDEO_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        if (parsed.settingsVersion !== 2 && Number(parsed.voiceSpeed).toFixed(2) === '1.30') {
          parsed.voiceSpeed = 1.10;
        }
        parsed.settingsVersion = 2;
        const sanitized = sanitizeVideoSettings(parsed);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        } catch (_) {}
        return sanitized;
      }
    }
  } catch (e) {
    console.warn('[videoSettings] Failed to parse saved settings, falling back to defaults:', e.message);
  }
  return DEFAULT_VIDEO_SETTINGS;
}

const VideoSettingsContext = createContext(null);

export function VideoSettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadInitialSettings);

  const updateSettings = useCallback((newPartial) => {
    setSettingsState((prev) => {
      const merged = typeof newPartial === 'function' ? newPartial(prev) : { ...prev, ...newPartial };
      const sanitized = sanitizeVideoSettings(merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch (e) {
        console.warn('[videoSettings] Could not persist settings to localStorage:', e.message);
      }
      return sanitized;
    });
  }, []);

  const resetSettings = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setSettingsState(DEFAULT_VIDEO_SETTINGS);
  }, []);

  return (
    <VideoSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </VideoSettingsContext.Provider>
  );
}

export function useVideoSettings() {
  const context = useContext(VideoSettingsContext);
  if (!context) {
    throw new Error('useVideoSettings must be used within a VideoSettingsProvider');
  }
  return context;
}
