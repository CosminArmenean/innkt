/**
 * Media Stream Optimizer
 * Optimizes media streams with adaptive quality and proper cleanup
 */

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

export interface OpusAudioConstraints extends MediaTrackConstraints {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleSize?: number;
  latency?: number;
}

export interface VideoQualitySettings {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

export interface AdaptiveQualityConfig {
  enabled: boolean;
  minQuality: VideoQualitySettings;
  maxQuality: VideoQualitySettings;
  qualityLevels: VideoQualitySettings[];
  bandwidthThresholds: {
    excellent: number; // kbps
    good: number;
    fair: number;
    poor: number;
  };
  adjustmentInterval: number; // milliseconds
}

export interface StreamMetrics {
  video: {
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  audio: {
    sampleRate: number;
    bitrate: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  timestamp: number;
}

export class MediaStreamOptimizer {
  private streams: Map<string, MediaStream> = new Map();
  private qualityConfigs: Map<string, AdaptiveQualityConfig> = new Map();
  private metricsIntervals: Map<string, NodeJS.Timeout> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private currentQuality: Map<string, VideoQualitySettings> = new Map();

  // Default quality configurations
  private readonly defaultQualityLevels: VideoQualitySettings[] = [
    { width: 320, height: 240, frameRate: 15, bitrate: 150 },   // Low
    { width: 640, height: 480, frameRate: 24, bitrate: 400 },   // Medium
    { width: 1280, height: 720, frameRate: 30, bitrate: 1000 }, // High
    { width: 1920, height: 1080, frameRate: 30, bitrate: 2000 } // Ultra
  ];

  private readonly defaultBandwidthThresholds = {
    excellent: 2000, // kbps
    good: 1000,
    fair: 500,
    poor: 250
  };

  constructor() {
    console.log('MediaStreamOptimizer: Initialized with Opus audio codec support');
  }

  /**
   * Get optimized Opus audio constraints for voice calls
   */
  private getOpusAudioConstraints(): OpusAudioConstraints {
    return {
      // Opus-optimized settings for voice calls
      sampleRate: 48000,        // Opus standard sample rate
      channelCount: 1,          // Mono for voice (more efficient)
      echoCancellation: true,   // Reduce echo
      noiseSuppression: true,   // Reduce background noise
      autoGainControl: true,    // Automatic volume adjustment
      
      // Additional constraints for better audio quality
      sampleSize: 16,           // 16-bit audio
      latency: 0.02             // 20ms latency target
    };
  }

  lowLatencyAudioConstraints(): OpusAudioConstraints {
    return {
      // Simplified constraints that shouldn't cause muting
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1
    };
  }

  /**
   * Check if Opus codec is supported
   */
  public isOpusSupported(): boolean {
    // Check if RTCRtpTransceiver supports Opus
    if (typeof RTCRtpTransceiver === 'undefined') {
      return false;
    }
    
    // Modern browsers support Opus by default
    return true;
  }

  /**
   * Optimize media constraints for Opus codec
   */
  private optimizeConstraints(constraints: MediaConstraints): MediaStreamConstraints {
    const optimized: MediaStreamConstraints = {
      audio: false,
      video: false
    };

    // Optimize audio constraints for Opus
    if (constraints.audio) {
      if (this.isOpusSupported()) {
        console.log('MediaStreamOptimizer: Applying simplified Opus audio optimization (avoiding potential muting)');
        // Use simpler constraints to avoid browser muting
        optimized.audio = this.lowLatencyAudioConstraints();
      } else {
        console.log('MediaStreamOptimizer: Opus not supported, using fallback audio constraints');
        optimized.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        };
      }
    }

    // Keep video constraints as-is
    if (constraints.video) {
      optimized.video = constraints.video;
    }

    return optimized;
  }

  /**
   * Add event listener
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    console.log(`MediaStreamOptimizer: Added listener for '${event}' event`);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`MediaStreamOptimizer: Removed listener for '${event}' event`);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`MediaStreamOptimizer: Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Create optimized media stream
   */
  async createOptimizedStream(
    callId: string,
    constraints: MediaConstraints,
    adaptiveConfig?: Partial<AdaptiveQualityConfig>
  ): Promise<MediaStream> {
    console.log(`MediaStreamOptimizer: Creating optimized stream for call ${callId}`, constraints);

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaStreamOptimizer: getUserMedia is not available. This may be due to insecure context (non-HTTPS).');
        
        // Try legacy getUserMedia as fallback
        const legacyGetUserMedia = (navigator as any).getUserMedia ||
                                   (navigator as any).webkitGetUserMedia ||
                                   (navigator as any).mozGetUserMedia ||
                                   (navigator as any).msGetUserMedia;
        
        if (legacyGetUserMedia) {
          console.log('MediaStreamOptimizer: Trying legacy getUserMedia...');
          return new Promise((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
        
        throw new Error('getUserMedia is not supported in this browser or context. Please use HTTPS or localhost.');
      }

      // Get user media with Opus-optimized constraints
      const optimizedConstraints = this.optimizeConstraints(constraints);
      console.log('MediaStreamOptimizer: Using optimized constraints:', optimizedConstraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(optimizedConstraints);
      
      // Store stream
      this.streams.set(callId, stream);

      // Set up adaptive quality configuration
      const config: AdaptiveQualityConfig = {
        enabled: adaptiveConfig?.enabled ?? true,
        minQuality: adaptiveConfig?.minQuality ?? this.defaultQualityLevels[0],
        maxQuality: adaptiveConfig?.maxQuality ?? this.defaultQualityLevels[3],
        qualityLevels: adaptiveConfig?.qualityLevels ?? this.defaultQualityLevels,
        bandwidthThresholds: adaptiveConfig?.bandwidthThresholds ?? this.defaultBandwidthThresholds,
        adjustmentInterval: adaptiveConfig?.adjustmentInterval ?? 5000
      };

      this.qualityConfigs.set(callId, config);

      // Initialize quality tracking
      if (constraints.video && typeof constraints.video === 'object') {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const initialQuality = this.getOptimalQuality(config, this.defaultBandwidthThresholds.excellent);
          await this.setVideoQuality(callId, videoTrack, initialQuality);
          this.currentQuality.set(callId, initialQuality);
        }
      }

      // Start metrics monitoring
      this.startMetricsMonitoring(callId, stream);

      console.log(`MediaStreamOptimizer: Optimized stream created for call ${callId}`);
      return stream;

    } catch (error) {
      console.error(`MediaStreamOptimizer: Failed to create optimized stream for call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Optimize existing stream
   */
  async optimizeStream(
    callId: string,
    stream: MediaStream,
    adaptiveConfig?: Partial<AdaptiveQualityConfig>
  ): Promise<void> {
    console.log(`MediaStreamOptimizer: Optimizing existing stream for call ${callId}`);

    // Store stream
    this.streams.set(callId, stream);

    // Set up adaptive quality configuration
    const config: AdaptiveQualityConfig = {
      enabled: adaptiveConfig?.enabled ?? true,
      minQuality: adaptiveConfig?.minQuality ?? this.defaultQualityLevels[0],
      maxQuality: adaptiveConfig?.maxQuality ?? this.defaultQualityLevels[3],
      qualityLevels: adaptiveConfig?.qualityLevels ?? this.defaultQualityLevels,
      bandwidthThresholds: adaptiveConfig?.bandwidthThresholds ?? this.defaultBandwidthThresholds,
      adjustmentInterval: adaptiveConfig?.adjustmentInterval ?? 5000
    };

    this.qualityConfigs.set(callId, config);

    // Optimize video tracks
    const videoTracks = stream.getVideoTracks();
    for (const videoTrack of videoTracks) {
      const initialQuality = this.getOptimalQuality(config, this.defaultBandwidthThresholds.excellent);
      await this.setVideoQuality(callId, videoTrack, initialQuality);
      this.currentQuality.set(callId, initialQuality);
    }

    // Start metrics monitoring
    this.startMetricsMonitoring(callId, stream);

    console.log(`MediaStreamOptimizer: Stream optimized for call ${callId}`);
  }

  /**
   * Start metrics monitoring
   */
  private startMetricsMonitoring(callId: string, stream: MediaStream): void {
    console.log(`MediaStreamOptimizer: Starting metrics monitoring for call ${callId}`);

    const interval = setInterval(async () => {
      try {
        const metrics = await this.getStreamMetrics(callId, stream);
        
        // Emit metrics
        this.emit('streamMetrics', {
          callId,
          metrics,
          timestamp: Date.now()
        });

        // Adaptive quality adjustment
        const config = this.qualityConfigs.get(callId);
        if (config && config.enabled) {
          await this.adjustQualityIfNeeded(callId, stream, metrics);
        }

      } catch (error) {
        console.error(`MediaStreamOptimizer: Failed to get metrics for call ${callId}:`, error);
      }
    }, 5000); // Monitor every 5 seconds

    this.metricsIntervals.set(callId, interval);
  }

  /**
   * Get stream metrics
   */
  private async getStreamMetrics(callId: string, stream: MediaStream): Promise<StreamMetrics> {
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    const metrics: StreamMetrics = {
      video: {
        width: 0,
        height: 0,
        frameRate: 0,
        bitrate: 0,
        quality: 'fair'
      },
      audio: {
        sampleRate: 0,
        bitrate: 0,
        quality: 'fair'
      },
      timestamp: Date.now()
    };

    // Get video metrics
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      const constraints = videoTrack.getConstraints();
      
      metrics.video.width = settings.width || 0;
      metrics.video.height = settings.height || 0;
      metrics.video.frameRate = settings.frameRate || 0;
      metrics.video.bitrate = this.estimateVideoBitrate(metrics.video.width, metrics.video.height, metrics.video.frameRate);
      metrics.video.quality = this.assessVideoQuality(metrics.video);
    }

    // Get audio metrics
    if (audioTrack) {
      const settings = audioTrack.getSettings();
      
      metrics.audio.sampleRate = settings.sampleRate || 0;
      metrics.audio.bitrate = this.estimateAudioBitrate(settings.sampleRate || 44100);
      metrics.audio.quality = this.assessAudioQuality(metrics.audio);
    }

    return metrics;
  }

  /**
   * Estimate video bitrate based on resolution and frame rate
   */
  private estimateVideoBitrate(width: number, height: number, frameRate: number): number {
    // Rough estimation: pixels * frame rate * bits per pixel
    const pixels = width * height;
    const bitsPerPixel = 0.1; // Conservative estimate
    return Math.round((pixels * frameRate * bitsPerPixel) / 1000); // Convert to kbps
  }

  /**
   * Estimate audio bitrate based on sample rate
   */
  private estimateAudioBitrate(sampleRate: number): number {
    // Typical audio bitrates: 64-128 kbps for voice, 128-320 kbps for music
    return sampleRate > 44100 ? 128 : 64;
  }

  /**
   * Assess video quality based on metrics
   */
  private assessVideoQuality(video: StreamMetrics['video']): StreamMetrics['video']['quality'] {
    if (video.width >= 1280 && video.height >= 720 && video.frameRate >= 30) {
      return 'excellent';
    } else if (video.width >= 640 && video.height >= 480 && video.frameRate >= 24) {
      return 'good';
    } else if (video.width >= 320 && video.height >= 240 && video.frameRate >= 15) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Assess audio quality based on metrics
   */
  private assessAudioQuality(audio: StreamMetrics['audio']): StreamMetrics['audio']['quality'] {
    if (audio.sampleRate >= 48000 && audio.bitrate >= 128) {
      return 'excellent';
    } else if (audio.sampleRate >= 44100 && audio.bitrate >= 96) {
      return 'good';
    } else if (audio.sampleRate >= 22050 && audio.bitrate >= 64) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Adjust quality if needed based on metrics
   */
  private async adjustQualityIfNeeded(
    callId: string,
    stream: MediaStream,
    metrics: StreamMetrics
  ): Promise<void> {
    const config = this.qualityConfigs.get(callId);
    const currentQuality = this.currentQuality.get(callId);
    
    if (!config || !currentQuality) return;

    // Determine target quality based on current performance
    const targetQuality = this.getOptimalQuality(config, metrics.video.bitrate);

    // Check if adjustment is needed
    if (this.shouldAdjustQuality(currentQuality, targetQuality)) {
      console.log(`MediaStreamOptimizer: Adjusting quality for call ${callId}: ${currentQuality.width}x${currentQuality.height} -> ${targetQuality.width}x${targetQuality.height}`);

      // Apply new quality
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        await this.setVideoQuality(callId, videoTrack, targetQuality);
        this.currentQuality.set(callId, targetQuality);

        // Emit quality change event
        this.emit('qualityAdjusted', {
          callId,
          fromQuality: currentQuality,
          toQuality: targetQuality,
          reason: 'adaptive',
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Get optimal quality based on available bandwidth
   */
  private getOptimalQuality(config: AdaptiveQualityConfig, bandwidth: number): VideoQualitySettings {
    const thresholds = config.bandwidthThresholds;

    if (bandwidth >= thresholds.excellent) {
      return config.maxQuality;
    } else if (bandwidth >= thresholds.good) {
      return config.qualityLevels[2] || config.maxQuality;
    } else if (bandwidth >= thresholds.fair) {
      return config.qualityLevels[1] || config.qualityLevels[0];
    } else {
      return config.minQuality;
    }
  }

  /**
   * Check if quality adjustment is needed
   */
  private shouldAdjustQuality(current: VideoQualitySettings, target: VideoQualitySettings): boolean {
    // Adjust if there's a significant difference in resolution or frame rate
    const resolutionDiff = Math.abs(current.width - target.width) + Math.abs(current.height - target.height);
    const frameRateDiff = Math.abs(current.frameRate - target.frameRate);
    
    return resolutionDiff > 100 || frameRateDiff > 5; // Threshold for adjustment
  }

  /**
   * Set video quality for a track
   */
  private async setVideoQuality(
    callId: string,
    videoTrack: MediaStreamTrack,
    quality: VideoQualitySettings
  ): Promise<void> {
    try {
      await videoTrack.applyConstraints({
        width: quality.width,
        height: quality.height,
        frameRate: quality.frameRate
      });

      console.log(`MediaStreamOptimizer: Video quality set for call ${callId}: ${quality.width}x${quality.height}@${quality.frameRate}fps`);
    } catch (error) {
      console.error(`MediaStreamOptimizer: Failed to set video quality for call ${callId}:`, error);
    }
  }

  /**
   * Manually adjust video quality
   */
  async adjustVideoQuality(callId: string, quality: VideoQualitySettings): Promise<void> {
    const stream = this.streams.get(callId);
    if (!stream) {
      console.warn(`MediaStreamOptimizer: No stream found for call ${callId}`);
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn(`MediaStreamOptimizer: No video track found for call ${callId}`);
      return;
    }

    console.log(`MediaStreamOptimizer: Manually adjusting video quality for call ${callId}: ${quality.width}x${quality.height}@${quality.frameRate}fps`);

    const currentQuality = this.currentQuality.get(callId);
    await this.setVideoQuality(callId, videoTrack, quality);
    this.currentQuality.set(callId, quality);

    // Emit manual quality change event
    this.emit('qualityAdjusted', {
      callId,
      fromQuality: currentQuality || quality,
      toQuality: quality,
      reason: 'manual',
      timestamp: Date.now()
    });
  }

  /**
   * Get current quality for a call
   */
  getCurrentQuality(callId: string): VideoQualitySettings | null {
    return this.currentQuality.get(callId) || null;
  }

  /**
   * Get stream for a call
   */
  getStream(callId: string): MediaStream | null {
    return this.streams.get(callId) || null;
  }

  /**
   * Stop all tracks in a stream
   */
  stopStreamTracks(callId: string): void {
    const stream = this.streams.get(callId);
    if (!stream) return;

    console.log(`MediaStreamOptimizer: Stopping all tracks for call ${callId}`);

    stream.getTracks().forEach(track => {
      track.stop();
      console.log(`MediaStreamOptimizer: Stopped ${track.kind} track: ${track.label}`);
    });
  }

  /**
   * Clean up stream and monitoring
   */
  cleanupStream(callId: string): void {
    console.log(`MediaStreamOptimizer: Cleaning up stream for call ${callId}`);

    // Stop all tracks
    this.stopStreamTracks(callId);

    // Clear metrics monitoring
    const interval = this.metricsIntervals.get(callId);
    if (interval) {
      clearInterval(interval);
      this.metricsIntervals.delete(callId);
    }

    // Remove stream and configuration
    this.streams.delete(callId);
    this.qualityConfigs.delete(callId);
    this.currentQuality.delete(callId);

    console.log(`MediaStreamOptimizer: Stream cleaned up for call ${callId}`);
  }

  /**
   * Clean up all streams
   */
  dispose(): void {
    console.log('MediaStreamOptimizer: Disposing all streams');

    // Clean up all streams
    const callIds = Array.from(this.streams.keys());
    for (const callId of callIds) {
      this.cleanupStream(callId);
    }

    // Clear event handlers
    this.eventHandlers.clear();

    console.log('MediaStreamOptimizer: Disposed');
  }
}

// Export singleton instance
export const mediaStreamOptimizer = new MediaStreamOptimizer();
