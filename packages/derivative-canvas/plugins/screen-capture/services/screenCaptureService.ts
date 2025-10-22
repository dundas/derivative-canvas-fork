/**
 * Screen Capture Service
 * Handles screen sharing, window capture, screenshots, and video recording
 */

export interface ScreenCaptureConfig {
  videoQuality?: 'low' | 'medium' | 'high';
  frameRate?: number;
  captureAudio?: boolean;
  maxDuration?: number; // in seconds
}

export interface CaptureSource {
  type: 'screen' | 'window' | 'tab' | 'camera';
  stream: MediaStream;
  track: MediaStreamTrack;
}

export interface ScreenshotOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number; // 0-1 for jpeg/webp
}

export interface VideoRecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
}

export type CaptureState = 'idle' | 'capturing' | 'recording' | 'processing' | 'error';

export class ScreenCaptureService {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private videoChunks: Blob[] = [];
  private config: ScreenCaptureConfig;
  private state: CaptureState = 'idle';
  private startTime: number = 0;

  // Event callbacks
  private onStateChange?: (state: CaptureState) => void;
  private onScreenshot?: (dataUrl: string) => void;
  private onVideoReady?: (blob: Blob) => void;
  private onError?: (error: Error) => void;

  constructor(config: ScreenCaptureConfig = {}) {
    this.config = {
      videoQuality: 'medium',
      frameRate: 30,
      captureAudio: false,
      maxDuration: 600, // 10 minutes default
      ...config,
    };
  }

  /**
   * Start screen capture (screen/window/tab selection)
   */
  async startScreenCapture(): Promise<CaptureSource> {
    try {
      const constraints = this.getDisplayMediaConstraints();

      this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      const videoTrack = this.stream.getVideoTracks()[0];

      if (!videoTrack) {
        throw new Error('No video track available');
      }

      // Listen for user stopping the share
      videoTrack.onended = () => {
        this.handleStreamEnded();
      };

      this.setState('capturing');

      console.log('[ScreenCapture] Screen capture started');

      return {
        type: this.getSourceType(videoTrack),
        stream: this.stream,
        track: videoTrack,
      };
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to capture screen'));
      throw error;
    }
  }

  /**
   * Start camera capture
   */
  async startCameraCapture(): Promise<CaptureSource> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: this.config.frameRate },
        },
        audio: this.config.captureAudio,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      const videoTrack = this.stream.getVideoTracks()[0];

      if (!videoTrack) {
        throw new Error('No video track available');
      }

      this.setState('capturing');

      console.log('[ScreenCapture] Camera capture started');

      return {
        type: 'camera',
        stream: this.stream,
        track: videoTrack,
      };
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to access camera'));
      throw error;
    }
  }

  /**
   * Take a screenshot of current stream
   */
  async captureScreenshot(options: ScreenshotOptions = {}): Promise<string> {
    if (!this.stream) {
      throw new Error('No active capture stream');
    }

    const videoTrack = this.stream.getVideoTracks()[0];

    if (!videoTrack) {
      throw new Error('No video track available');
    }

    try {
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = this.stream;
      video.muted = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
        video.play();
      });

      // Create canvas and draw current frame
      const canvas = document.createElement('canvas');
      const settings = videoTrack.getSettings();
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const format = options.format || 'png';
      const quality = options.quality || 0.92;

      const dataUrl = canvas.toDataURL(`image/${format}`, quality);

      console.log('[ScreenCapture] Screenshot captured');

      if (this.onScreenshot) {
        this.onScreenshot(dataUrl);
      }

      // Cleanup
      video.pause();
      video.srcObject = null;

      return dataUrl;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to capture screenshot'));
      throw error;
    }
  }

  /**
   * Start recording video
   */
  async startRecording(options: VideoRecordingOptions = {}): Promise<void> {
    if (!this.stream) {
      throw new Error('No active capture stream');
    }

    this.videoChunks = [];
    this.startTime = Date.now();

    try {
      const mimeType = options.mimeType || this.getSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || this.getVideoBitrate(),
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.videoChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.onerror = (event: any) => {
        this.handleError(new Error(`MediaRecorder error: ${event.error}`));
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.setState('recording');

      console.log('[ScreenCapture] Recording started');

      // Auto-stop after max duration
      if (this.config.maxDuration) {
        setTimeout(() => {
          this.stopRecording();
        }, this.config.maxDuration * 1000);
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to start recording'));
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (!this.mediaRecorder || this.state !== 'recording') {
      return;
    }

    this.mediaRecorder.stop();
    console.log('[ScreenCapture] Recording stopped');
  }

  /**
   * Process recorded video
   */
  private processRecording(): void {
    this.setState('processing');

    try {
      const videoBlob = new Blob(this.videoChunks, {
        type: this.mediaRecorder?.mimeType || 'video/webm',
      });

      const duration = (Date.now() - this.startTime) / 1000;

      console.log(`[ScreenCapture] Video ready (${duration.toFixed(2)}s, ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB)`);

      if (this.onVideoReady) {
        this.onVideoReady(videoBlob);
      }

      this.setState('capturing');
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to process recording'));
      this.setState('error');
    }
  }

  /**
   * Stop all capture
   */
  stopCapture(): void {
    if (this.state === 'recording') {
      this.stopRecording();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.setState('idle');
    console.log('[ScreenCapture] Capture stopped');
  }

  /**
   * Get display media constraints based on quality
   */
  private getDisplayMediaConstraints(): DisplayMediaStreamOptions {
    const quality = this.config.videoQuality || 'medium';

    const qualityPresets = {
      low: { width: 1280, height: 720, frameRate: 15 },
      medium: { width: 1920, height: 1080, frameRate: 30 },
      high: { width: 2560, height: 1440, frameRate: 60 },
    };

    const preset = qualityPresets[quality];

    return {
      video: {
        width: { ideal: preset.width },
        height: { ideal: preset.height },
        frameRate: { ideal: preset.frameRate },
      },
      audio: this.config.captureAudio,
    };
  }

  /**
   * Get video bitrate based on quality
   */
  private getVideoBitrate(): number {
    const quality = this.config.videoQuality || 'medium';

    const bitratePresets = {
      low: 2500000, // 2.5 Mbps
      medium: 5000000, // 5 Mbps
      high: 10000000, // 10 Mbps
    };

    return bitratePresets[quality];
  }

  /**
   * Get supported video mime type
   */
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
  }

  /**
   * Determine source type from track
   */
  private getSourceType(track: MediaStreamTrack): 'screen' | 'window' | 'tab' {
    const settings = track.getSettings();

    // Try to determine from track settings
    if ('displaySurface' in settings) {
      const surface = (settings as any).displaySurface;
      if (surface === 'monitor') return 'screen';
      if (surface === 'window') return 'window';
      if (surface === 'browser') return 'tab';
    }

    // Default to screen
    return 'screen';
  }

  /**
   * Handle stream ended (user stopped sharing)
   */
  private handleStreamEnded(): void {
    console.log('[ScreenCapture] Stream ended by user');
    this.stopCapture();
  }

  /**
   * Set capture state
   */
  private setState(state: CaptureState): void {
    this.state = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[ScreenCapture] Error:', error);
    if (this.onError) {
      this.onError(error);
    }
    this.setState('error');
  }

  /**
   * Get current state
   */
  getState(): CaptureState {
    return this.state;
  }

  /**
   * Get recording duration
   */
  getDuration(): number {
    if (this.state !== 'recording') return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Check if currently capturing
   */
  isCapturing(): boolean {
    return this.stream !== null;
  }

  /**
   * Set event callbacks
   */
  on(event: 'stateChange', callback: (state: CaptureState) => void): void;
  on(event: 'screenshot', callback: (dataUrl: string) => void): void;
  on(event: 'videoReady', callback: (blob: Blob) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: string, callback: any): void {
    switch (event) {
      case 'stateChange':
        this.onStateChange = callback;
        break;
      case 'screenshot':
        this.onScreenshot = callback;
        break;
      case 'videoReady':
        this.onVideoReady = callback;
        break;
      case 'error':
        this.onError = callback;
        break;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopCapture();
    this.mediaRecorder = null;
    this.videoChunks = [];
  }
}
