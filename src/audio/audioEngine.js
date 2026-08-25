/**
 * Studio-Grade Web Audio Synthesizer & Sound FX Engine
 * Generates realistic voice preview tones, ambient BGM tracks, and cinematic impact SFX
 */

class StudioAudioEngine {
  constructor() {
    this.ctx = null;
    this.currentBgmSource = null;
    this.currentVoiceSource = null;
    this.isPlayingBgm = false;
    this.isPlayingVoice = false;
    this.currentBgmId = null;
    this.currentVoiceId = null;
    this.bgmGainNode = null;
    this.voiceGainNode = null;
    this.masterVolume = 1.0;
    this.voiceVolume = 1.0;
    this.bgmVolume = 0.2;
    this.listeners = new Set();
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    if (this.bgmGainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGainNode.gain.setValueAtTime(this.bgmVolume * this.masterVolume, now);
      } catch (e) {}
    }
    this.notify();
  }

  setVoiceVolume(vol) {
    this.voiceVolume = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    this.notify();
  }

  setBgmVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    if (this.bgmGainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGainNode.gain.setValueAtTime(this.bgmVolume * this.masterVolume, now);
      } catch (e) {}
    }
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = {
      isPlayingBgm: this.isPlayingBgm,
      currentBgmId: this.currentBgmId,
      isPlayingVoice: this.isPlayingVoice,
      currentVoiceId: this.currentVoiceId,
      masterVolume: this.masterVolume,
      voiceVolume: this.voiceVolume,
      bgmVolume: this.bgmVolume
    };
    this.listeners.forEach((cb) => cb(state));
  }

  // Play Sound FX
  playSfx(type = 'click') {
    if (this.masterVolume <= 0.01) return;
    this.init();
    const now = this.ctx.currentTime;

    if (type === 'click') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'boom' || type === 'impact') {
      // Cinematic Sub Bass Boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      gain.gain.setValueAtTime(0.6 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    }
  }

  // Play Background Music Preview
  playBgm(trackId, duckingLevel = 0.2) {
    this.init();
    if (this.isPlayingBgm && this.currentBgmId === trackId) {
      this.stopBgm();
      return;
    }
    this.stopBgm();

    const now = this.ctx.currentTime;
    this.bgmGainNode = this.ctx.createGain();
    const effectiveVol = (duckingLevel !== undefined ? duckingLevel : this.bgmVolume) * this.masterVolume;
    this.bgmGainNode.gain.setValueAtTime(effectiveVol, now);

    // Multi-oscillator harmonic chord based on genre
    const baseFreqs = {
      epic: [65.41, 130.81, 196.0, 261.63], // C major dramatic
      mystery: [55.0, 110.0, 155.56, 220.0], // A minor dark
      piano: [130.81, 164.81, 196.0, 246.94], // Emotional major 7th
      synth: [65.41, 98.0, 146.83, 220.0], // Cyberpunk fifths
      playful: [261.63, 329.63, 392.0, 523.25], // Upbeat bright
    }[trackId] || [110, 164.81, 220, 329.63];

    const oscillators = [];

    baseFreqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();

      osc.type = trackId === 'synth' ? 'sawtooth' : trackId === 'mystery' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass filter for smooth ambient tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + i * 200, now);

      osc.connect(filter);
      filter.connect(this.bgmGainNode);
      osc.start(now);
      oscillators.push(osc);
    });

    this.bgmGainNode.connect(this.ctx.destination);
    this.currentBgmSource = { oscillators, gain: this.bgmGainNode };
    this.isPlayingBgm = true;
    this.currentBgmId = trackId;
    this.notify();

    // Auto-stop preview after 15 seconds
    setTimeout(() => {
      if (this.isPlayingBgm && this.currentBgmId === trackId) {
        this.stopBgm();
      }
    }, 15000);
  }

  stopBgm() {
    if (this.currentBgmSource) {
      try {
        const now = this.ctx.currentTime;
        this.currentBgmSource.gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        setTimeout(() => {
          this.currentBgmSource?.oscillators?.forEach((o) => {
            try { o.stop(); } catch (e) {}
          });
          this.currentBgmSource = null;
        }, 350);
      } catch (e) {}
    }
    this.isPlayingBgm = false;
    this.currentBgmId = null;
    this.notify();
  }

  // Play Voice Sample Preview
  playVoice(voiceId, text = 'Welcome to the future of automated YouTube Shorts production.') {
    this.init();
    if (this.isPlayingVoice && this.currentVoiceId === voiceId) {
      this.stopVoice();
      return;
    }
    this.stopVoice();

    // Duck BGM if playing
    if (this.bgmGainNode) {
      const now = this.ctx.currentTime;
      this.bgmGainNode.gain.linearRampToValueAtTime(0.06 * this.masterVolume, now + 0.1);
    }

    const pitchMap = {
      adam: 1.0,
      marcus: 1.15,
      aarav: 1.25,
      priya: 1.45,
      charlie: 1.6,
      george: 0.95,
      rachel: 1.4,
    };

    const pitch = pitchMap[voiceId] || 1.1;

    // Use SpeechSynthesis API if available for real spoken English / Hindi words
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = pitch;
      utterance.volume = Math.max(0, Math.min(1, this.voiceVolume * this.masterVolume));

      utterance.onstart = () => {
        this.isPlayingVoice = true;
        this.currentVoiceId = voiceId;
        this.notify();
      };

      utterance.onend = () => {
        this.isPlayingVoice = false;
        this.currentVoiceId = null;
        if (this.bgmGainNode) {
          const now = this.ctx.currentTime;
          this.bgmGainNode.gain.linearRampToValueAtTime(this.bgmVolume * this.masterVolume, now + 0.2);
        }
        this.notify();
      };

      utterance.onerror = () => {
        this.isPlayingVoice = false;
        this.currentVoiceId = null;
        this.notify();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback synthetic voice tone
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 * pitch, now);
      gain.gain.setValueAtTime(0.3 * this.voiceVolume * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.5);

      this.isPlayingVoice = true;
      this.currentVoiceId = voiceId;
      this.notify();

      setTimeout(() => {
        this.isPlayingVoice = false;
        this.currentVoiceId = null;
        this.notify();
      }, 2500);
    }
  }

  stopVoice() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlayingVoice = false;
    this.currentVoiceId = null;
    if (this.bgmGainNode) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGainNode.gain.linearRampToValueAtTime(this.bgmVolume * this.masterVolume, now + 0.2);
      } catch (e) {}
    }
    this.notify();
  }
}

export const audioEngine = new StudioAudioEngine();
