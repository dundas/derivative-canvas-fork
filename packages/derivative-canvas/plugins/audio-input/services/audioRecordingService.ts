/**
 * Audio Recording Service
 * Handles microphone access, audio recording, and real-time transcription
 */

export interface AudioRecordingConfig {
  sampleRate?: number;
  channels?: number;
  mimeType?: string;
  maxDuration?: number; // in seconds
  autoStop?: boolean;
}

export interface TranscriptionConfig {
  provider: 'openai' | 'deepgram' | 'azure' | 'custom';
  apiKey?: string;
  model?: string;
  language?: string;
  apiEndpoint?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private config: AudioRecordingConfig;
  private transcriptionConfig: TranscriptionConfig;
  private state: RecordingState = 'idle';
  private startTime: number = 0;
  private autoStopTimer: NodeJS.Timeout | null = null;

  // Event callbacks
  private onStateChange?: (state: RecordingState) => void;
  private onTranscription?: (result: TranscriptionResult) => void;
  private onError?: (error: Error) => void;
  private onAudioLevel?: (level: number) => void;

  // Audio analysis
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;

  constructor(
    config: AudioRecordingConfig = {},
    transcriptionConfig: TranscriptionConfig
  ) {
    this.config = {
      sampleRate: 44100,
      channels: 1,
      mimeType: 'audio/webm',
      maxDuration: 300, // 5 minutes default
      autoStop: true,
      ...config,
    };
    this.transcriptionConfig = transcriptionConfig;
  }

  /**
   * Request microphone permission and initialize
   */
  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Initialize audio context for level monitoring
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      console.log('[AudioRecording] Microphone initialized');
    } catch (error) {
      const err = new Error(`Failed to access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (!this.stream) {
      await this.initialize();
    }

    if (!this.stream) {
      throw new Error('No audio stream available');
    }

    this.audioChunks = [];
    this.startTime = Date.now();

    try {
      // Determine supported mime type
      const mimeType = this.getSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processRecording();
      };

      this.mediaRecorder.onerror = (event: any) => {
        this.handleError(new Error(`MediaRecorder error: ${event.error}`));
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.setState('recording');

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      // Set auto-stop timer if enabled
      if (this.config.autoStop && this.config.maxDuration) {
        this.autoStopTimer = setTimeout(() => {
          this.stopRecording();
        }, this.config.maxDuration * 1000);
      }

      console.log('[AudioRecording] Recording started');
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to start recording'));
      throw error;
    }
  }

  /**
   * Stop recording and process audio
   */
  async stopRecording(): Promise<void> {
    if (!this.mediaRecorder || this.state !== 'recording') {
      return;
    }

    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    this.stopAudioLevelMonitoring();

    this.mediaRecorder.stop();
    console.log('[AudioRecording] Recording stopped');
  }

  /**
   * Process recorded audio and transcribe
   */
  private async processRecording(): Promise<void> {
    this.setState('processing');

    try {
      const audioBlob = new Blob(this.audioChunks, { type: this.config.mimeType });
      const duration = (Date.now() - this.startTime) / 1000;

      console.log(`[AudioRecording] Processing ${duration.toFixed(2)}s of audio`);

      // Transcribe audio
      const transcription = await this.transcribeAudio(audioBlob);

      if (this.onTranscription) {
        this.onTranscription({
          ...transcription,
          duration,
        });
      }

      this.setState('idle');
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to process recording'));
      this.setState('error');
    }
  }

  /**
   * Transcribe audio using configured provider
   */
  private async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    const { provider, apiKey, model, language, apiEndpoint } = this.transcriptionConfig;

    switch (provider) {
      case 'openai':
        return this.transcribeWithOpenAI(audioBlob, apiKey!, model, language);

      case 'deepgram':
        return this.transcribeWithDeepgram(audioBlob, apiKey!, model, language);

      case 'azure':
        return this.transcribeWithAzure(audioBlob, apiKey!, apiEndpoint!);

      case 'custom':
        return this.transcribeWithCustom(audioBlob, apiEndpoint!, apiKey);

      default:
        throw new Error(`Unknown transcription provider: ${provider}`);
    }
  }

  /**
   * Transcribe using OpenAI Whisper API
   */
  private async transcribeWithOpenAI(
    audioBlob: Blob,
    apiKey: string,
    model: string = 'whisper-1',
    language?: string
  ): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', model);
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.text,
      language: data.language,
    };
  }

  /**
   * Transcribe using Deepgram API
   */
  private async transcribeWithDeepgram(
    audioBlob: Blob,
    apiKey: string,
    model: string = 'nova-2',
    language: string = 'en'
  ): Promise<TranscriptionResult> {
    const arrayBuffer = await audioBlob.arrayBuffer();

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?model=${model}&language=${language}&smart_format=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/webm',
        },
        body: arrayBuffer,
      }
    );

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.results.channels[0].alternatives[0].transcript,
      confidence: data.results.channels[0].alternatives[0].confidence,
    };
  }

  /**
   * Transcribe using Azure Speech API
   */
  private async transcribeWithAzure(
    audioBlob: Blob,
    apiKey: string,
    endpoint: string
  ): Promise<TranscriptionResult> {
    const arrayBuffer = await audioBlob.arrayBuffer();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'audio/wav',
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      throw new Error(`Azure API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.DisplayText || data.text,
    };
  }

  /**
   * Transcribe using custom endpoint
   */
  private async transcribeWithCustom(
    audioBlob: Blob,
    endpoint: string,
    apiKey?: string
  ): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.text || data.transcript,
      confidence: data.confidence,
    };
  }

  /**
   * Get supported audio mime type
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }

  /**
   * Start monitoring audio levels
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const monitorLevel = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalized = average / 255;

      if (this.onAudioLevel) {
        this.onAudioLevel(normalized);
      }

      this.animationFrame = requestAnimationFrame(monitorLevel);
    };

    monitorLevel();
  }

  /**
   * Stop monitoring audio levels
   */
  private stopAudioLevelMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Set recording state and notify
   */
  private setState(state: RecordingState): void {
    this.state = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[AudioRecording] Error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
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
   * Set event callbacks
   */
  on(event: 'stateChange', callback: (state: RecordingState) => void): void;
  on(event: 'transcription', callback: (result: TranscriptionResult) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: 'audioLevel', callback: (level: number) => void): void;
  on(event: string, callback: any): void {
    switch (event) {
      case 'stateChange':
        this.onStateChange = callback;
        break;
      case 'transcription':
        this.onTranscription = callback;
        break;
      case 'error':
        this.onError = callback;
        break;
      case 'audioLevel':
        this.onAudioLevel = callback;
        break;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopRecording();
    this.stopAudioLevelMonitoring();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.analyser = null;
  }
}
