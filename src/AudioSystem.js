/**
 * AUDIO SYSTEM
 * Ambient sound management for atmospheric immersion
 */

// ============================================
// AUDIO MANAGER
// ============================================
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.oscillators = new Map();
    this.enabled = false;
    this.volume = 0.3;
  }

  // Initialize Web Audio API
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
      console.log('Audio system initialized');
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      this.enabled = false;
    }
  }

  // Create ambient drone sound
  createAmbientDrone(frequency = 80, detune = 0) {
    if (!this.enabled || !this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;

    gainNode.gain.value = this.volume * 0.1;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    return { oscillator, gainNode };
  }

  // Play ambient background
  playAmbient() {
    if (!this.enabled) return;

    // Low frequency drone
    const drone1 = this.createAmbientDrone(60, 0);
    const drone2 = this.createAmbientDrone(60.5, 2); // Slightly detuned for beating effect
    const drone3 = this.createAmbientDrone(120, -2); // Octave up

    if (drone1) {
      drone1.oscillator.start();
      this.oscillators.set('drone1', drone1);
    }
    if (drone2) {
      drone2.oscillator.start();
      this.oscillators.set('drone2', drone2);
    }
    if (drone3) {
      drone3.oscillator.start();
      this.oscillators.set('drone3', drone3);
    }
  }

  // Stop ambient sounds
  stopAmbient() {
    if (!this.enabled) return;

    this.oscillators.forEach((drone, key) => {
      try {
        drone.oscillator.stop();
        drone.oscillator.disconnect();
        drone.gainNode.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });

    this.oscillators.clear();
  }

  // Play event sound (simple pulse)
  playEventSound(type) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Different sounds for different events
    switch (type) {
      case 'meteor':
        // Deep rumble
        oscillator.frequency.value = 40;
        gainNode.gain.value = this.volume * 0.5;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);
        oscillator.stop(this.audioContext.currentTime + 2);
        break;

      case 'ice-age':
        // High ethereal tone
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = this.volume * 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
        oscillator.stop(this.audioContext.currentTime + 1.5);
        break;

      case 'abundance':
        // Bright, positive tone
        oscillator.type = 'triangle';
        oscillator.frequency.value = 400;
        gainNode.gain.value = this.volume * 0.2;
        oscillator.start();
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        oscillator.stop(this.audioContext.currentTime + 0.5);
        break;

      case 'plague':
        // Dissonant, unsettling tone
        oscillator.type = 'square';
        oscillator.frequency.value = 200;
        gainNode.gain.value = this.volume * 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        oscillator.stop(this.audioContext.currentTime + 1);
        break;

      case 'mutation':
        // Quick blip
        oscillator.type = 'sine';
        oscillator.frequency.value = 600;
        gainNode.gain.value = this.volume * 0.1;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        oscillator.stop(this.audioContext.currentTime + 0.1);
        break;

      case 'achievement':
        // Pleasant ascending tone
        oscillator.type = 'sine';
        oscillator.frequency.value = 400;
        gainNode.gain.value = this.volume * 0.3;
        oscillator.start();
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        oscillator.stop(this.audioContext.currentTime + 0.3);
        break;

      default:
        oscillator.stop();
    }
  }

  // Play cellular pulse (for organism activity)
  playCellularPulse() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 200;
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();

    // Quick pulse
    gainNode.gain.setValueAtTime(this.volume * 0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Set master volume
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));

    // Update existing drones
    this.oscillators.forEach(drone => {
      if (drone.gainNode) {
        drone.gainNode.gain.value = this.volume * 0.1;
      }
    });
  }

  // Toggle audio on/off
  toggle() {
    if (this.enabled && this.oscillators.size > 0) {
      this.stopAmbient();
    } else if (this.enabled) {
      this.playAmbient();
    } else {
      this.init();
      this.playAmbient();
    }
  }

  // Clean up
  dispose() {
    this.stopAmbient();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
