// Subtitle style presets modeled after top viral creators (MrBeast, Alex Hormozi, Iman Gadzhi, Ali Abdaal, Vox / Dev)
// These map directly to json2video's whisper subtitle rendering engine

import { normalizeSubtitleStyle, normalizeSubtitlePosition } from '../lib/json2videoSubtitles.js';

export const SUBTITLE_STYLES = [
  {
    id: 'mrbeast-viral',
    name: 'MrBeast Viral Yellow',
    creator: 'MrBeast',
    description: 'High-energy electric yellow active word with heavy black stroke — #1 retention style on YouTube',
    icon: '⚡',
    badge: '🔥 Most Viral',
    color: '#FFE600',
    // json2video whisper settings (1080x1920 canvas)
    style: 'classic-progressive',
    fontFamily: 'Montserrat',
    fontSize: 78,
    wordColor: '#FFE600',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 10,
    shadowColor: '#000000',
    boxColor: '',
    position: 'center-center',
    allCaps: true,
    maxWordsPerLine: 3,
    samplePreview: 'THIS IS HOW WE GAINED 10 MILLION VIEWS'
  },
  {
    id: 'hormozi-box-green',
    name: 'Hormozi Neon Box',
    creator: 'Alex Hormozi',
    description: 'Bright neon green highlight on solid dark badge — maximum mobile screen readability & punch',
    icon: '📦',
    badge: '💼 Top Creator',
    color: '#22C55E',
    style: 'boxed-word',
    fontFamily: 'Montserrat',
    fontSize: 74,
    wordColor: '#FFFFFF',
    lineColor: '#E2E8F0',
    outlineColor: '#000000',
    outlineWidth: 8,
    shadowColor: '#000000',
    boxColor: '#16A34A',
    position: 'center-center',
    allCaps: true,
    maxWordsPerLine: 3,
    samplePreview: 'IF YOU CANNOT SELL YOU CANNOT SCALE'
  },
  {
    id: 'gadzhi-luxury-gold',
    name: 'Iman Gadzhi Luxury Gold',
    creator: 'Iman Gadzhi',
    description: 'Champagne gold word highlight with editorial typography — premium luxury aesthetic',
    icon: '👑',
    badge: '✨ Aesthetic',
    color: '#EAB308',
    style: 'classic-progressive',
    fontFamily: 'Inter',
    fontSize: 68,
    wordColor: '#EAB308',
    lineColor: '#F8FAFC',
    outlineColor: '#000000',
    outlineWidth: 6,
    shadowColor: '#000000',
    boxColor: '',
    position: 'mid-bottom-center',
    allCaps: false,
    maxWordsPerLine: 4,
    samplePreview: 'The secret discipline top performers never talk about'
  },
  {
    id: 'abdaal-clean-cyan',
    name: 'Ali Abdaal Clean Cyan',
    creator: 'Ali Abdaal',
    description: 'Crisp electric cyan with clean sans font — modern tech & productivity creator style',
    icon: '💎',
    badge: '📱 Modern',
    color: '#06B6D4',
    style: 'classic-progressive',
    fontFamily: 'Inter',
    fontSize: 72,
    wordColor: '#06B6D4',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 7,
    shadowColor: '#000000',
    boxColor: '',
    position: 'center-center',
    allCaps: false,
    maxWordsPerLine: 3,
    samplePreview: 'How to double your output in half the time'
  },
  {
    id: 'tiktok-red-punch',
    name: 'TikTok High-Voltage Red',
    creator: 'Viral TikTok',
    description: 'Fiery crimson active word with bold yellow contrast — intense hook stopping power',
    icon: '🔥',
    badge: '🚀 High Energy',
    color: '#EF4444',
    style: 'classic-progressive',
    fontFamily: 'Bebas Neue',
    fontSize: 84,
    wordColor: '#EF4444',
    lineColor: '#FFE600',
    outlineColor: '#000000',
    outlineWidth: 10,
    shadowColor: '#000000',
    boxColor: '',
    position: 'center-center',
    allCaps: true,
    maxWordsPerLine: 2,
    samplePreview: 'STOP SCROLLING AND LISTEN TO THIS'
  },
  {
    id: 'one-word-impact',
    name: 'Rapid Fire (1 Word at a Time)',
    creator: 'Speed Shorts',
    description: 'Giant single word flash synchronized to speech — maximum dopamine pacing',
    icon: '💥',
    badge: '⚡ Speed',
    color: '#EC4899',
    style: 'classic-one-word',
    fontFamily: 'Montserrat',
    fontSize: 90,
    wordColor: '#F43F5E',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 12,
    shadowColor: '#000000',
    boxColor: '',
    position: 'center-center',
    allCaps: true,
    maxWordsPerLine: 1,
    samplePreview: 'UNSTOPPABLE'
  }
];

// Available font families for subtitle customization (Google Fonts supported by json2video)
export const SUBTITLE_FONTS = [
  { id: 'montserrat', name: 'Montserrat (Viral Bold 900)', family: 'Montserrat', script: 'latin' },
  { id: 'noto-devanagari', name: 'Noto Sans Devanagari (Hindi / Indic #1)', family: 'Noto Sans Devanagari', script: 'devanagari' },
  { id: 'poppins', name: 'Poppins (Universal Latin + Hindi)', family: 'Poppins', script: 'universal' },
  { id: 'mukta', name: 'Mukta (Modern Hindi / Devanagari)', family: 'Mukta', script: 'devanagari' },
  { id: 'inter', name: 'Inter (Clean Creator)', family: 'Inter', script: 'latin' },
  { id: 'bebas-neue', name: 'Bebas Neue (Condensed Punch)', family: 'Bebas Neue', script: 'latin' },
  { id: 'luckiest-guy', name: 'Luckiest Guy (Cartoon / Fun)', family: 'Luckiest Guy', script: 'latin' },
  { id: 'bangers', name: 'Bangers (Comic / Pop)', family: 'Bangers', script: 'latin' },
  { id: 'oswald', name: 'Oswald (Strong Headline)', family: 'Oswald', script: 'latin' },
  { id: 'roboto', name: 'Roboto (Standard Sans)', family: 'Roboto', script: 'latin' },
  { id: 'permanent-marker', name: 'Permanent Marker (Handwritten)', family: 'Permanent Marker', script: 'latin' }
];

// Subtitle position options
export const SUBTITLE_POSITIONS = [
  { id: 'bottom', name: 'Lower Third (Center Bottom - Recommended)', value: 'mid-bottom-center' },
  { id: 'center', name: 'Center Screen (Standard Shorts)', value: 'center-center' },
  { id: 'top', name: 'Top Header (Center Top)', value: 'top-center' }
];

/**
 * Automatically resolve font and all-caps based on text script & language
 * Prevents tofu □□□□ boxes on Hindi / Devanagari / non-Latin text
 */
export function resolveSubtitleConfig(settings, sampleText = '', language = '') {
  const text = sampleText || '';
  const lang = (language || '').toLowerCase();
  const hasDevanagari = /[\u0900-\u097F]/.test(text) || lang.includes('hindi') || lang.includes('hinglish') || lang.includes('marathi') || lang.includes('nepali');
  const hasArabic = /[\u0600-\u06FF]/.test(text) || lang.includes('arabic') || lang.includes('urdu');

  let fontFamily = settings?.fontFamily || 'Montserrat';
  let allCaps = settings?.allCaps !== undefined ? settings.allCaps : true;

  if (hasDevanagari) {
    // If Latin-only font was chosen, automatically fallback to Noto Sans Devanagari or Poppins
    if (['Montserrat', 'Inter', 'Bebas Neue', 'Luckiest Guy', 'Bangers', 'Oswald', 'Permanent Marker'].includes(fontFamily)) {
      fontFamily = 'Noto Sans Devanagari';
    }
    allCaps = false; // Devanagari has no uppercase; disabling avoids glyph corruption
  } else if (hasArabic) {
    fontFamily = 'Noto Sans Arabic';
    allCaps = false;
  }

  return {
    ...settings,
    fontFamily,
    allCaps,
    style: normalizeSubtitleStyle(settings?.style),
    position: normalizeSubtitlePosition(settings?.position)
  };
}
