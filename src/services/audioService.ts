/**
 * Premium sound synthesis, atmospheric background music, and French narration engine.
 * Powered by Web Audio API and Web Speech API. 100% self-contained.
 */

export interface AudioSettings {
  masterVolume: number;
  narratorVolume: number;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  musicEnabled: boolean;
}

class AudioService {
  private ctx: AudioContext | null = null;
  private speechSynth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  private settings: AudioSettings = {
    masterVolume: 0.8,
    narratorVolume: 1.0,
    sfxVolume: 0.8,
    musicVolume: 0.35,
    isMuted: false,
    musicEnabled: true,
  };

  private bgDroneOsc: OscillatorNode | null = null;
  private bgDroneGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSettings();
      this.speechSynth = window.speechSynthesis || null;
      if (this.speechSynth) {
        this.initVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.initVoice();
        }
      }
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('werewolf_audio_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {}
  }

  private saveSettings() {
    try {
      localStorage.setItem('werewolf_audio_settings', JSON.stringify(this.settings));
    } catch {}
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();

    if (this.settings.isMuted) {
      this.stopAmbientMusic();
      this.speechSynth?.cancel();
    } else if (this.settings.musicEnabled && !this.isMusicPlaying) {
      this.startAmbientMusic();
    }
    if (this.bgDroneGain && this.ctx) {
      this.bgDroneGain.gain.setValueAtTime(
        this.settings.isMuted ? 0 : this.settings.masterVolume * this.settings.musicVolume,
        this.ctx.currentTime
      );
    }
  }

  private initVoice() {
    if (!this.speechSynth) return;
    const voices = this.speechSynth.getVoices();
    const frVoice = voices.find(
      (v) => v.lang.startsWith('fr') || v.name.toLowerCase().includes('french')
    );
    this.voice = frVoice || voices[0] || null;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Procedural Ambient Dark Fantasy Drone / Music (Night Forest Wind)
   */
  public startAmbientMusic() {
    if (this.settings.isMuted || !this.settings.musicEnabled || this.isMusicPlaying) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now); // Low deep drone A1

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      const targetGain = this.settings.masterVolume * this.settings.musicVolume * 0.15;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + 3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      this.bgDroneOsc = osc;
      this.bgDroneGain = gain;
      this.isMusicPlaying = true;
    } catch {}
  }

  public stopAmbientMusic() {
    if (this.bgDroneOsc) {
      try {
        this.bgDroneOsc.stop();
        this.bgDroneOsc.disconnect();
      } catch {}
      this.bgDroneOsc = null;
      this.bgDroneGain = null;
    }
    this.isMusicPlaying = false;
  }

  public narrate(text: string, force: boolean = false) {
    if (this.settings.isMuted && !force) return;
    if (!this.speechSynth || !text) return;

    try {
      this.speechSynth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      utterance.volume = this.settings.masterVolume * this.settings.narratorVolume;
      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }

  /**
   * Procedural sound: Card Reveal Cue per Role
   */
  public playRoleRevealSound(role: string) {
    if (this.settings.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const sfxVol = this.settings.masterVolume * this.settings.sfxVolume;

      if (role === 'LOUP_GAROU') {
        // Growl
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.6);
        gain.gain.setValueAtTime(sfxVol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      } else if (role === 'VOYANTE') {
        // Mystical shimmer
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.5);
        gain.gain.setValueAtTime(sfxVol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      } else if (role === 'CHASSEUR') {
        // Gun cock metallic click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(sfxVol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      } else if (role === 'SALVATEUR') {
        // Shield clang
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(440, now + 0.05);
        gain.gain.setValueAtTime(sfxVol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      } else {
        // Gentle bell
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(392.0, now);
        gain.gain.setValueAtTime(sfxVol * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    } catch {}
  }

  public playWolfHowl() {
    if (this.settings.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.8);
      osc.frequency.exponentialRampToValueAtTime(320, now + 1.8);
      osc.frequency.exponentialRampToValueAtTime(160, now + 2.8);

      const vol = this.settings.masterVolume * this.settings.sfxVolume * 0.3;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.1);
    } catch {}
  }

  public playDeathBell() {
    if (this.settings.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [110, 220, 330];
      const vol = this.settings.masterVolume * this.settings.sfxVolume;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + idx * 2, now);

        gain.gain.setValueAtTime((vol * 0.25) / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch {}
  }

  public playDawnChime() {
    if (this.settings.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25];
      const vol = this.settings.masterVolume * this.settings.sfxVolume;

      notes.forEach((pitch, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, now + i * 0.18);

        gain.gain.setValueAtTime(0.001, now + i * 0.18);
        gain.gain.linearRampToValueAtTime(vol * 0.2, now + i * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 1.3);
      });
    } catch {}
  }

  public playVoteChime() {
    if (this.settings.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vol = this.settings.masterVolume * this.settings.sfxVolume;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(vol * 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  public playVictoryFanfare() {
    if (this.settings.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = this.settings.masterVolume * this.settings.sfxVolume;
      const fanfare = [
        { freq: 440, dur: 0.2, offset: 0 },
        { freq: 440, dur: 0.2, offset: 0.2 },
        { freq: 440, dur: 0.2, offset: 0.4 },
        { freq: 554.37, dur: 0.6, offset: 0.6 },
        { freq: 659.25, dur: 0.8, offset: 1.2 },
      ];

      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.offset);
        gain.gain.setValueAtTime(vol * 0.22, now + n.offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.offset + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.offset);
        osc.stop(now + n.offset + n.dur);
      });
    } catch {}
  }
}

export const audioService = new AudioService();
