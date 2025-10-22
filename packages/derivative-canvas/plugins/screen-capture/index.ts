/**
 * Screen Capture Plugin for Derivative Canvas
 *
 * Screen sharing, video recording, and screenshot capabilities
 *
 * @packageDocumentation
 */

// Main plugin export
export { ScreenCapturePlugin } from './ScreenCapturePlugin';

// Components
export { ScreenCaptureButton } from './components/ScreenCaptureButton';

// Services
export { ScreenCaptureService } from './services/screenCaptureService';
export type {
  ScreenCaptureConfig,
  CaptureSource,
  ScreenshotOptions,
  VideoRecordingOptions,
  CaptureState,
} from './services/screenCaptureService';
