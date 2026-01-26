class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private muted: boolean = false;

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.updateGain();
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    this.updateGain();
  }

  setMute(isMuted: boolean) {
      this.muted = isMuted;
      this.updateGain();
  }

  private updateGain() {
      if (this.masterGain && this.ctx) {
          const targetVolume = this.muted ? 0 : this.volume;
          this.masterGain.gain.setValueAtTime(targetVolume, this.ctx.currentTime);
      }
  }

  private playOscillator(type: OscillatorType, freqStart: number, freqEnd: number, duration: number, vol: number = 1) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, vol: number = 1, filterFreq: number = 1000) {
     if (!this.ctx || !this.masterGain || this.muted) return;
     const bufferSize = this.ctx.sampleRate * duration;
     const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) {
         data[i] = Math.random() * 2 - 1;
     }

     const noise = this.ctx.createBufferSource();
     noise.buffer = buffer;
     const gain = this.ctx.createGain();
     const filter = this.ctx.createBiquadFilter();
     
     filter.type = 'lowpass';
     filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
     filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

     gain.gain.setValueAtTime(vol, this.ctx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

     noise.connect(filter);
     filter.connect(gain);
     gain.connect(this.masterGain);
     noise.start();
  }

  playExplosion() { this.playNoise(0.5, 0.5, 800); }
  playHit() { this.playOscillator('sawtooth', 100, 40, 0.3, 0.4); }
  playSpawn() { this.playOscillator('sine', 600, 300, 0.2, 0.1); }
  playThruster() { this.playOscillator('triangle', 60, 40, 0.1, 0.05); }
  playUIHover() { this.playOscillator('sine', 400, 450, 0.05, 0.05); }
  playUIClick() { this.playOscillator('square', 300, 600, 0.1, 0.1); }
  playShieldActivate() { this.playOscillator('sine', 200, 600, 0.5, 0.3); }
  playShieldDeflect() { this.playOscillator('square', 800, 400, 0.1, 0.2); }
}

export const soundManager = new SoundManager();