// src/lib/json2videoSubtitles.js
// Single source of truth for converting BangAI subtitle settings into json2video v2
// subtitle settings. The n8n node "Submit Job" carries a mirrored copy of these tables —
// if you change them here, change them there too.

export const J2V_SUBTITLE_STYLES = ['classic', 'classic-progressive', 'classic-one-word', 'boxed-line', 'boxed-word'];

export const J2V_SUBTITLE_POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center-center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
  'mid-bottom-center', 'mid-top-center', 'custom'
];

// Legacy / human names that used to be sent to the API and were silently ignored.
export const STYLE_ALIASES = {
  'highlight': 'classic-progressive',   // karaoke word highlight — the original intent
  'karaoke': 'classic-progressive',
  'progressive': 'classic-progressive',
  'one-word': 'classic-one-word',
  'boxed': 'boxed-line',
  'box': 'boxed-line',
  'boxed-highlight': 'boxed-word'
};

export const POSITION_ALIASES = {
  'center-bottom': 'mid-bottom-center', // "lower third" — clears the Shorts UI overlay
  'center-top': 'top-center',
  'center-middle': 'center-center',
  'bottom': 'mid-bottom-center',
  'top': 'top-center',
  'center': 'center-center'
};

export function normalizeSubtitleStyle(value) {
  const raw = String(value || '').toLowerCase().trim();
  const mapped = STYLE_ALIASES[raw] || raw;
  return J2V_SUBTITLE_STYLES.includes(mapped) ? mapped : 'classic-progressive';
}

export function normalizeSubtitlePosition(value) {
  const raw = String(value || '').toLowerCase().trim();
  const mapped = POSITION_ALIASES[raw] || raw;
  return J2V_SUBTITLE_POSITIONS.includes(mapped) ? mapped : 'mid-bottom-center';
}

const DEVANAGARI = /[\u0900-\u097F]/;   // same range the rest of the codebase uses
const LATIN_ONLY_FONTS = ['Montserrat', 'Inter', 'Bebas Neue', 'Luckiest Guy', 'Bangers', 'Oswald', 'Permanent Marker'];

export function migrateSubtitleSettings(settings) {
  const s = settings && typeof settings === 'object' ? { ...settings } : {};
  s.style = normalizeSubtitleStyle(s.style);
  s.position = normalizeSubtitlePosition(s.position);
  return s;
}

// Returns ONLY keys from the json2video closed list.
export function toJson2VideoSubtitleSettings(settings, sampleText = '') {
  const s = settings && typeof settings === 'object' ? settings : {};
  const hasDevanagari = DEVANAGARI.test(String(sampleText || ''));

  let font = s.fontFamily || 'Montserrat';
  let allCaps = s.allCaps !== undefined ? Boolean(s.allCaps) : true;
  if (hasDevanagari) {
    if (LATIN_ONLY_FONTS.includes(font)) font = 'Noto Sans Devanagari';
    allCaps = false; // Devanagari has no uppercase; all-caps corrupts glyphs
  }

  let size = Number(s.fontSize) || 78;
  if (size > 200) size = Math.round(size / 3.5); // legacy CSS-ish values only
  size = Math.max(56, Math.min(150, Math.round(size)));

  const out = {
    'style': normalizeSubtitleStyle(s.style),
    'position': normalizeSubtitlePosition(s.position),
    'font-family': font,
    'font-size': size,
    'font-weight': '900',
    'word-color': s.wordColor || '#FFE600',
    'line-color': s.lineColor || '#FFFFFF',
    'outline-color': s.outlineColor || '#000000',
    'outline-width': Number(s.outlineWidth !== undefined ? s.outlineWidth : 8),
    'max-words-per-line': Number(s.maxWordsPerLine) || 3,
    'all-caps': allCaps
  };
  if (s.boxColor && String(s.boxColor).trim()) out['box-color'] = String(s.boxColor).trim();
  if (s.fontUrl) out['font-url'] = String(s.fontUrl);
  if (s.shadowColor && Number(s.shadowOffset) > 0) {
    out['shadow-color'] = String(s.shadowColor);
    out['shadow-offset'] = Number(s.shadowOffset);
  }
  return out;
}

// Mirrors the language pick inside the n8n `Submit Job` expression. Keep the two in step.
export function detectSubtitleLanguage(text = '', language = '') {
  const hasDevanagari = /[ऀ-ॿ]/.test(String(text));
  const lang = String(language || '').toLowerCase();
  if (hasDevanagari) return 'hi';
  if (lang.indexOf('hinglish') !== -1) return 'hi-Latn';
  if (lang.indexOf('hindi') !== -1) return 'hi';
  return 'en';
}
