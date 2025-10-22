# Audio Input Plugin

Voice input plugin with automatic transcription for Excalidraw canvas. Enables users to interact with the AI assistant using voice commands.

## Features

- 🎤 **Microphone Access**: Real-time audio recording
- 🗣️ **Voice Transcription**: Automatic speech-to-text
- 🔄 **Multiple Providers**: OpenAI Whisper, Deepgram, Azure Speech, Custom
- 🎨 **Two Modes**: Push-to-talk or toggle recording
- 📊 **Audio Visualization**: Real-time audio level display
- ⏱️ **Duration Tracking**: Visual recording timer
- 🤖 **AI Integration**: Seamless connection with AI Chat plugin
- 🎯 **Floating UI**: Non-intrusive floating microphone button

## Installation

```bash
npm install @derivative-canvas/core
# or
yarn add @derivative-canvas/core
```

## Quick Start

### Basic Usage

```typescript
import { AudioInputPlugin } from '@derivative-canvas/core/plugins/audio-input';
import { DerivativeCanvasLayout } from '@derivative-canvas/core';

export default function CanvasPage() {
  return (
    <DerivativeCanvasLayout
      layoutType="canvas"
      plugins={[
        {
          plugin: AudioInputPlugin,
          config: {
            transcriptionProvider: 'openai',
            transcriptionApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            recordingMode: 'toggle', // or 'push-to-talk'
            buttonPosition: 'bottom-right',
          },
        },
      ]}
    />
  );
}
```

### With AI Chat Integration

```typescript
import { AudioInputPlugin } from '@derivative-canvas/core/plugins/audio-input';
import { AIChatPlugin } from '@derivative-canvas/core/plugins/ai-chat';

<DerivativeCanvasLayout
  plugins={[
    // AI Chat Plugin
    {
      plugin: AIChatPlugin,
      config: {
        aiProvider: 'anthropic',
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      },
    },
    // Audio Input Plugin
    {
      plugin: AudioInputPlugin,
      config: {
        transcriptionProvider: 'openai',
        transcriptionApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        sendToAIChat: true, // Send transcriptions to AI
        autoSubmit: true, // Auto-send to AI after transcription
      },
    },
  ]}
/>
```

## Transcription Providers

### OpenAI Whisper

```typescript
{
  transcriptionProvider: 'openai',
  transcriptionApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  transcriptionModel: 'whisper-1',
  transcriptionLanguage: 'en', // optional
}
```

### Deepgram

```typescript
{
  transcriptionProvider: 'deepgram',
  transcriptionApiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
  transcriptionModel: 'nova-2',
  transcriptionLanguage: 'en',
}
```

### Azure Speech

```typescript
{
  transcriptionProvider: 'azure',
  transcriptionApiKey: process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY,
  transcriptionApiEndpoint: 'https://YOUR_REGION.api.cognitive.microsoft.com/sts/v1.0',
}
```

### Custom Endpoint

```typescript
{
  transcriptionProvider: 'custom',
  transcriptionApiEndpoint: 'https://your-api.com/transcribe',
  transcriptionApiKey: 'your-api-key', // optional
}
```

## Configuration Options

```typescript
interface AudioInputConfig {
  // Transcription
  transcriptionProvider: 'openai' | 'deepgram' | 'azure' | 'custom';
  transcriptionApiKey?: string;
  transcriptionModel?: string;
  transcriptionLanguage?: string;
  transcriptionApiEndpoint?: string;

  // Recording
  recordingMode: 'push-to-talk' | 'toggle';
  maxRecordingDuration?: number; // seconds, default 300 (5 min)
  autoStop?: boolean; // default true

  // UI
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showVisualizer?: boolean; // default true

  // AI Integration
  sendToAIChat?: boolean; // default true
  autoSubmit?: boolean; // default false
}
```

## Recording Modes

### Toggle Mode (Default)

Click once to start recording, click again to stop:

```typescript
{
  recordingMode: 'toggle'
}
```

### Push-to-Talk Mode

Hold to record, release to stop:

```typescript
{
  recordingMode: 'push-to-talk'
}
```

## Programmatic Usage

### Using the Service Directly

```typescript
import { AudioRecordingService } from '@derivative-canvas/core/plugins/audio-input';

const service = new AudioRecordingService(
  {
    sampleRate: 44100,
    channels: 1,
    maxDuration: 300,
  },
  {
    provider: 'openai',
    apiKey: 'your-api-key',
  }
);

// Listen for events
service.on('transcription', (result) => {
  console.log('Transcribed:', result.text);
});

service.on('audioLevel', (level) => {
  console.log('Audio level:', level);
});

service.on('error', (error) => {
  console.error('Error:', error);
});

// Start recording
await service.startRecording();

// Stop recording (will auto-transcribe)
await service.stopRecording();

// Cleanup
service.dispose();
```

## Events

The plugin emits events that can be listened to:

```typescript
// Listen for transcription complete
context.framework.on('audio-input:transcription', (text: string) => {
  console.log('Voice input:', text);
});

// Listen for transcription events
context.framework.on('transcription:complete', (event) => {
  console.log('Transcription:', event.text);
  console.log('Source:', event.source); // 'audio-input'
});
```

## Examples

### Example 1: Voice Commands for Canvas

```typescript
import { AudioInputPlugin } from '@derivative-canvas/core/plugins/audio-input';

<DerivativeCanvasLayout
  plugins={[
    {
      plugin: AudioInputPlugin,
      config: {
        transcriptionProvider: 'openai',
        transcriptionApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        sendToAIChat: true,
        autoSubmit: true,
      },
    },
  ]}
/>

// User says: "Create a code block with a hello world function"
// → Transcribed automatically
// → Sent to AI Chat
// → AI creates code block on canvas
```

### Example 2: Multi-language Support

```typescript
{
  transcriptionProvider: 'openai',
  transcriptionApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  transcriptionLanguage: 'es', // Spanish
}
```

### Example 3: Custom Button Position

```typescript
{
  buttonPosition: 'top-left',
  showVisualizer: true,
}
```

## UI Components

### FloatingAudio Button States

| State | Appearance | Description |
|-------|------------|-------------|
| Idle | Blue | Ready to record |
| Recording | Red (pulsing) | Currently recording |
| Processing | Yellow (spinning) | Transcribing audio |
| Error | Gray | Error occurred |

### Visual Feedback

- **Duration Timer**: Shows recording time
- **Audio Level**: Real-time visualization
- **Mode Indicator**: Shows PTT or TAP mode
- **Tooltips**: Helpful hints on hover

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Safari | ✅ | Requires HTTPS |
| Edge | ✅ | Full support |
| Mobile Safari | ⚠️ | Limited support |
| Mobile Chrome | ✅ | Full support |

**Note**: Microphone access requires HTTPS in production.

## Permissions

The plugin requires:
- Microphone permission
- Internet connection (for transcription)

Browser will prompt user for microphone access on first use.

## Error Handling

```typescript
service.on('error', (error) => {
  switch (error.message) {
    case 'Failed to access microphone':
      // Permission denied or hardware issue
      break;
    case 'OpenAI API error':
      // Transcription API issue
      break;
    default:
      console.error('Audio error:', error);
  }
});
```

## Performance

- **Audio Recording**: Minimal CPU usage
- **Memory**: ~1-2MB per minute of audio
- **Network**: Depends on transcription provider
  - OpenAI: ~1MB per minute
  - Deepgram: Streaming (lower latency)

## Security

- Audio never stored locally
- Sent directly to transcription provider
- API keys should be in environment variables
- Use HTTPS in production

## Troubleshooting

### Microphone Not Working

1. Check browser permissions
2. Verify HTTPS (required in production)
3. Test with browser's permission settings
4. Check console for errors

### Transcription Failing

1. Verify API key is correct
2. Check network connectivity
3. Ensure provider endpoint is accessible
4. Review API quota/limits

### Poor Transcription Quality

1. Check microphone quality
2. Reduce background noise
3. Speak clearly and at moderate pace
4. Try different transcription provider

## API Reference

### AudioRecordingService

```typescript
class AudioRecordingService {
  constructor(
    config: AudioRecordingConfig,
    transcriptionConfig: TranscriptionConfig
  );

  initialize(): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  getState(): RecordingState;
  getDuration(): number;
  on(event: string, callback: Function): void;
  dispose(): void;
}
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Built for seamless voice interaction with Excalidraw canvas** 🎤
