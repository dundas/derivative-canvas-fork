# Derivative Canvas: Gap Analysis & MVP Best Practices

## Executive Summary

This document analyzes the **derivative-canvas** framework against the proven patterns from **Bolt.DIY** and **Chef**, identifies critical gaps for enabling two-way human-AI-canvas collaboration, and provides actionable best practices for MVP implementation.

**Goal:** Enable seamless two-way collaboration where:
1. **Human → Canvas**: Users create/modify elements
2. **AI → Canvas**: AI agents add/modify elements based on conversation
3. **Canvas → AI**: Canvas state informs AI context for intelligent responses
4. **AI → Human**: AI communicates actions and seeks confirmation via chat

---

## 1. Current State Analysis

### 1.1 What Derivative Canvas Has ✅

```
┌─────────────────────────────────────────────────────────────────────┐
│                DERIVATIVE CANVAS CURRENT ARCHITECTURE                │
└─────────────────────────────────────────────────────────────────────┘

✅ Plugin System
   • PluginManager with lifecycle hooks
   • Plugin registration/unregistration
   • UI integration points (toolbar, sidebar, dialogs)
   • Event callbacks (onElementsChange, onAppStateChange)

✅ Event System
   • EventEmitter for pub/sub pattern
   • Framework events (plugin:mounted, canvas:loaded, etc.)

✅ State Management (Basic)
   • React Context for framework state
   • User authentication state
   • Plugin registry

✅ Storage Abstraction
   • Multiple storage adapters (MongoDB, PostgreSQL, etc.)
   • Canvas save/load operations

✅ Authentication
   • Multiple auth providers (NextAuth, Clerk, Auth0)
   • User context in plugins

✅ Excalidraw Integration
   • Dynamic import (SSR-safe)
   • Layout options (canvas, hybrid, minimal)
   • Basic canvas operations API
```

### 1.2 What's Missing ❌

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRITICAL GAPS FOR AI COLLABORATION                │
└─────────────────────────────────────────────────────────────────────┘

❌ Streaming Infrastructure
   • No SSE/WebSocket streaming
   • No message parser for LLM responses
   • No real-time AI response handling
   • No streaming state management

❌ Two-Way Data Flow
   • Canvas → AI context: No automatic context building
   • AI → Canvas: No structured action execution
   • No canvas state serialization for LLM context
   • No element diff tracking

❌ Action Runner Pattern
   • No serialized action execution queue
   • No action status tracking (pending/running/complete/failed)
   • No rollback/undo mechanism
   • No optimistic UI updates

❌ Message Protocol
   • No XML/structured format for AI responses
   • No artifact/action tagging system
   • No canvas operation DSL

❌ State Management (Advanced)
   • No reactive store for AI messages
   • No action history store
   • No canvas modification tracking
   • No conflict resolution

❌ Context Management
   • No smart context window management
   • No relevant element extraction
   • No token optimization
   • No conversation history compression

❌ Real-Time Collaboration
   • Plugin has basic hooks but no implementation
   • No operational transform (OT) / CRDT
   • No cursor/presence tracking
   • No conflict resolution

❌ AI Chat Integration
   • Basic UI only (AIChatPlugin is a stub)
   • No actual LLM integration
   • No streaming responses
   • No canvas-aware prompting
```

---

## 2. Gap Analysis: Derivative Canvas vs Bolt.DIY/Chef

### 2.1 Architecture Comparison Matrix

| Feature | Derivative Canvas | Bolt.DIY | Chef | Gap Severity |
|---------|-------------------|----------|------|--------------|
| **Streaming Infrastructure** | ❌ None | ✅ SSE via AI SDK | ✅ SSE via AI SDK | 🔴 Critical |
| **Message Parser** | ❌ None | ✅ StreamingMessageParser | ✅ StreamingMessageParser | 🔴 Critical |
| **Action Runner** | ❌ None | ✅ Serialized queue | ✅ Serialized queue | 🔴 Critical |
| **State Management** | 🟡 React Context only | ✅ Nanostores | ✅ Nanostores + Convex | 🟠 High |
| **Canvas Context** | ❌ Manual only | ✅ Modified files tracking | ✅ ChatContextManager | 🟠 High |
| **Plugin System** | ✅ Excellent | 🟡 N/A (monolithic) | 🟡 N/A (monolithic) | ✅ Advantage |
| **Event System** | ✅ Basic EventEmitter | ✅ Nanostores reactivity | ✅ Nanostores reactivity | 🟢 Low |
| **Real-Time Collab** | 🟡 Hooks only | ✅ WebContainer sync | ✅ WebContainer + Convex | 🟠 High |
| **Undo/Redo** | ❌ None | 🟡 Limited | 🟡 Limited | 🟢 Low |
| **Error Handling** | 🟡 Basic | ✅ Alert system | ✅ Alert system | 🟢 Low |
| **Persistence** | ✅ Storage adapters | 🟡 Browser only | ✅ Convex | ✅ Advantage |

**Legend:**
- 🔴 Critical: Blocks AI collaboration entirely
- 🟠 High: Significantly impacts UX
- 🟢 Low: Nice to have, not MVP-blocking

---

## 3. Best Practices from Bolt.DIY & Chef

### 3.1 Streaming Architecture Pattern

**What they do:**
```javascript
// Server: /api/chat endpoint
const response = streamText({
  model: getModel(provider, model),
  messages: preparedMessages,
  system: systemPrompt, // Contains canvas operation instructions
});

return createDataStream({
  stream: response.toDataStream(),
});

// Client: Chat component
const { messages, append, isLoading } = useChat({
  api: '/api/chat',
  body: { model, provider, canvasState },
  onFinish: (message) => {
    // Parse and execute canvas operations
  }
});
```

**Why it works:**
- ✅ Real-time feedback (tokens stream as they arrive)
- ✅ Better perceived performance
- ✅ Allows for incremental parsing
- ✅ Standard protocol (Server-Sent Events)

**Best practice for Derivative Canvas:**
```typescript
// Add to ExcalidrawFrameworkConfig
interface ExcalidrawFrameworkConfig {
  // ... existing config
  ai?: {
    enabled: boolean;
    provider: 'openai' | 'anthropic' | 'custom';
    apiKey?: string;
    model?: string;
    streaming: boolean; // MVP: Always true
  };
}
```

---

### 3.2 Message Parsing Pattern

**What they do:**
```javascript
// StreamingMessageParser.ts - Character-by-character parsing
class StreamingMessageParser {
  parse(chunk: string) {
    for (const char of chunk) {
      // State machine for XML tag detection
      if (char === '<') {
        this.startTag();
      } else if (char === '>') {
        this.closeTag();
        this.emitCallback(); // Trigger action
      } else {
        this.accumulate(char);
      }
    }
  }
}

// Usage
parser.on('artifactOpen', ({ id, title }) => {
  workbenchStore.addArtifact(id, { title });
});

parser.on('actionClose', ({ id, type, content }) => {
  actionRunner.execute({ id, type, content });
});
```

**Protocol:**
```xml
<boltArtifact id="canvas-123" title="Product Board">
  <boltAction type="canvas-element" operation="add">
    {
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 150,
      "label": "Product Card"
    }
  </boltAction>
  <boltAction type="canvas-element" operation="update" elementId="elem-456">
    {
      "backgroundColor": "#e3f2fd"
    }
  </boltAction>
</boltArtifact>
```

**Best practice for Derivative Canvas:**
```typescript
// New file: core/StreamingMessageParser.ts
export class CanvasMessageParser {
  private callbacks = {
    onArtifactOpen: (data: ArtifactOpenData) => {},
    onActionOpen: (data: ActionOpenData) => {},
    onActionStream: (data: ActionStreamData) => {},
    onActionClose: (data: ActionCloseData) => {},
    onArtifactClose: (data: ArtifactCloseData) => {},
  };

  parse(chunk: string): void {
    // Parse <canvasArtifact> and <canvasAction> tags
    // Emit callbacks for canvas operations
  }
}

// Types for canvas operations
type CanvasAction =
  | { type: 'add-element', element: ExcalidrawElement }
  | { type: 'update-element', elementId: string, updates: Partial<ExcalidrawElement> }
  | { type: 'delete-element', elementId: string }
  | { type: 'group-elements', elementIds: string[] }
  | { type: 'ungroup-elements', groupId: string };
```

---

### 3.3 Action Runner Pattern

**What they do:**
```javascript
// ActionRunner.ts - Serialized execution
class ActionRunner {
  private queue: Action[] = [];
  private isProcessing = false;

  async addAction(action: Action) {
    this.queue.push(action);

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const action = this.queue.shift()!;

      try {
        await this.executeAction(action);
        this.updateStatus(action.id, 'complete');
      } catch (error) {
        this.updateStatus(action.id, 'failed');
        this.emitError(action, error);
      }
    }

    this.isProcessing = false;
  }

  private async executeAction(action: Action) {
    switch (action.type) {
      case 'file':
        await this.writeFile(action.filePath, action.content);
        break;
      case 'shell':
        await this.runCommand(action.command);
        break;
    }
  }
}
```

**Why this matters:**
- ✅ Prevents race conditions (sequential execution)
- ✅ Enables status tracking (UI updates)
- ✅ Allows for cancellation/rollback
- ✅ Provides error isolation

**Best practice for Derivative Canvas:**
```typescript
// New file: core/CanvasActionRunner.ts
export class CanvasActionRunner {
  private queue: CanvasAction[] = [];
  private isProcessing = false;
  private excalidrawAPI: ExcalidrawImperativeAPI;

  constructor(excalidrawAPI: ExcalidrawImperativeAPI) {
    this.excalidrawAPI = excalidrawAPI;
  }

  async executeAction(action: CanvasAction): Promise<void> {
    switch (action.type) {
      case 'add-element':
        this.excalidrawAPI.updateScene({
          elements: [...this.getCurrentElements(), action.element]
        });
        break;

      case 'update-element':
        const elements = this.getCurrentElements();
        const index = elements.findIndex(el => el.id === action.elementId);
        if (index !== -1) {
          elements[index] = { ...elements[index], ...action.updates };
          this.excalidrawAPI.updateScene({ elements });
        }
        break;

      case 'delete-element':
        this.excalidrawAPI.updateScene({
          elements: this.getCurrentElements().filter(el => el.id !== action.elementId)
        });
        break;

      case 'group-elements':
        // Group elements by adding group relationship
        break;
    }

    // Emit event for plugins to react
    this.eventEmitter.emit('canvas:action-executed', action);
  }
}
```

---

### 3.4 Context Management Pattern

**What Chef does (smart context):**
```javascript
// ChatContextManager.ts
class ChatContextManager {
  collapseMessages(messages: Message[]): Message[] {
    // Collapse sequential assistant messages
    // Remove redundant system messages
    // Keep only relevant user edits
  }

  getRelevantElements(messages: Message[], canvas: CanvasData): ExcalidrawElement[] {
    // Extract mentioned element IDs from conversation
    // Include recently modified elements
    // Include selected elements
    // Limit by token budget
  }

  buildContext(data: ContextData): string {
    return `
# Current Canvas State
Elements: ${data.elements.length}
Selected: ${data.selectedIds.join(', ')}
Recent Changes: ${data.recentChanges}

# Canvas Elements (Relevant)
${this.serializeElements(data.relevantElements)}

# Conversation History
${data.messages}
    `;
  }
}
```

**Best practice for Derivative Canvas:**
```typescript
// New file: core/CanvasContextManager.ts
export class CanvasContextManager {
  constructor(
    private maxTokens: number = 8000,
    private relevanceThreshold: number = 0.7
  ) {}

  buildCanvasContext(canvas: CanvasData): string {
    const elements = canvas.elements;
    const selectedElements = elements.filter(el => canvas.appState.selectedElementIds?.[el.id]);

    return `
<canvasContext>
  <summary>
    Total Elements: ${elements.length}
    Selected: ${selectedElements.length}
    Canvas Size: ${canvas.appState.width}x${canvas.appState.height}
  </summary>

  <selectedElements>
    ${this.serializeElements(selectedElements)}
  </selectedElements>

  <recentElements>
    ${this.serializeRecentElements(elements, 5)}
  </recentElements>

  <elementTypes>
    ${this.getElementTypeSummary(elements)}
  </elementTypes>
</canvasContext>
    `;
  }

  private serializeElements(elements: ExcalidrawElement[]): string {
    return elements.map(el => `
    <element id="${el.id}" type="${el.type}">
      ${el.type === 'text' ? `<label>${(el as any).text}</label>` : ''}
      <position x="${el.x}" y="${el.y}" />
      <size width="${el.width}" height="${el.height}" />
    </element>
    `).join('');
  }

  private getElementTypeSummary(elements: ExcalidrawElement[]): string {
    const counts = elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
  }

  private serializeRecentElements(elements: ExcalidrawElement[], limit: number): string {
    // Sort by updated timestamp (if tracked)
    // Return last N elements
    return this.serializeElements(elements.slice(-limit));
  }
}
```

---

### 3.5 State Management Pattern

**What Bolt.DIY/Chef do:**
```javascript
// Use Nanostores for reactive state
import { atom, map } from 'nanostores';

// Chat state
export const chatStore = map<{
  messages: Message[];
  isStreaming: boolean;
  currentArtifactId: string | null;
}>({
  messages: [],
  isStreaming: false,
  currentArtifactId: null,
});

// Canvas action state
export const canvasActionsStore = map<{
  actions: Map<string, CanvasAction>;
  queue: string[];
  processing: boolean;
}>({
  actions: new Map(),
  queue: [],
  processing: false,
});

// Usage in components
import { useStore } from '@nanostores/react';

function MyComponent() {
  const { messages, isStreaming } = useStore(chatStore);

  return <div>Messages: {messages.length}</div>;
}
```

**Why Nanostores:**
- ✅ Minimal re-renders (fine-grained reactivity)
- ✅ Framework-agnostic
- ✅ TypeScript-first
- ✅ Zero dependencies
- ✅ Perfect for micro-state management

**Best practice for Derivative Canvas:**
```typescript
// New file: core/stores/canvasChat.ts
import { atom, map, computed } from 'nanostores';

// AI Chat Messages
export const chatMessagesStore = atom<ChatMessage[]>([]);

// Canvas Actions (from AI)
export const canvasActionsStore = map<Map<string, CanvasActionState>>(new Map());

// Current canvas state for context
export const canvasContextStore = map<{
  elements: ExcalidrawElement[];
  selectedIds: string[];
  modifiedSince: Date | null;
}>({
  elements: [],
  selectedIds: [],
  modifiedSince: null,
});

// Computed: Get pending actions
export const pendingActionsStore = computed(canvasActionsStore, (actions) => {
  return Array.from(actions.values()).filter(a => a.status === 'pending');
});

// Computed: Get modified elements (for AI context)
export const modifiedElementsStore = computed(
  [canvasContextStore, chatMessagesStore],
  (context, messages) => {
    if (!context.modifiedSince) return [];

    // Filter elements modified since last AI interaction
    return context.elements.filter(el => {
      // Logic to determine if element was modified by user
      return true; // Simplified
    });
  }
);
```

---

## 4. Critical Gaps for MVP

### 4.1 Priority 1: Streaming Infrastructure (CRITICAL)

**Gap:** No streaming LLM responses

**Impact:**
- ❌ No real-time AI interaction
- ❌ Poor UX (long waits)
- ❌ Can't parse actions incrementally

**MVP Solution:**
```typescript
// 1. Add AI SDK dependency
// npm install ai @ai-sdk/openai

// 2. Create /api/canvas-chat endpoint
// app/api/canvas-chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages, canvasState } = await req.json();

  const response = streamText({
    model: openai('gpt-4'),
    messages: [
      {
        role: 'system',
        content: CANVAS_SYSTEM_PROMPT
      },
      ...messages
    ],
  });

  return response.toDataStreamResponse();
}

// 3. Update AIChatPlugin to use streaming
const { messages, append, isLoading } = useChat({
  api: '/api/canvas-chat',
  body: {
    canvasState: context.canvas
  },
  onFinish: (message) => {
    // Parse canvas operations from message
    parseCanvasOperations(message.content);
  }
});
```

**Effort:** 2-3 days
**Priority:** 🔴 Critical (blocks all AI features)

---

### 4.2 Priority 2: Canvas Action Runner (CRITICAL)

**Gap:** No structured way to execute AI-generated canvas operations

**Impact:**
- ❌ Can't translate LLM responses to canvas changes
- ❌ No status tracking
- ❌ No error handling

**MVP Solution:**
```typescript
// New file: core/CanvasActionRunner.ts
export class CanvasActionRunner {
  private queue: CanvasAction[] = [];
  private actionStore = map<Map<string, ActionStatus>>(new Map());

  async addAction(action: CanvasAction) {
    const id = nanoid();
    this.actionStore.setKey(id, { status: 'pending', action });
    this.queue.push({ id, ...action });

    await this.processQueue();
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const action = this.queue.shift()!;

      this.actionStore.setKey(action.id, { status: 'running' });

      try {
        await this.executeAction(action);
        this.actionStore.setKey(action.id, { status: 'complete' });
      } catch (error) {
        this.actionStore.setKey(action.id, {
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  private async executeAction(action: CanvasAction) {
    const api = this.excalidrawAPI;

    switch (action.type) {
      case 'add-element':
        const elements = api.getSceneElements();
        api.updateScene({
          elements: [...elements, action.element]
        });
        break;

      case 'update-element':
        const currentElements = api.getSceneElements();
        const updated = currentElements.map(el =>
          el.id === action.elementId
            ? { ...el, ...action.updates }
            : el
        );
        api.updateScene({ elements: updated });
        break;

      case 'delete-element':
        api.updateScene({
          elements: api.getSceneElements().filter(
            el => el.id !== action.elementId
          )
        });
        break;
    }
  }
}

// Integration in ExcalidrawProvider
const [actionRunner] = useState(() => new CanvasActionRunner(excalidrawAPI));

// Expose via framework API
const api: ExcalidrawFrameworkAPI = {
  // ... existing methods

  executeCanvasAction: (action: CanvasAction) => {
    return actionRunner.addAction(action);
  },

  getActionStatus: (actionId: string) => {
    return actionRunner.getStatus(actionId);
  }
};
```

**Effort:** 3-4 days
**Priority:** 🔴 Critical (blocks AI → Canvas flow)

---

### 4.3 Priority 3: Canvas Context Builder (HIGH)

**Gap:** No automatic context building from canvas state

**Impact:**
- ❌ AI doesn't know what's on the canvas
- ❌ Irrelevant responses
- ❌ Manual context management required

**MVP Solution:**
```typescript
// New file: core/CanvasContextBuilder.ts
export class CanvasContextBuilder {
  buildContext(canvas: CanvasData, options?: ContextOptions): string {
    const { elements, appState } = canvas;

    // Get selected elements (highest priority)
    const selected = elements.filter(el =>
      appState.selectedElementIds?.[el.id]
    );

    // Get recently modified elements
    const recent = this.getRecentElements(elements, 5);

    // Build structured context
    return `
<canvas>
  <metadata>
    <totalElements>${elements.length}</totalElements>
    <selectedElements>${selected.length}</selectedElements>
    <canvasDimensions width="${appState.width}" height="${appState.height}" />
  </metadata>

  ${selected.length > 0 ? `
  <selectedElements>
    ${this.serializeElements(selected)}
  </selectedElements>
  ` : ''}

  <recentElements>
    ${this.serializeElements(recent)}
  </recentElements>

  <elementSummary>
    ${this.getElementTypeSummary(elements)}
  </elementSummary>
</canvas>
    `.trim();
  }

  private serializeElements(elements: ExcalidrawElement[]): string {
    return elements.map(el => {
      const base = `
    <element id="${el.id}" type="${el.type}">
      <bounds x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" />
      `;

      // Add text content if present
      if (el.type === 'text') {
        return base + `<text>${(el as any).text}</text></element>`;
      }

      // Add label if present
      if ((el as any).label) {
        return base + `<label>${(el as any).label}</label></element>`;
      }

      return base + `</element>`;
    }).join('\n    ');
  }

  private getElementTypeSummary(elements: ExcalidrawElement[]): string {
    const counts: Record<string, number> = {};
    elements.forEach(el => {
      counts[el.type] = (counts[el.type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([type, count]) => `<type name="${type}" count="${count}" />`)
      .join('\n    ');
  }

  private getRecentElements(elements: ExcalidrawElement[], limit: number): ExcalidrawElement[] {
    // In MVP, just return last N elements
    // In production, sort by actual modification time
    return elements.slice(-limit);
  }
}

// Usage in sendMessage
const sendMessage = async (message: string) => {
  const contextBuilder = new CanvasContextBuilder();
  const canvasContext = contextBuilder.buildContext(context.canvas);

  const fullMessage = `
${canvasContext}

User Request: ${message}
  `;

  await append({
    role: 'user',
    content: fullMessage
  });
};
```

**Effort:** 2-3 days
**Priority:** 🟠 High (needed for intelligent AI responses)

---

### 4.4 Priority 4: Message Parser (HIGH)

**Gap:** No parsing of structured AI responses

**Impact:**
- ❌ Can't extract canvas operations from LLM responses
- ❌ Manual parsing required
- ❌ Brittle integration

**MVP Solution:**
```typescript
// New file: core/StreamingMessageParser.ts
export class StreamingMessageParser {
  private buffer = '';
  private state: 'text' | 'tag' | 'content' = 'text';
  private currentTag: string | null = null;
  private callbacks: ParserCallbacks;

  constructor(callbacks: ParserCallbacks) {
    this.callbacks = callbacks;
  }

  parse(chunk: string): void {
    for (const char of chunk) {
      this.buffer += char;

      if (char === '<') {
        this.state = 'tag';
      } else if (char === '>' && this.state === 'tag') {
        this.handleTag();
        this.state = 'content';
        this.buffer = '';
      }
    }
  }

  private handleTag(): void {
    const tag = this.buffer.slice(1, -1);

    // Opening tag
    if (!tag.startsWith('/')) {
      if (tag.startsWith('canvasAction')) {
        this.currentTag = 'canvasAction';
        const attrs = this.parseAttributes(tag);
        this.callbacks.onActionOpen?.(attrs);
      }
    }
    // Closing tag
    else {
      if (tag === '/canvasAction') {
        this.callbacks.onActionClose?.({
          content: this.buffer
        });
        this.currentTag = null;
      }
    }
  }

  private parseAttributes(tag: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const matches = tag.matchAll(/(\w+)="([^"]*)"/g);

    for (const match of matches) {
      attrs[match[1]] = match[2];
    }

    return attrs;
  }
}

// Usage in AIChatPlugin
const parser = new StreamingMessageParser({
  onActionOpen: (attrs) => {
    console.log('Canvas action started:', attrs);
  },
  onActionClose: ({ content }) => {
    try {
      const action = JSON.parse(content);
      context.framework.executeCanvasAction(action);
    } catch (error) {
      console.error('Failed to parse canvas action:', error);
    }
  }
});

// In streaming response handler
const { messages, append } = useChat({
  api: '/api/canvas-chat',
  onChunk: ({ chunk }) => {
    parser.parse(chunk);
  }
});
```

**Effort:** 2-3 days
**Priority:** 🟠 High (needed for structured AI → Canvas communication)

---

### 4.5 Priority 5: Reactive State Management (MEDIUM)

**Gap:** React Context is not fine-grained enough

**Impact:**
- 🟡 Unnecessary re-renders
- 🟡 Performance issues with large canvases
- 🟡 State updates not optimized

**MVP Solution:**
```typescript
// Install nanostores
// npm install nanostores @nanostores/react

// New file: core/stores/index.ts
import { atom, map, computed } from 'nanostores';

// Chat messages
export const chatMessagesStore = atom<ChatMessage[]>([]);

// Canvas actions from AI
export const canvasActionsStore = map<Record<string, CanvasActionState>>({});

// Canvas state snapshot (for AI context)
export const canvasSnapshotStore = map<{
  elements: ExcalidrawElement[];
  selectedIds: string[];
  timestamp: number;
}>({
  elements: [],
  selectedIds: [],
  timestamp: Date.now()
});

// Computed: Modified elements since last snapshot
export const modifiedElementsStore = computed(
  canvasSnapshotStore,
  (snapshot) => {
    // Track which elements changed since last AI interaction
    return snapshot.elements.filter(el => {
      // Simplified: In production, compare with previous snapshot
      return true;
    });
  }
);

// Actions
export function addChatMessage(message: ChatMessage) {
  chatMessagesStore.set([...chatMessagesStore.get(), message]);
}

export function addCanvasAction(id: string, action: CanvasActionState) {
  canvasActionsStore.setKey(id, action);
}

export function updateCanvasSnapshot(elements: ExcalidrawElement[], selectedIds: string[]) {
  canvasSnapshotStore.set({
    elements,
    selectedIds,
    timestamp: Date.now()
  });
}

// Usage in components
import { useStore } from '@nanostores/react';
import { chatMessagesStore, canvasActionsStore } from '@/core/stores';

function AIChatSidebar() {
  const messages = useStore(chatMessagesStore);
  const actions = useStore(canvasActionsStore);

  return (
    <div>
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
      {Object.values(actions).map(action => (
        <ActionStatus key={action.id} action={action} />
      ))}
    </div>
  );
}
```

**Effort:** 2 days
**Priority:** 🟡 Medium (improves performance, not blocking)

---

## 5. MVP Architecture Design

### 5.1 Enhanced Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│           DERIVATIVE CANVAS ENHANCED ARCHITECTURE (MVP)              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ExcalidrawLayout                                                │
│    ├── Excalidraw Canvas                                         │
│    │   └── onChange → updateCanvasSnapshot()                     │
│    │                                                              │
│    └── AIChatPlugin (Sidebar)                                    │
│        ├── MessageList (useStore(chatMessagesStore))             │
│        ├── ActionList (useStore(canvasActionsStore))             │
│        └── MessageInput                                          │
│            └── onSend → append(message + canvasContext)          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT LAYER                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Nanostores (Reactive State)                                     │
│    ├── chatMessagesStore                                         │
│    ├── canvasActionsStore                                        │
│    ├── canvasSnapshotStore                                       │
│    └── modifiedElementsStore (computed)                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                         CORE LOGIC LAYER                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ExcalidrawFrameworkAPI                                          │
│    ├── CanvasContextBuilder                                      │
│    │   └── buildContext(canvas) → XML context                   │
│    │                                                              │
│    ├── StreamingMessageParser                                    │
│    │   └── parse(chunk) → emit callbacks                        │
│    │                                                              │
│    └── CanvasActionRunner                                        │
│        ├── addAction(action) → queue                             │
│        ├── processQueue() → execute serially                     │
│        └── executeAction() → update Excalidraw                   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API/NETWORK LAYER                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /api/canvas-chat (Remix/Next.js)                                │
│    └── POST                                                      │
│        ├── Receive: { messages, canvasContext }                  │
│        ├── Call: streamText() with AI SDK                        │
│        └── Return: SSE stream                                    │
│                                                                   │
│  useChat() Hook (Client)                                         │
│    ├── append(message) → POST to API                             │
│    ├── onChunk → StreamingMessageParser.parse()                  │
│    └── onFinish → complete message                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│               TWO-WAY COLLABORATION FLOW (MVP)                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  FLOW 1: HUMAN → AI → CANVAS (User requests AI to modify canvas) │
└──────────────────────────────────────────────────────────────────┘

User types: "Add a product card at position 100,100"
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. AIChatPlugin captures input                                 │
│    • Get current canvas state                                  │
│    • Build canvas context with CanvasContextBuilder            │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. Send to API with context                                    │
│    append({                                                    │
│      role: 'user',                                             │
│      content: `                                                │
│        <canvas>...</canvas>                                    │
│        User Request: Add a product card at 100,100             │
│      `                                                         │
│    })                                                          │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. API streams LLM response                                    │
│    streamText() returns:                                       │
│    "I'll add a product card for you.                           │
│    <canvasAction type="add-element">                           │
│    {                                                           │
│      "type": "rectangle",                                      │
│      "x": 100, "y": 100,                                       │
│      "width": 200, "height": 150,                              │
│      "label": "Product Card"                                   │
│    }                                                           │
│    </canvasAction>"                                            │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. Client receives stream chunks                               │
│    onChunk: (chunk) => {                                       │
│      parser.parse(chunk);  // Character-by-character           │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. StreamingMessageParser detects tags                         │
│    • Detects <canvasAction>                                    │
│    • Accumulates JSON content                                  │
│    • Detects </canvasAction>                                   │
│    • Emits onActionClose callback                              │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. Callback triggers CanvasActionRunner                        │
│    onActionClose: ({ content }) => {                           │
│      const action = JSON.parse(content);                       │
│      actionRunner.addAction(action);                           │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. CanvasActionRunner executes                                 │
│    • Add to queue                                              │
│    • Update canvasActionsStore (status: 'pending')             │
│    • Execute action serially                                   │
│    • Update Excalidraw via API                                 │
│    • Update canvasActionsStore (status: 'complete')            │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 8. UI updates reactively                                       │
│    • Chat shows AI message: "I'll add a product card..."       │
│    • ActionList shows: ✓ Added element (complete)              │
│    • Canvas shows: New rectangle at (100, 100)                 │
└────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│  FLOW 2: HUMAN → CANVAS → AI (User modifies canvas manually)     │
└──────────────────────────────────────────────────────────────────┘

User drags element or adds new shape
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. Excalidraw onChange callback                                │
│    onChange={(elements, appState) => {                         │
│      updateCanvasSnapshot(elements, appState.selectedIds);     │
│      pluginManager.notifyElementsChanged(elements);            │
│    }}                                                          │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. Update canvasSnapshotStore                                  │
│    • Store new elements array                                  │
│    • Store selectedIds                                         │
│    • Update timestamp                                          │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. modifiedElementsStore recomputes                            │
│    • Compare with previous snapshot                            │
│    • Identify changed elements                                 │
│    • Track for next AI interaction                             │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. User asks AI about changes                                  │
│    User: "What do you think of the layout?"                    │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. CanvasContextBuilder includes modifications                 │
│    buildContext() includes:                                    │
│    • All current elements                                      │
│    • Highlighted: modified elements                            │
│    • User's question                                           │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. AI responds with context awareness                          │
│    "I see you've moved the product card to the left. This      │
│    creates better visual balance with the title element."      │
└────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│  FLOW 3: AI → HUMAN (AI seeks confirmation)                      │
└──────────────────────────────────────────────────────────────────┘

AI detects ambiguity or needs confirmation
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. AI responds with text + proposed action                     │
│    "I can add the product cards. Would you like me to:         │
│    A) Arrange them in a grid (3x3)                             │
│    B) Arrange them in a list (vertical)                        │
│                                                                │
│    <canvasAction type="add-elements" confirmation="required">  │
│      { ... proposed elements ... }                             │
│    </canvasAction>"                                            │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. Parser detects confirmation="required"                      │
│    • Don't execute action automatically                        │
│    • Store as pending with confirmation UI                     │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. UI shows confirmation buttons                               │
│    [Approve] [Modify] [Reject]                                 │
└────────────────────────────────────────────────────────────────┘
        │
        ├──► User clicks [Approve]
        │    → Execute action
        │    → Update chat: "✓ Action approved and executed"
        │
        ├──► User clicks [Modify]
        │    → Open action editor
        │    → User adjusts parameters
        │    → Execute modified action
        │
        └──► User clicks [Reject]
             → Cancel action
             → Update chat: "Action cancelled"
```

---

## 6. MVP Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Set up streaming infrastructure and basic state management

**Tasks:**
1. ✅ Add AI SDK dependencies
   ```bash
   npm install ai @ai-sdk/openai nanostores @nanostores/react
   ```

2. ✅ Create Nanostores
   - `core/stores/canvasChat.ts`
   - `core/stores/canvasActions.ts`
   - `core/stores/canvasSnapshot.ts`

3. ✅ Create `/api/canvas-chat` endpoint
   - Set up streaming with AI SDK
   - Add system prompt for canvas operations
   - Test basic streaming

4. ✅ Update AIChatPlugin
   - Replace state with useChat() hook
   - Connect to `/api/canvas-chat`
   - Display streaming responses

**Deliverable:** Working chat interface that streams AI responses

---

### Phase 2: Canvas Context (Week 2)

**Goal:** Enable AI to understand canvas state

**Tasks:**
1. ✅ Create CanvasContextBuilder
   - Serialize elements to XML
   - Include selected elements
   - Include element type summary

2. ✅ Hook into Excalidraw onChange
   - Update canvasSnapshotStore on changes
   - Track modified elements

3. ✅ Modify sendMessage to include context
   - Build canvas context before sending
   - Append to user message

4. ✅ Test AI responses with canvas awareness
   - Verify AI mentions specific elements
   - Test selection awareness

**Deliverable:** AI that understands canvas state

---

### Phase 3: AI → Canvas Actions (Week 3)

**Goal:** Enable AI to modify canvas

**Tasks:**
1. ✅ Define CanvasAction types
   - TypeScript interfaces for all operations
   - JSON schema for validation

2. ✅ Create CanvasActionRunner
   - Queue implementation
   - Status tracking
   - Excalidraw API integration

3. ✅ Create StreamingMessageParser
   - Detect `<canvasAction>` tags
   - Parse JSON content
   - Emit callbacks

4. ✅ Connect parser to actionRunner
   - Wire up callbacks
   - Update canvasActionsStore
   - Test end-to-end

**Deliverable:** AI can add/modify/delete elements

---

### Phase 4: UI/UX Polish (Week 4)

**Goal:** Professional user experience

**Tasks:**
1. ✅ Action status display
   - Show pending/running/complete states
   - Animated indicators
   - Error messages

2. ✅ Confirmation flow
   - Detect `confirmation="required"`
   - Show approve/reject buttons
   - Handle user decisions

3. ✅ Canvas highlighting
   - Highlight AI-modified elements
   - Show action preview (before execution)
   - Animate additions/changes

4. ✅ Error handling
   - Graceful degradation
   - Retry logic
   - User-friendly messages

**Deliverable:** Polished, production-ready MVP

---

## 7. System Prompt for Canvas Operations

```typescript
export const CANVAS_SYSTEM_PROMPT = `
You are an AI assistant that helps users create and modify visual canvases using Excalidraw elements.

# Canvas Operations

You can modify the canvas using the following operations wrapped in XML tags:

<canvasAction type="add-element">
{
  "type": "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "text",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "backgroundColor": "#hex",
  "strokeColor": "#hex",
  "text": "string" (for text elements)
}
</canvasAction>

<canvasAction type="update-element">
{
  "elementId": "string",
  "updates": {
    "x": number,
    "y": number,
    "backgroundColor": "#hex",
    // any ExcalidrawElement property
  }
}
</canvasAction>

<canvasAction type="delete-element">
{
  "elementId": "string"
}
</canvasAction>

<canvasAction type="group-elements">
{
  "elementIds": ["id1", "id2", "id3"],
  "groupLabel": "Optional label"
}
</canvasAction>

# Guidelines

1. **Always explain** what you're doing before executing actions
2. **Be specific** about positions and sizes
3. **Use semantic colors** (e.g., blue for info, green for success, red for warnings)
4. **Ask for confirmation** for destructive operations (delete, major changes)
5. **Reference existing elements** by ID when modifying
6. **Maintain visual hierarchy** (proper spacing, alignment)

# Canvas Context

You will receive canvas context in this format:
<canvas>
  <metadata>...</metadata>
  <selectedElements>...</selectedElements>
  <recentElements>...</recentElements>
</canvas>

Use this context to:
- Understand what's already on the canvas
- Reference existing elements
- Avoid overlapping new elements
- Maintain design consistency

# Example Interaction

User: "Add a product card"
Assistant: "I'll add a product card for you at a clear position.

<canvasAction type="add-element">
{
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 150,
  "backgroundColor": "#e3f2fd",
  "strokeColor": "#2196f3",
  "text": "Product Card"
}
</canvasAction>

I've added a blue product card at position (100, 100). Would you like me to add more details to it?"

# Confirmation Required

For ambiguous requests or destructive operations, add confirmation="required":

<canvasAction type="delete-element" confirmation="required">
{
  "elementId": "elem-123"
}
</canvasAction>

The user will be prompted to approve before execution.
`;
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// Test CanvasContextBuilder
describe('CanvasContextBuilder', () => {
  it('should serialize elements correctly', () => {
    const builder = new CanvasContextBuilder();
    const canvas = {
      elements: [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 }
      ],
      appState: { selectedElementIds: {} }
    };

    const context = builder.buildContext(canvas);
    expect(context).toContain('<element id="1"');
    expect(context).toContain('type="rectangle"');
  });
});

// Test CanvasActionRunner
describe('CanvasActionRunner', () => {
  it('should execute actions serially', async () => {
    const runner = new CanvasActionRunner(mockExcalidrawAPI);

    runner.addAction({ type: 'add-element', element: mockElement1 });
    runner.addAction({ type: 'add-element', element: mockElement2 });

    await runner.waitForCompletion();

    expect(mockExcalidrawAPI.updateScene).toHaveBeenCalledTimes(2);
  });
});

// Test StreamingMessageParser
describe('StreamingMessageParser', () => {
  it('should detect canvas action tags', () => {
    const parser = new StreamingMessageParser({
      onActionClose: jest.fn()
    });

    parser.parse('<canvasAction>{"type":"add-element"}</canvasAction>');

    expect(callbacks.onActionClose).toHaveBeenCalledWith({
      content: '{"type":"add-element"}'
    });
  });
});
```

### 8.2 Integration Tests

```typescript
// Test end-to-end flow
describe('AI Canvas Collaboration', () => {
  it('should complete full flow: user message → AI response → canvas update', async () => {
    // 1. Render chat interface
    render(<AIChatPlugin context={mockContext} plugin={mockPlugin} />);

    // 2. User sends message
    const input = screen.getByPlaceholderText('Ask about your canvas...');
    fireEvent.change(input, { target: { value: 'Add a rectangle' } });
    fireEvent.click(screen.getByText('Send'));

    // 3. Mock streaming response
    mockStreamingResponse('<canvasAction type="add-element">...</canvasAction>');

    // 4. Wait for action execution
    await waitFor(() => {
      expect(mockExcalidrawAPI.updateScene).toHaveBeenCalled();
    });

    // 5. Verify UI updates
    expect(screen.getByText(/added element/i)).toBeInTheDocument();
  });
});
```

---

## 9. Success Metrics

### 9.1 MVP Success Criteria

- ✅ User can chat with AI about canvas
- ✅ AI understands canvas state (selected elements, recent changes)
- ✅ AI can add elements to canvas
- ✅ AI can modify existing elements
- ✅ AI can delete elements
- ✅ User sees real-time streaming responses
- ✅ User sees action status (pending/running/complete)
- ✅ Errors are handled gracefully
- ✅ Actions execute without race conditions

### 9.2 Performance Targets

- **Streaming latency**: < 200ms to first token
- **Action execution**: < 100ms per action
- **Canvas updates**: < 50ms to reflect changes
- **Context building**: < 50ms for typical canvas (< 100 elements)

### 9.3 UX Targets

- **Clarity**: User always knows what AI is doing
- **Reversibility**: User can undo AI actions (via Excalidraw undo)
- **Predictability**: AI actions match user expectations
- **Responsiveness**: No blocking operations

---

## 10. Post-MVP Enhancements

### 10.1 Phase 5: Advanced Features

- **Undo/Redo Integration**: Custom undo stack for AI actions
- **Action Batching**: Group related actions for atomic execution
- **Canvas Diff Viewer**: Show before/after previews
- **AI Suggestions**: Proactive layout/design suggestions
- **Voice Input**: Speak commands to AI
- **Template Library**: Pre-built canvas templates

### 10.2 Phase 6: Collaboration

- **Multi-Agent**: Multiple AI agents working together
- **Human-AI Co-creation**: Real-time collaboration
- **Cursor Tracking**: See where AI is "working"
- **Presence Indicators**: Show active agents
- **Conflict Resolution**: Handle simultaneous edits

### 10.3 Phase 7: Intelligence

- **Learning**: AI learns from user preferences
- **Context Persistence**: Remember past canvases
- **Smart Positioning**: Optimal element placement
- **Layout Analysis**: Detect and fix layout issues
- **Accessibility**: Ensure canvas is accessible

---

## 11. Summary of Best Practices

### 11.1 Architecture

✅ **Use streaming** for real-time AI responses (AI SDK)
✅ **Use reactive state** for fine-grained updates (Nanostores)
✅ **Serialize actions** to prevent race conditions (ActionRunner)
✅ **Parse incrementally** for responsive UX (StreamingMessageParser)
✅ **Build smart context** to reduce tokens (CanvasContextBuilder)

### 11.2 Data Flow

✅ **Human → AI**: Include full canvas context
✅ **AI → Canvas**: Structured XML protocol
✅ **Canvas → AI**: Automatic snapshot updates
✅ **AI → Human**: Clear action descriptions

### 11.3 UX

✅ **Show progress**: Action status indicators
✅ **Seek confirmation**: For destructive operations
✅ **Provide feedback**: Success/error messages
✅ **Enable undo**: Via native Excalidraw undo
✅ **Highlight changes**: Show AI-modified elements

### 11.4 Performance

✅ **Debounce canvas updates**: Batch onChange callbacks
✅ **Optimize context**: Only include relevant elements
✅ **Cache parsed actions**: Avoid re-parsing
✅ **Use computed stores**: Derive state efficiently

---

## 12. Next Steps

1. **Week 1**: Implement streaming infrastructure
2. **Week 2**: Build canvas context system
3. **Week 3**: Create action runner and parser
4. **Week 4**: Polish UI/UX
5. **Week 5**: Testing and bug fixes
6. **Week 6**: Documentation and launch

**Estimated MVP Timeline**: 6 weeks
**Team Size**: 1-2 developers
**Tech Stack**: Next.js, AI SDK, Nanostores, Excalidraw

---

## Appendix: Code Structure

```
derivative-canvas/
├── core/
│   ├── ExcalidrawProvider.tsx (✅ existing)
│   ├── PluginManager.ts (✅ existing)
│   ├── EventEmitter.ts (✅ existing)
│   ├── types.ts (✅ existing, needs expansion)
│   │
│   ├── CanvasActionRunner.ts (🆕 new)
│   ├── CanvasContextBuilder.ts (🆕 new)
│   ├── StreamingMessageParser.ts (🆕 new)
│   │
│   └── stores/ (🆕 new directory)
│       ├── canvasChat.ts
│       ├── canvasActions.ts
│       └── canvasSnapshot.ts
│
├── plugins/
│   └── ai-chat/
│       ├── AIChatPlugin.tsx (🔄 enhance)
│       ├── ActionStatusList.tsx (🆕 new)
│       └── ConfirmationDialog.tsx (🆕 new)
│
├── app/
│   └── api/
│       └── canvas-chat/
│           └── route.ts (🆕 new)
│
└── utils/
    ├── systemPrompts.ts (🆕 new)
    └── canvasHelpers.ts (🆕 new)
```

---

**End of Gap Analysis & MVP Best Practices Document**
