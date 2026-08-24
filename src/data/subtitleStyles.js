// Subtitle style presets matching json2video's supported styles
// Each preset maps to a json2video subtitle settings object

export const SUBTITLE_STYLES = [
  {
    id: 'viral-progressive',
    name: 'Viral Progressive',
    description: 'Words appear as spoken — the most viral TikTok/Reels style',
    icon: '✨',
    color: '#F59E0B',
    // json2video settings
    style: 'classic-progressive',
    fontFamily: 'Montserrat',
    fontSize: 280,
    wordColor: '#FFFF00',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 10,
    position: 'center-center',
    allCaps: true
  },
  {
    id: 'boxed-word',
    name: 'Boxed Word Highlight',
    description: 'Each spoken word gets a colored box — high readability',
    icon: '📦',
    color: '#EF4444',
    style: 'boxed-word',
    fontFamily: 'Inter',
    fontSize: 260,
    wordColor: '#FFFFFF',
    lineColor: '#CCCCCC',
    outlineColor: '#000000',
    outlineWidth: 6,
    boxColor: '#FF0000',
    position: 'center-center',
    allCaps: false
  },
  {
    id: 'boxed-line',
    name: 'Boxed Line',
    description: 'Full line highlighted with a background box',
    icon: '🔲',
    color: '#3B82F6',
    style: 'boxed-line',
    fontFamily: 'Roboto',
    fontSize: 240,
    wordColor: '#FFFFFF',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 4,
    boxColor: '#1E40AF',
    position: 'center-center',
    allCaps: false
  },
  {
    id: 'classic',
    name: 'Classic Clean',
    description: 'Simple, clean subtitle text — professional look',
    icon: '📝',
    color: '#6B7280',
    style: 'classic',
    fontFamily: 'Arial',
    fontSize: 220,
    wordColor: '#FFFFFF',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 8,
    position: 'center-center',
    allCaps: false
  },
  {
    id: 'one-word-impact',
    name: 'One Word Impact',
    description: 'One word at a time — maximum dramatic impact',
    icon: '💥',
    color: '#8B5CF6',
    style: 'classic-one-word',
    fontFamily: 'Bebas Neue',
    fontSize: 320,
    wordColor: '#FF4444',
    lineColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 12,
    position: 'center-center',
    allCaps: true
  }
];

// Available font families for subtitle customization
export const SUBTITLE_FONTS = [
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat' },
  { id: 'inter', name: 'Inter', family: 'Inter' },
  { id: 'roboto', name: 'Roboto', family: 'Roboto' },
  { id: 'arial', name: 'Arial', family: 'Arial' },
  { id: 'bebas-neue', name: 'Bebas Neue', family: 'Bebas Neue' },
  { id: 'luckiest-guy', name: 'Luckiest Guy', family: 'Luckiest Guy' },
  { id: 'poppins', name: 'Poppins', family: 'Poppins' },
  { id: 'oswald', name: 'Oswald', family: 'Oswald' },
  { id: 'permanent-marker', name: 'Permanent Marker', family: 'Permanent Marker' },
  { id: 'bangers', name: 'Bangers', family: 'Bangers' }
];

// Subtitle position options
export const SUBTITLE_POSITIONS = [
  { id: 'top', name: 'Top', value: 'center-top' },
  { id: 'center', name: 'Center', value: 'center-center' },
  { id: 'bottom', name: 'Bottom', value: 'center-bottom' }
];
