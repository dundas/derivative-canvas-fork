# Multi-Plugin Integration Guide

Complete guide for using Audio Input, Screen Capture, and AI Chat plugins together to create a powerful multimodal canvas experience.

## Overview

The Derivative Canvas plugin ecosystem allows seamless integration between:

1. **AI Chat Plugin** - Intelligent assistant that creates canvas elements
2. **Audio Input Plugin** - Voice commands via transcription
3. **Screen Capture Plugin** - Screen/video sharing with AI vision analysis

## Complete Integration Example

```typescript
"use client";

import { DerivativeCanvasLayout } from "@derivative-canvas/core";
import { AIChatPlugin } from "@derivative-canvas/core/plugins/ai-chat";
import { AudioInputPlugin } from "@derivative-canvas/core/plugins/audio-input";
import { ScreenCapturePlugin } from "@derivative-canvas/core/plugins/screen-capture";

export default function FullyIntegratedCanvas() {
  return (
    <DerivativeCanvasLayout
      layoutType="canvas"
      plugins={[
        // AI Chat - The brain
        {
          plugin: AIChatPlugin,
          config: {
            aiProvider: "anthropic", // Claude has vision + text
            apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
            model: "claude-3-5-sonnet-20241022",
            chatMode: "sidebar",
          },
        },

        // Audio Input - Voice commands
        {
          plugin: AudioInputPlugin,
          config: {
            transcriptionProvider: "openai",
            transcriptionApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            recordingMode: "toggle",
            buttonPosition: "bottom-right",
            sendToAIChat: true,
            autoSubmit: true,
          },
        },

        // Screen Capture - Visual input
        {
          plugin: ScreenCapturePlugin,
          config: {
            mode: "both",
            videoQuality: "medium",
            buttonPosition: "bottom-left",
            autoAddToCanvas: true,
            sendToAIChat: true,
            enableVisionAnalysis: true,
          },
        },
      ]}
    />
  );
}
```

## User Workflows

### Workflow 1: Voice → AI → Canvas

```
User speaks: "Create a Python function to calculate fibonacci"
   ↓
Audio Input Plugin transcribes speech
   ↓
Transcription sent to AI Chat
   ↓
AI generates code
   ↓
Code block appears on canvas
```

### Workflow 2: Screen Share → AI Analysis → Canvas

```
User shares screen showing a diagram
   ↓
Screen Capture takes screenshot
   ↓
Screenshot sent to AI Chat (vision analysis)
   ↓
AI describes the diagram and suggests improvements
   ↓
AI creates annotated version on canvas
```

### Workflow 3: Multi-Modal Input

```
User shares screen + speaks:
"Analyze this error message and create a fix"
   ↓
Screen capture provides visual context
Audio input provides verbal instruction
   ↓
AI processes both inputs
   ↓
AI creates code fix and explanation on canvas
```

## Environment Variables

```bash
# .env.local

# AI Chat
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
# OR
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Audio Transcription (can use same OpenAI key)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
# OR
NEXT_PUBLIC_DEEPGRAM_API_KEY=...
```

## Configuration Matrix

| Feature            | AI Chat | Audio Input | Screen Capture |
| ------------------ | ------- | ----------- | -------------- |
| API Required       | ✅      | ✅          | ❌             |
| Network            | ✅      | ✅          | ❌\*           |
| Permissions        | None    | Microphone  | Screen/Camera  |
| Floating UI        | ❌      | ✅          | ✅             |
| Canvas Integration | ✅      | ✅          | ✅             |

\*Network required only for AI analysis

## Event Communication

Plugins communicate via the framework event system:

```typescript
// Audio Input → AI Chat
context.framework.on("audio-input:transcription", (text) => {
  // Send to AI Chat
});

// Screen Capture → AI Chat
context.framework.on("screen-capture:screenshot", (event) => {
  // Send image to AI for vision analysis
});

// AI Chat → Canvas
context.framework.on("ai-chat:element-created", (elements) => {
  // Elements automatically added to canvas
});
```

## Advanced Patterns

### Pattern 1: Continuous Voice Control

```typescript
{
  plugin: AudioInputPlugin,
  config: {
    recordingMode: 'push-to-talk', // Hold to speak
    autoSubmit: true, // Send immediately when done
    sendToAIChat: true,
  },
}
```

### Pattern 2: Screenshot + Voice Annotation

```typescript
// User workflow:
// 1. Take screenshot
// 2. Speak: "Add a red circle around the bug"
// 3. AI processes screenshot + voice command
// 4. Annotated image appears on canvas
```

### Pattern 3: Live Screen Share with Running Commentary

```typescript
// User workflow:
// 1. Start screen sharing
// 2. Continuously speak instructions
// 3. AI provides real-time analysis
// 4. Creates documentation on canvas
```

## UI Layout

Recommended button positions to avoid overlap:

```
┌─────────────────────────┐
│                         │
│                         │
│      CANVAS AREA        │
│                         │
│                         │
│   📹                 🎤 │ ← Floating buttons
└─────────────────────────┘
 Screen              Audio
 Capture             Input
```

## Performance Optimization

### Audio Input

```typescript
{
  maxRecordingDuration: 60, // Limit to 1 minute
  autoStop: true, // Auto-stop at limit
}
```

### Screen Capture

```typescript
{
  videoQuality: 'medium', // Balance quality vs size
  maxRecordingDuration: 300, // 5 minutes max
}
```

### AI Chat

```typescript
{
  // Limit context to improve response time
  maxHistorySize: 10,
}
```

## Error Handling

```typescript
// Listen for errors from any plugin
context.framework.on("plugin:error", (event) => {
  console.error(`${event.plugin}: ${event.error.message}`);

  switch (event.plugin) {
    case "audio-input":
      // Show mic permission prompt
      break;
    case "screen-capture":
      // Show screen share instructions
      break;
    case "ai-chat":
      // Show API key error
      break;
  }
});
```

## Security Best Practices

1. **API Keys**: Always use environment variables
2. **HTTPS**: Required for mic/screen access in production
3. **Permissions**: Request only when needed
4. **Data**: Audio/video not stored, sent directly to providers
5. **Privacy**: Inform users about transcription/analysis

## Mobile Considerations

| Plugin         | iOS Safari | Android Chrome |
| -------------- | ---------- | -------------- |
| AI Chat        | ✅         | ✅             |
| Audio Input    | ⚠️ Limited | ✅             |
| Screen Capture | ❌         | ⚠️ Limited     |

**Recommendation**: Provide fallback text input for mobile users.

## Testing

```typescript
// Test audio input
const testAudio = async () => {
  const service = new AudioRecordingService(
    {},
    {
      provider: "openai",
      apiKey: "test-key",
    },
  );

  await service.initialize();
  console.log("Microphone ready");
};

// Test screen capture
const testScreen = async () => {
  const service = new ScreenCaptureService();
  const source = await service.startScreenCapture();
  console.log("Screen sharing:", source.type);
};
```

## Common Issues

### Issue: Plugins Not Communicating

**Solution**: Ensure all plugins have `framework` context:

```typescript
if (!context.framework) {
  console.error("Framework context not available");
  return;
}
```

### Issue: Audio/Screen Permissions Denied

**Solution**: Provide clear UI feedback and instructions:

```typescript
try {
  await service.initialize();
} catch (error) {
  if (error.message.includes("permission")) {
    showPermissionInstructions();
  }
}
```

### Issue: AI Not Receiving Input

**Solution**: Verify event emission:

```typescript
// Audio Input should emit
context.framework.emit("audio-input:transcription", text);

// AI Chat should listen
context.framework.on("audio-input:transcription", handleTranscription);
```

## Next Steps

1. Set up environment variables
2. Configure all three plugins
3. Test individually first
4. Test integrated workflows
5. Customize for your use case

## Examples Repository

See `/examples` directory for:

- `multimodal-canvas.tsx` - Full integration
- `voice-only-canvas.tsx` - Audio + AI Chat
- `vision-canvas.tsx` - Screen + AI Chat

## Support

- Documentation: [docs.derivative-canvas.dev](https://docs.derivative-canvas.dev)
- Issues: [GitHub Issues](https://github.com/your-org/derivative-canvas/issues)
- Discord: [Join Community](https://discord.gg/derivative-canvas)

---

**Create amazing multimodal canvas experiences!** 🎨🎤📹
