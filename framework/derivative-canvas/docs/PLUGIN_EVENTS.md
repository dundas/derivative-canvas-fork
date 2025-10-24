# Plugin Event System API

Comprehensive documentation for the Derivative Canvas plugin event system.

## Overview

The Derivative Canvas framework includes a robust event system that enables plugins to communicate with each other and respond to application lifecycle events. This event-driven architecture allows for loosely coupled, extensible plugin development.

## Event Categories

### 1. Plugin Lifecycle Events

Events related to plugin mounting, unmounting, and lifecycle management.

#### `plugin:mounted`

Emitted when a plugin is successfully mounted.

```typescript
context.framework.on("plugin:mounted", (event: PluginMountedEvent) => {
  console.log(`Plugin ${event.pluginId} mounted`);
});
```

**Event Payload:**
```typescript
interface PluginMountedEvent {
  pluginId: string;      // Unique plugin identifier
  pluginName: string;    // Human-readable plugin name
  pluginVersion: string; // Plugin version
  timestamp: Date;       // Mount timestamp
}
```

**Example:**
```typescript
{
  pluginId: "audio-input",
  pluginName: "Audio Input",
  pluginVersion: "1.0.0",
  timestamp: new Date("2025-01-15T10:30:00Z")
}
```

---

#### `plugin:unmounted`

Emitted when a plugin is unmounted.

```typescript
context.framework.on("plugin:unmounted", (event: PluginUnmountedEvent) => {
  console.log(`Plugin ${event.pluginId} unmounted`);
});
```

**Event Payload:**
```typescript
interface PluginUnmountedEvent {
  pluginId: string;      // Unique plugin identifier
  pluginName: string;    // Human-readable plugin name
  reason?: string;       // Optional reason for unmounting
  timestamp: Date;       // Unmount timestamp
}
```

---

### 2. Canvas Events

Events related to canvas state and element changes.

#### `canvas:loaded`

Emitted when a canvas is loaded from storage.

```typescript
context.framework.on("canvas:loaded", (event: CanvasLoadedEvent) => {
  console.log(`Canvas ${event.canvasId} loaded with ${event.elementCount} elements`);
});
```

**Event Payload:**
```typescript
interface CanvasLoadedEvent {
  canvasId: string;           // Canvas identifier
  canvasName: string;         // Canvas name
  elementCount: number;       // Number of elements
  userId: string;             // Owner user ID
  timestamp: Date;            // Load timestamp
  source: 'storage' | 'share'; // Load source
}
```

**Example:**
```typescript
{
  canvasId: "canvas_xyz789",
  canvasName: "Design Mockup",
  elementCount: 42,
  userId: "user_123abc",
  timestamp: new Date(),
  source: "storage"
}
```

---

#### `canvas:saved`

Emitted when a canvas is saved to storage.

```typescript
context.framework.on("canvas:saved", (event: CanvasSavedEvent) => {
  console.log(`Canvas ${event.canvasId} saved`);
});
```

**Event Payload:**
```typescript
interface CanvasSavedEvent {
  canvasId: string;      // Canvas identifier
  canvasName: string;    // Canvas name
  elementCount: number;  // Number of elements
  timestamp: Date;       // Save timestamp
  autoSave: boolean;     // Whether this was an auto-save
}
```

---

#### `canvas:shared`

Emitted when a canvas is shared with other users.

```typescript
context.framework.on("canvas:shared", (event: CanvasSharedEvent) => {
  console.log(`Canvas shared with ${event.permissions.type} access`);
});
```

**Event Payload:**
```typescript
interface CanvasSharedEvent {
  canvasId: string;              // Canvas identifier
  shareId: string;               // Unique share identifier
  shareUrl: string;              // Full share URL
  permissions: SharePermissions; // Share permissions
  timestamp: Date;               // Share timestamp
}
```

**Example:**
```typescript
{
  canvasId: "canvas_xyz789",
  shareId: "share_1234567890",
  shareUrl: "https://app.com/canvas/share/share_1234567890",
  permissions: {
    type: "view",
    public: true,
    expiresAt: null
  },
  timestamp: new Date()
}
```

---

#### `elements:changed`

Emitted when canvas elements are added, modified, or deleted.

```typescript
context.framework.on("elements:changed", (event: ElementsChangedEvent) => {
  console.log(`${event.changedElements.length} elements changed`);
});
```

**Event Payload:**
```typescript
interface ElementsChangedEvent {
  elements: ExcalidrawElement[];    // Current elements array
  changedElements: string[];        // IDs of changed elements
  action: 'add' | 'update' | 'delete'; // Type of change
  timestamp: Date;                  // Change timestamp
}
```

---

#### `appstate:changed`

Emitted when the Excalidraw app state changes (zoom, view, selection, etc.).

```typescript
context.framework.on("appstate:changed", (event: AppStateChangedEvent) => {
  console.log(`App state changed: ${event.changedKeys.join(', ')}`);
});
```

**Event Payload:**
```typescript
interface AppStateChangedEvent {
  appState: AppState;          // Current app state
  changedKeys: string[];       // Keys that changed
  previousState?: Partial<AppState>; // Previous state (if available)
  timestamp: Date;             // Change timestamp
}
```

---

### 3. User Events

Events related to user authentication and state.

#### `user:changed`

Emitted when the current user changes (login, logout, profile update).

```typescript
context.framework.on("user:changed", (event: UserChangedEvent) => {
  console.log(`User changed: ${event.user?.name || 'logged out'}`);
});
```

**Event Payload:**
```typescript
interface UserChangedEvent {
  user: User | null;           // Current user (null if logged out)
  previousUser: User | null;   // Previous user
  action: 'login' | 'logout' | 'update'; // Type of change
  timestamp: Date;             // Change timestamp
}
```

---

### 4. Collaboration Events

Events related to real-time collaboration.

#### `collaboration:joined`

Emitted when a user joins a collaborative session.

```typescript
context.framework.on("collaboration:joined", (event: CollaborationJoinedEvent) => {
  console.log(`User ${event.user.name} joined`);
});
```

**Event Payload:**
```typescript
interface CollaborationJoinedEvent {
  user: User;                  // User who joined
  sessionId: string;           // Collaboration session ID
  canvasId: string;            // Canvas ID
  timestamp: Date;             // Join timestamp
  participantCount: number;    // Total participants
}
```

---

#### `collaboration:left`

Emitted when a user leaves a collaborative session.

```typescript
context.framework.on("collaboration:left", (event: CollaborationLeftEvent) => {
  console.log(`User ${event.user.name} left`);
});
```

**Event Payload:**
```typescript
interface CollaborationLeftEvent {
  user: User;                  // User who left
  sessionId: string;           // Collaboration session ID
  canvasId: string;            // Canvas ID
  timestamp: Date;             // Leave timestamp
  participantCount: number;    // Remaining participants
  reason?: string;             // Optional reason (timeout, disconnect, etc.)
}
```

---

### 5. Audio Input Plugin Events

Events specific to the Audio Input plugin.

#### `audio-input:transcription`

Emitted when audio transcription is complete.

```typescript
context.framework.on("audio-input:transcription", (text: string) => {
  console.log("Transcribed text:", text);
});
```

**Event Payload:**
```typescript
type AudioTranscriptionPayload = string; // Transcribed text
```

---

#### `transcription:complete`

Detailed transcription event with metadata.

```typescript
context.framework.on("transcription:complete", (event: TranscriptionCompleteEvent) => {
  console.log(`Transcription from ${event.source}: ${event.text}`);
});
```

**Event Payload:**
```typescript
interface TranscriptionCompleteEvent {
  text: string;              // Transcribed text
  source: string;            // Source plugin ("audio-input", etc.)
  confidence?: number;       // Transcription confidence (0-1)
  language?: string;         // Detected language code
  duration?: number;         // Audio duration in seconds
  timestamp: Date;           // Transcription timestamp
}
```

**Example:**
```typescript
{
  text: "Create a rectangle on the canvas",
  source: "audio-input",
  confidence: 0.95,
  language: "en",
  duration: 3.5,
  timestamp: new Date()
}
```

---

### 6. Screen Capture Plugin Events

Events specific to the Screen Capture plugin.

#### `screen-capture:screenshot`

Emitted when a screenshot is captured.

```typescript
context.framework.on("screen-capture:screenshot", (event: ScreenshotCapturedEvent) => {
  console.log("Screenshot captured:", event.dataUrl);
});
```

**Event Payload:**
```typescript
interface ScreenshotCapturedEvent {
  dataUrl: string;           // Base64 data URL of screenshot
  width: number;             // Image width in pixels
  height: number;            // Image height in pixels
  format: 'png' | 'jpeg';    // Image format
  timestamp: Date;           // Capture timestamp
  source: 'screen' | 'window' | 'tab'; // Capture source
}
```

---

#### `screen-capture:recording-started`

Emitted when screen recording starts.

```typescript
context.framework.on("screen-capture:recording-started", (event: RecordingStartedEvent) => {
  console.log("Screen recording started");
});
```

**Event Payload:**
```typescript
interface RecordingStartedEvent {
  sessionId: string;         // Recording session ID
  source: 'screen' | 'window' | 'tab'; // Recording source
  timestamp: Date;           // Start timestamp
}
```

---

#### `screen-capture:recording-stopped`

Emitted when screen recording stops.

```typescript
context.framework.on("screen-capture:recording-stopped", (event: RecordingStoppedEvent) => {
  console.log("Screen recording stopped:", event.duration, "seconds");
});
```

**Event Payload:**
```typescript
interface RecordingStoppedEvent {
  sessionId: string;         // Recording session ID
  duration: number;          // Recording duration in seconds
  videoUrl?: string;         // Video blob URL (if available)
  timestamp: Date;           // Stop timestamp
}
```

---

### 7. AI Chat Plugin Events

Events specific to the AI Chat plugin.

#### `ai-chat:element-created`

Emitted when the AI creates new canvas elements.

```typescript
context.framework.on("ai-chat:element-created", (event: AIElementCreatedEvent) => {
  console.log(`AI created ${event.elements.length} elements`);
});
```

**Event Payload:**
```typescript
interface AIElementCreatedEvent {
  elements: ExcalidrawElement[]; // Created elements
  prompt: string;                // User prompt that triggered creation
  aiProvider: string;            // AI provider used ("openai", "anthropic", etc.)
  timestamp: Date;               // Creation timestamp
}
```

---

#### `ai-chat:message-sent`

Emitted when a user sends a message to the AI.

```typescript
context.framework.on("ai-chat:message-sent", (event: AIMessageSentEvent) => {
  console.log("User message:", event.message);
});
```

**Event Payload:**
```typescript
interface AIMessageSentEvent {
  message: string;           // User message
  sessionId: string;         // Chat session ID
  timestamp: Date;           // Send timestamp
  context?: {                // Optional context
    selectedElements?: string[]; // Selected element IDs
    canvasSnapshot?: string;    // Canvas snapshot for vision
  };
}
```

---

#### `ai-chat:response-received`

Emitted when the AI responds to a message.

```typescript
context.framework.on("ai-chat:response-received", (event: AIResponseReceivedEvent) => {
  console.log("AI response:", event.response);
});
```

**Event Payload:**
```typescript
interface AIResponseReceivedEvent {
  response: string;          // AI response text
  sessionId: string;         // Chat session ID
  prompt: string;            // Original user prompt
  aiProvider: string;        // AI provider used
  tokens?: number;           // Tokens consumed
  timestamp: Date;           // Response timestamp
}
```

---

## Event System API

### Subscribing to Events

Use the `on` method to subscribe to events:

```typescript
const handler = (event: EventPayload) => {
  console.log("Event received:", event);
};

context.framework.on("event-name", handler);
```

### Unsubscribing from Events

Use the `off` method to unsubscribe:

```typescript
context.framework.off("event-name", handler);
```

**Important**: Always unsubscribe in cleanup functions to prevent memory leaks:

```typescript
useEffect(() => {
  const handler = (event) => { /* ... */ };
  context.framework.on("event-name", handler);

  return () => {
    context.framework.off("event-name", handler);
  };
}, [context.framework]);
```

### Emitting Events

Plugins can emit custom events or standard framework events:

```typescript
// Emit a standard event
context.framework.emit("plugin:mounted", {
  pluginId: "my-plugin",
  pluginName: "My Plugin",
  pluginVersion: "1.0.0",
  timestamp: new Date()
});

// Emit a custom event
context.framework.emit("my-plugin:custom-event", {
  customData: "example"
});
```

---

## Event Flow Patterns

### Pattern 1: Audio → AI → Canvas

Voice command workflow:

```
User speaks
   ↓
audio-input:transcription
   ↓
ai-chat:message-sent
   ↓
ai-chat:response-received
   ↓
ai-chat:element-created
   ↓
elements:changed
```

### Pattern 2: Screen Capture → AI Analysis

Screen sharing with AI:

```
User captures screen
   ↓
screen-capture:screenshot
   ↓
ai-chat:message-sent (with image context)
   ↓
ai-chat:response-received
   ↓
ai-chat:element-created
```

### Pattern 3: Collaborative Editing

Real-time collaboration:

```
User A joins
   ↓
collaboration:joined
   ↓
User A edits
   ↓
elements:changed (broadcast to all)
   ↓
User B receives update
   ↓
elements:changed (local)
```

---

## Best Practices

### 1. Type Safety

Always type your event handlers:

```typescript
context.framework.on("canvas:loaded", (event: CanvasLoadedEvent) => {
  // TypeScript knows event structure
  console.log(event.canvasId);
});
```

### 2. Error Handling

Wrap event handlers in try-catch:

```typescript
context.framework.on("elements:changed", (event) => {
  try {
    processElements(event.elements);
  } catch (error) {
    console.error("Error processing elements:", error);
  }
});
```

### 3. Cleanup

Always clean up event listeners:

```typescript
onUnmount: () => {
  // Unsubscribe from all events
  context.framework.off("event-name", handler);
}
```

### 4. Avoid Infinite Loops

Be careful when emitting events in response to other events:

```typescript
// ❌ BAD: Can cause infinite loop
context.framework.on("elements:changed", () => {
  context.framework.emit("elements:changed", { /* ... */ });
});

// ✅ GOOD: Use conditions to prevent loops
context.framework.on("elements:changed", (event) => {
  if (!event.triggeredByPlugin) {
    // Process and emit once
  }
});
```

### 5. Debouncing

Debounce high-frequency events:

```typescript
import { debounce } from 'lodash';

const debouncedHandler = debounce((event) => {
  // Handle event
}, 300);

context.framework.on("appstate:changed", debouncedHandler);
```

---

## Testing Events

### Unit Testing

Mock the framework event system:

```typescript
const mockFramework = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

const context = {
  framework: mockFramework,
  // ... other context
};

// Test event subscription
myPlugin.onMount(context);
expect(mockFramework.on).toHaveBeenCalledWith("event-name", expect.any(Function));

// Test event emission
const handler = mockFramework.on.mock.calls[0][1];
handler(mockEvent);
expect(/* ... assertions ... */);
```

### Integration Testing

Test event flow between plugins:

```typescript
it('should send transcription to AI', async () => {
  const audioPlugin = new AudioInputPlugin();
  const aiPlugin = new AIChatPlugin();

  // Mount plugins
  pluginManager.register(audioPlugin);
  pluginManager.register(aiPlugin);
  pluginManager.mount(audioPlugin.id);
  pluginManager.mount(aiPlugin.id);

  // Emit transcription event
  pluginManager.context.framework.emit("audio-input:transcription", "test text");

  // Assert AI received message
  expect(aiChatSpy).toHaveBeenCalledWith("test text");
});
```

---

## Event Catalog

Quick reference of all available events:

| Event Name | Category | Description |
|------------|----------|-------------|
| `plugin:mounted` | Plugin Lifecycle | Plugin mounted |
| `plugin:unmounted` | Plugin Lifecycle | Plugin unmounted |
| `canvas:loaded` | Canvas | Canvas loaded from storage |
| `canvas:saved` | Canvas | Canvas saved to storage |
| `canvas:shared` | Canvas | Canvas shared |
| `elements:changed` | Canvas | Elements added/modified/deleted |
| `appstate:changed` | Canvas | App state changed |
| `user:changed` | User | User logged in/out/updated |
| `collaboration:joined` | Collaboration | User joined session |
| `collaboration:left` | Collaboration | User left session |
| `audio-input:transcription` | Audio Input | Speech transcribed |
| `transcription:complete` | Audio Input | Transcription complete (detailed) |
| `screen-capture:screenshot` | Screen Capture | Screenshot captured |
| `screen-capture:recording-started` | Screen Capture | Recording started |
| `screen-capture:recording-stopped` | Screen Capture | Recording stopped |
| `ai-chat:element-created` | AI Chat | AI created elements |
| `ai-chat:message-sent` | AI Chat | User sent message |
| `ai-chat:response-received` | AI Chat | AI responded |

---

## Custom Events

Plugins can define and emit custom events:

```typescript
// Define custom event in your plugin
export const MyCustomPlugin: ExcalidrawPlugin = {
  id: "my-custom-plugin",
  // ...

  onMount: (context) => {
    // Emit custom event
    context.framework.emit("my-plugin:initialized", {
      timestamp: new Date(),
      config: plugin.config
    });
  }
};

// Other plugins can listen
context.framework.on("my-plugin:initialized", (event) => {
  console.log("Custom plugin initialized:", event);
});
```

---

## Migration Guide

### From v0.x to v1.0

Event signature changes:

```typescript
// v0.x
context.framework.on("canvas-loaded", (canvasId) => { });

// v1.0
context.framework.on("canvas:loaded", (event: CanvasLoadedEvent) => {
  const canvasId = event.canvasId;
});
```

---

## Support

- 📚 [Full Documentation](https://docs.derivative-canvas.dev)
- 💬 [Discord Community](https://discord.gg/derivative-canvas)
- 🐛 [Report Issues](https://github.com/your-org/derivative-canvas/issues)
