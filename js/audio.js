const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export class AmbientScore {
  constructor() {
    this.context = null;
    this.active = false;
    this.progress = 0;
    this.velocity = 0;
    this.sources = [];
    this.stopTimer = null;
  }

  async toggle() {
    if (this.active) {
      await this.stop();
      return false;
    }

    await this.start();
    return this.active;
  }

  async start() {
    if (this.active) return;
    clearTimeout(this.stopTimer);

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio is unavailable in this browser.");
    }

    this.context = new AudioContextClass({ latencyHint: "playback" });
    await this.context.resume();

    const now = this.context.currentTime;
    this.masterGain = this.context.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-26, now);
    this.compressor.knee.setValueAtTime(20, now);
    this.compressor.ratio.setValueAtTime(3, now);
    this.compressor.attack.setValueAtTime(0.08, now);
    this.compressor.release.setValueAtTime(0.8, now);

    this.filter = this.context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(420, now);
    this.filter.Q.setValueAtTime(0.72, now);

    this.panner = typeof this.context.createStereoPanner === "function"
      ? this.context.createStereoPanner()
      : null;

    this.filter.connect(this.panner || this.compressor);
    if (this.panner) this.panner.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    this.oscillators = [
      this.createTone("sine", 43.65, 0.055, -6),
      this.createTone("sine", 65.41, 0.032, 5),
      this.createTone("triangle", 98.0, 0.010, -11),
    ];

    this.createNoiseBed();
    this.createModulation();

    this.sources.forEach((source) => source.start());
    this.masterGain.gain.exponentialRampToValueAtTime(0.13, now + 1.8);
    this.active = true;
    this.setProgress(this.progress, this.velocity);
  }

  createTone(type, frequency, gainValue, detune) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    gain.gain.value = gainValue;
    oscillator.connect(gain);
    gain.connect(this.filter);
    this.sources.push(oscillator);
    return { oscillator, gain, baseFrequency: frequency, baseGain: gainValue };
  }

  createNoiseBed() {
    const duration = 3;
    const frameCount = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(2, frameCount, this.context.sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      let previous = 0;
      for (let index = 0; index < frameCount; index += 1) {
        const white = Math.random() * 2 - 1;
        previous = previous * 0.985 + white * 0.015;
        data[index] = previous * 2.4;
      }
    }

    this.noiseSource = this.context.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.noiseFilter = this.context.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.value = 720;
    this.noiseFilter.Q.value = 0.35;

    this.noiseGain = this.context.createGain();
    this.noiseGain.gain.value = 0.018;

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.filter);
    this.sources.push(this.noiseSource);
  }

  createModulation() {
    const filterLfo = this.context.createOscillator();
    const filterDepth = this.context.createGain();
    filterLfo.type = "sine";
    filterLfo.frequency.value = 0.047;
    filterDepth.gain.value = 190;
    filterLfo.connect(filterDepth);
    filterDepth.connect(this.filter.frequency);
    this.sources.push(filterLfo);

    if (this.panner) {
      const panLfo = this.context.createOscillator();
      const panDepth = this.context.createGain();
      panLfo.type = "sine";
      panLfo.frequency.value = 0.021;
      panDepth.gain.value = 0.34;
      panLfo.connect(panDepth);
      panDepth.connect(this.panner.pan);
      this.sources.push(panLfo);
    }
  }

  setProgress(progress, velocity = 0) {
    this.progress = clamp(progress);
    this.velocity = clamp(Math.abs(velocity), 0, 2.5);
    if (!this.active || !this.context) return;

    const now = this.context.currentTime;
    const harmonicLift = 1 + this.progress * 0.165;
    const chapterPulse = 1 + Math.sin(this.progress * Math.PI * 10) * 0.008;

    this.oscillators.forEach((tone, index) => {
      const ratio = harmonicLift * chapterPulse * (1 + index * this.progress * 0.006);
      tone.oscillator.frequency.cancelScheduledValues(now);
      tone.oscillator.frequency.setTargetAtTime(tone.baseFrequency * ratio, now, 0.32);
      tone.gain.gain.cancelScheduledValues(now);
      tone.gain.gain.setTargetAtTime(
        tone.baseGain * (0.86 + this.progress * 0.28),
        now,
        0.4,
      );
    });

    const cutoff = 310 + this.progress * 1120 + this.velocity * 380;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setTargetAtTime(cutoff, now, 0.22);

    this.noiseFilter.frequency.cancelScheduledValues(now);
    this.noiseFilter.frequency.setTargetAtTime(520 + this.progress * 980, now, 0.35);
    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setTargetAtTime(0.012 + this.progress * 0.012 + this.velocity * 0.006, now, 0.25);

    if (this.panner) {
      this.panner.pan.cancelScheduledValues(now);
      this.panner.pan.setTargetAtTime(Math.sin(this.progress * Math.PI * 2) * 0.22, now, 0.38);
    }
  }

  async stop() {
    if (!this.active || !this.context) return;
    this.active = false;

    const context = this.context;
    const now = context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    await new Promise((resolve) => {
      this.stopTimer = window.setTimeout(resolve, 560);
    });

    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Source may already be stopped after a browser lifecycle interruption.
      }
    });

    this.sources = [];
    try {
      await context.close();
    } catch {
      // Closing an already-closed context is harmless.
    }
    if (this.context === context) this.context = null;
  }
}
