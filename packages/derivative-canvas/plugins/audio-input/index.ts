/**
 * Audio Input Plugin for Derivative Canvas
 *
 * Voice input with automatic transcription
 *
 * @packageDocumentation
 */

// Main plugin export
export { AudioInputPlugin } from './AudioInputPlugin';

// Components
export { AudioInputButton } from './components/AudioInputButton';

// Services
export { AudioRecordingService } from './services/audioRecordingService';
export type {
  AudioRecordingConfig,
  TranscriptionConfig,
  TranscriptionResult,
  RecordingState,
} from './services/audioRecordingService';
