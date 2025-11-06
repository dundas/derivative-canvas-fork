# Screen Capture Plugin

Screen sharing and video recording plugin for Excalidraw canvas. Capture your screen, windows, or camera and share with AI for analysis.

## Features

- 📺 **Screen Sharing**: Capture entire screen, specific window, or browser tab
- 📹 **Video Recording**: Record screen activity with audio
- 📸 **Screenshots**: Instant screen captures
- 📷 **Camera Support**: Use webcam instead of screen
- 🎨 **Canvas Integration**: Add screenshots directly to canvas
- 🤖 **AI Vision**: Send captures to AI for visual analysis
- 🎯 **Floating Controls**: Easy-to-use floating button interface

## Installation

```bash
npm install @derivative-canvas/core
```

## Quick Start

```typescript
import { ScreenCapturePlugin } from "@derivative-canvas/core/plugins/screen-capture";

<DerivativeCanvasLayout
  plugins={[
    {
      plugin: ScreenCapturePlugin,
      config: {
        mode: "both", // 'screenshot', 'recording', or 'both'
        videoQuality: "medium", // 'low', 'medium', 'high'
        buttonPosition: "bottom-left",
        autoAddToCanvas: true,
      },
    },
  ]}
/>;
```

## Configuration

```typescript
interface ScreenCaptureConfig {
  mode: "screenshot" | "recording" | "both";
  videoQuality: "low" | "medium" | "high";
  buttonPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  autoAddToCanvas: boolean;
  sendToAIChat: boolean;
  enableVisionAnalysis: boolean;
  maxRecordingDuration: number; // seconds
  captureAudio: boolean;
}
```

## Usage

### Taking Screenshots

1. Click the purple video button
2. Select "Share Screen/Window"
3. Choose what to share
4. Click "Take Screenshot"
5. Screenshot automatically added to canvas

### Recording Video

1. Start screen capture
2. Click "Start Recording"
3. Record your content
4. Click "Stop Recording"
5. Video downloads automatically

## Video Quality Settings

| Quality | Resolution | Frame Rate | Bitrate  |
| ------- | ---------- | ---------- | -------- |
| Low     | 1280x720   | 15 fps     | 2.5 Mbps |
| Medium  | 1920x1080  | 30 fps     | 5 Mbps   |
| High    | 2560x1440  | 60 fps     | 10 Mbps  |

## With AI Chat Integration

```typescript
<DerivativeCanvasLayout
  plugins={[
    {
      plugin: ScreenCapturePlugin,
      config: {
        sendToAIChat: true,
        enableVisionAnalysis: true,
      },
    },
    {
      plugin: AIChatPlugin,
      config: {
        aiProvider: "anthropic", // Claude has vision capabilities
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      },
    },
  ]}
/>
```

## Events

```typescript
// Screenshot captured
context.framework.on("screenshot:captured", (event) => {
  console.log("Screenshot:", event.dataUrl);
});

// Video recorded
context.framework.on("video:recorded", (event) => {
  console.log("Video:", event.blob.size, "bytes");
});

// Capture started
context.framework.on("capture:started", (event) => {
  console.log("Capture type:", event.type); // 'screen', 'window', 'tab', 'camera'
});
```

## Programmatic Usage

```typescript
import { ScreenCaptureService } from "@derivative-canvas/core/plugins/screen-capture";

const service = new ScreenCaptureService({
  videoQuality: "high",
  captureAudio: true,
});

// Start screen capture
const source = await service.startScreenCapture();
console.log("Capturing:", source.type);

// Take screenshot
const dataUrl = await service.captureScreenshot({
  format: "png",
  quality: 0.95,
});

// Start recording
await service.startRecording();

// Stop recording (triggers videoReady event)
service.stopRecording();

// Stop capture
service.stopCapture();
```

## Browser Support

| Browser | Screen Capture | Video Recording |
| ------- | -------------- | --------------- |
| Chrome  | ✅             | ✅              |
| Firefox | ✅             | ✅              |
| Safari  | ✅             | ⚠️ Limited      |
| Edge    | ✅             | ✅              |

**Note**: Requires HTTPS in production.

## Permissions

- Screen capture permission (browser prompt)
- Camera permission (if using camera mode)
- Microphone permission (if recording audio)

## Tips

1. **High Quality**: Use for detailed captures
2. **Medium Quality**: Balance of quality and file size
3. **Low Quality**: For quick shares and demos
4. **Audio**: Enable for tutorial recordings
5. **Camera**: Great for picture-in-picture overlays

## Troubleshooting

### Can't Share Screen

- Ensure HTTPS (required)
- Check browser permissions
- Try different browser

### Recording Not Working

- Verify browser supports MediaRecorder API
- Check available disk space
- Reduce video quality

### Large File Sizes

- Use lower quality setting
- Shorten recording duration
- Disable audio if not needed

## License

MIT License

---

**Capture and share your screen effortlessly** 📹
