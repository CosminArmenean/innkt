/**
 * AudioIntensityDetector - Real-time audio intensity detection using Web Audio API
 * 
 * This class provides real-time audio intensity analysis for detecting when
 * a participant is speaking during voice calls. It uses the Web Audio API
 * to analyze audio frequency data and determine speaking activity.
 * 
 * Features:
 * - Real-time audio intensity monitoring
 * - Configurable sensitivity threshold
 * - Smooth intensity smoothing
 * - Low CPU usage with optimized performance
 * - Cross-browser compatibility
 * 
 * @author innkt Team
 * @version 1.0.0
 */

export interface AudioIntensityOptions {
  /** Sensitivity threshold for detecting speech (0-1, default: 0.1) */
  threshold?: number;
  /** Smoothing factor for intensity changes (0-1, default: 0.8) */
  smoothing?: number;
  /** FFT size for frequency analysis (default: 256) */
  fftSize?: number;
  /** Update frequency in milliseconds (default: 100) */
  updateInterval?: number;
}

export interface AudioIntensityEvent {
  /** Current intensity level (0-1) */
  intensity: number;
  /** Whether participant is currently speaking */
  isSpeaking: boolean;
  /** Timestamp of the measurement */
  timestamp: number;
}

export type AudioIntensityCallback = (event: AudioIntensityEvent) => void;

export class AudioIntensityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrame: number | null = null;
  private onIntensityChange: AudioIntensityCallback;
  private options: Required<AudioIntensityOptions>;
  private isRunning = false;
  private lastIntensity = 0;

  constructor(
    onIntensityChange: AudioIntensityCallback,
    options: AudioIntensityOptions = {}
  ) {
    this.onIntensityChange = onIntensityChange;
    this.options = {
      threshold: 0.1,
      smoothing: 0.8,
      fftSize: 256,
      updateInterval: 100,
      ...options
    };
  }

  /**
   * Start audio intensity detection for the given audio stream
   * @param audioStream - The audio stream to analyze
   * @returns Promise that resolves when detection starts
   */
  async start(audioStream: MediaStream): Promise<void> {
    try {
      if (this.isRunning) {
        console.warn('AudioIntensityDetector: Already running');
        return;
      }

      // Validate audio stream
      if (!audioStream || audioStream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks found in the provided stream');
      }

      // Create audio context
      this.audioContext = new AudioContext();
      
      // Check if audio context is suspended (common on mobile)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser for voice detection
      this.analyser.fftSize = this.options.fftSize;
      this.analyser.smoothingTimeConstant = this.options.smoothing;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      
      // Create data array for frequency analysis
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Connect audio stream to analyser
      const source = this.audioContext.createMediaStreamSource(audioStream);
      source.connect(this.analyser);
      
      // Start monitoring
      this.isRunning = true;
      this.monitorAudioIntensity();
      
      console.log('AudioIntensityDetector: Started successfully');
    } catch (error) {
      console.error('AudioIntensityDetector: Failed to start:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Stop audio intensity detection and cleanup resources
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Cleanup audio context
    this.cleanup();
    
    console.log('AudioIntensityDetector: Stopped');
  }

  /**
   * Update the sensitivity threshold
   * @param threshold - New threshold value (0-1)
   */
  setThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this.options.threshold = threshold;
    console.log(`AudioIntensityDetector: Threshold updated to ${threshold}`);
  }

  /**
   * Get current audio intensity without triggering callback
   * @returns Current intensity level (0-1)
   */
  getCurrentIntensity(): number {
    return this.lastIntensity;
  }

  /**
   * Check if the detector is currently running
   * @returns True if running, false otherwise
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Monitor audio intensity in real-time
   */
  private monitorAudioIntensity(): void {
    if (!this.isRunning || !this.analyser || !this.dataArray) {
      return;
    }

    try {
      // Get frequency data
      if (!this.dataArray) {
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
      const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(frequencyData);
      
      // Calculate average intensity
      const average = frequencyData.reduce((a, b) => a + b) / frequencyData.length;
      const intensity = average / 255; // Normalize to 0-1
      
      // Calculate RMS (Root Mean Square) for better voice detection
      let sumSquares = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        sumSquares += frequencyData[i] * frequencyData[i];
      }
      const rms = Math.sqrt(sumSquares / frequencyData.length) / 255;
      
      // Use the higher of average or RMS for better sensitivity
      const finalIntensity = Math.max(intensity, rms);
      
      // Debug: Log raw frequency data more frequently for troubleshooting
      if (Math.random() < 0.05) { // Log 5% of the time for better debugging
        let maxValue = 0;
        let nonZeroValues = 0;
        let totalValue = 0;
        for (let i = 0; i < frequencyData.length; i++) {
          if (frequencyData[i] > maxValue) maxValue = frequencyData[i];
          if (frequencyData[i] > 0) nonZeroValues++;
          totalValue += frequencyData[i];
        }
        console.log('AudioIntensityDetector: Raw frequency data sample', {
          average: average.toFixed(4),
          intensity: intensity.toFixed(4),
          rms: rms.toFixed(4),
          finalIntensity: finalIntensity.toFixed(4),
          maxValue,
          nonZeroValues,
          totalValue,
          dataLength: frequencyData.length,
          analyserState: this.analyser.context?.state,
          threshold: this.options.threshold,
          smoothing: this.options.smoothing
        });
      }
      
      // Apply smoothing to reduce jitter
      const smoothedIntensity = this.applySmoothing(finalIntensity);
      
      // Determine if speaking
      const isSpeaking = smoothedIntensity > this.options.threshold;
      
      // Update last intensity
      this.lastIntensity = smoothedIntensity;
      
      // Trigger callback
      this.onIntensityChange({
        intensity: smoothedIntensity,
        isSpeaking,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('AudioIntensityDetector: Error in monitoring loop:', error);
    }

    // Schedule next update
    this.animationFrame = requestAnimationFrame(() => this.monitorAudioIntensity());
  }

  /**
   * Apply smoothing to intensity values to reduce jitter
   * @param newIntensity - New intensity value
   * @returns Smoothed intensity value
   */
  private applySmoothing(newIntensity: number): number {
    const smoothingFactor = 0.1; // Light smoothing for responsiveness
    return this.lastIntensity * (1 - smoothingFactor) + newIntensity * smoothingFactor;
  }

  /**
   * Cleanup audio context and resources
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.audioContext) {
        if (this.audioContext.state !== 'closed') {
          await this.audioContext.close();
        }
        this.audioContext = null;
      }
      
      this.analyser = null;
      this.dataArray = null;
    } catch (error) {
      console.error('AudioIntensityDetector: Error during cleanup:', error);
    }
  }

  /**
   * Check if Web Audio API is supported in the current browser
   * @returns True if supported, false otherwise
   */
  static isSupported(): boolean {
    return !!(
      window.AudioContext ||
      (window as any).webkitAudioContext ||
      (window as any).mozAudioContext ||
      (window as any).msAudioContext
    );
  }

  /**
   * Get browser-specific AudioContext constructor
   * @returns AudioContext constructor
   */
  private static getAudioContextConstructor(): typeof AudioContext {
    return (
      window.AudioContext ||
      (window as any).webkitAudioContext ||
      (window as any).mozAudioContext ||
      (window as any).msAudioContext
    );
  }
}

export default AudioIntensityDetector;
