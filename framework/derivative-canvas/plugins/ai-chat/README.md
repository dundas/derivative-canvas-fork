# AI Chat Plugin for Derivative Canvas

An intelligent AI assistant plugin for Excalidraw that enables natural language interaction with your canvas, automatic element creation, and smart content placement.

## Features

### Core Capabilities

- **🤖 AI-Powered Chat**: Interact with Claude or GPT-4 to discuss and create canvas content
- **🎨 Canvas Awareness**: AI understands your canvas state and provides contextual assistance
- **📦 Smart Element Creation**: Automatically create code blocks, terminal outputs, notes, and documents
- **🎯 Intelligent Placement**: Advanced placement engine avoids overlaps and creates clean layouts
- **💬 Dual Chat Modes**: Chat in sidebar OR directly on canvas as bubbles
- **🔄 Bidirectional Interaction**: Select canvas elements to discuss them with AI

### Element Types

The AI can create:

- **Code Blocks**: Syntax-highlighted code with language support
- **Terminal Output**: Styled terminal/console displays
- **Sticky Notes**: Colorful notes with handwritten font
- **Chat Bubbles**: Conversation messages directly on canvas
- **Document Placeholders**: PDF, image, and file representations
- **Text Elements**: Simple text with smart sizing

### Placement Strategies

1. **Viewport Center**: Place elements in the center of current view
2. **Grid-Based**: Align to invisible grid for clean layouts
3. **Flow-Based**: Natural left-to-right, top-to-bottom flow
4. **Proximity-Based**: Place near related elements
5. **Collision Avoidance**: Smart positioning to avoid overlaps

## Installation

```bash
npm install @derivative-canvas/core
# or
yarn add @derivative-canvas/core
```

## Quick Start

### Basic Configuration

```typescript
import { AIChatPlugin } from "@derivative-canvas/core/plugins/ai-chat";

// Configure the plugin
const aiChatConfig = {
  aiProvider: "anthropic", // or 'openai' or 'custom'
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-5-sonnet-20241022",
  chatMode: "sidebar", // or 'canvas'
};

// Register with Derivative Canvas
const canvasConfig = {
  plugins: [
    {
      pluginId: "ai-chat",
      enabled: true,
      config: aiChatConfig,
    },
  ],
};
```

### Using with Anthropic Claude

```typescript
import { AIChatPlugin } from "@derivative-canvas/core/plugins/ai-chat";

const plugin = {
  ...AIChatPlugin,
  config: {
    aiProvider: "anthropic",
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    model: "claude-3-5-sonnet-20241022",
    chatMode: "sidebar",
  },
};
```

### Using with OpenAI

```typescript
import { AIChatPlugin } from "@derivative-canvas/core/plugins/ai-chat";

const plugin = {
  ...AIChatPlugin,
  config: {
    aiProvider: "openai",
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    model: "gpt-4",
    chatMode: "sidebar",
  },
};
```

### Using with Custom Endpoint

```typescript
const plugin = {
  ...AIChatPlugin,
  config: {
    aiProvider: "custom",
    apiEndpoint: "https://your-api.com/chat",
    apiKey: "your-api-key",
    chatMode: "sidebar",
  },
};
```

## Usage Examples

### Example 1: Chat in Sidebar

```typescript
import { DerivativeCanvasLayout } from "@derivative-canvas/core";
import { AIChatPlugin } from "@derivative-canvas/core/plugins/ai-chat";

export default function CanvasPage() {
  return (
    <DerivativeCanvasLayout
      layoutType="canvas"
      plugins={[
        {
          plugin: AIChatPlugin,
          config: {
            aiProvider: "anthropic",
            apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
            chatMode: "sidebar",
          },
        },
      ]}
    />
  );
}
```

### Example 2: Chat on Canvas

```typescript
<DerivativeCanvasLayout
  layoutType="canvas"
  plugins={[
    {
      plugin: AIChatPlugin,
      config: {
        aiProvider: "anthropic",
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
        chatMode: "canvas", // Messages appear as bubbles on canvas
      },
    },
  ]}
/>
```

### Example 3: Programmatic Element Creation

```typescript
import { ElementFactory } from "@derivative-canvas/core/plugins/ai-chat";

// In your component
const elementFactory = new ElementFactory({
  elements: canvasElements,
  appState: canvasAppState,
});

// Create a code block
const codeBlock = elementFactory.createCodeBlock({
  code: 'const hello = "world";',
  language: "javascript",
  title: "Example Code",
});

// Create a terminal output
const terminal = elementFactory.createTerminalOutput({
  output: "$ npm install\nInstalling packages...\nDone!",
  title: "Installation",
});

// Create a sticky note
const note = elementFactory.createNote({
  text: "Remember to test this!",
  color: "yellow",
});

// Add to canvas
api.addElements([...codeBlock, ...terminal, ...note]);
```

## AI Interaction

### Natural Language Commands

Users can interact with the AI using natural language:

- "Create a Python function to sort a list"
- "Add a sticky note with project ideas"
- "Show me a terminal output example"
- "Generate a flowchart for user authentication"
- "Explain the elements on my canvas"

### AI Response Format

The AI uses special markers to create canvas elements:

````
[ACTION:CODE]
```javascript
function sortList(arr) {
  return arr.sort((a, b) => a - b);
}
````

[/ACTION]

[ACTION:TERMINAL] $ node app.js Server running on port 3000 [/ACTION]

[ACTION:NOTE] Remember to add error handling! [/ACTION]

````

## Advanced Features

### Custom System Prompt

```typescript
const plugin = {
  ...AIChatPlugin,
  config: {
    aiProvider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    systemPrompt: `You are a specialized AI assistant for software architecture.
    Help users design system diagrams and document their architecture decisions.
    Focus on creating clear, organized visual representations.`,
  },
};
````

### Placement Control

```typescript
import { placementEngine } from "@derivative-canvas/core/plugins/ai-chat";

// Find optimal position with custom strategy
const position = placementEngine.findOptimalPosition(elements, appState, {
  width: 400,
  height: 300,
  strategy: "grid", // or 'flow', 'proximity', 'viewport-center'
  avoidOverlap: true,
  padding: 20,
});
```

### Canvas Helpers

```typescript
import {
  getCanvasSummary,
  getSelectedElements,
  findElementsWithText,
} from "@derivative-canvas/core/plugins/ai-chat";

// Get AI-friendly canvas summary
const summary = getCanvasSummary(elements);

// Get currently selected elements
const selected = getSelectedElements(elements, appState);

// Find elements containing specific text
const found = findElementsWithText(elements, "TODO");
```

## API Reference

### AIService

```typescript
class AIService {
  constructor(config: AIServiceConfig);
  updateCanvasContext(elements: ExcalidrawElement[], appState: AppState): void;
  sendMessage(message: string): Promise<AIResponse>;
  clearHistory(): void;
  getHistory(): Message[];
  setSystemPrompt(prompt: string): void;
}
```

### ElementFactory

```typescript
class ElementFactory {
  createCodeBlock(options: CodeBlockOptions): any[];
  createTerminalOutput(options: TerminalOutputOptions): any[];
  createNote(options: NoteOptions): any[];
  createChatBubble(options: ChatBubbleOptions): any[];
  createDocumentPlaceholder(
    title: string,
    type: "pdf" | "image" | "file",
  ): any[];
}
```

### PlacementEngine

```typescript
class PlacementEngine {
  findOptimalPosition(
    elements: ExcalidrawElement[],
    appState: AppState,
    options: PlacementOptions,
  ): PlacementResult;

  getBoundingBox(elements: ExcalidrawElement[]): BoundingBox | null;
  snapToGrid(value: number): number;
}
```

## Configuration Options

```typescript
interface AIChatConfig {
  // AI Provider
  aiProvider: "anthropic" | "openai" | "custom";

  // API Configuration
  apiKey?: string;
  model?: string;
  apiEndpoint?: string;

  // Chat Mode
  chatMode: "sidebar" | "canvas";

  // System Prompt
  systemPrompt?: string;
}
```

## Environment Variables

```bash
# For Anthropic Claude
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

# For OpenAI
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Optional: Custom endpoint
NEXT_PUBLIC_AI_CHAT_ENDPOINT=https://your-api.com
```

## Performance Considerations

- The AI service batches canvas context updates
- Placement engine uses spatial indexing for collision detection
- History is limited to last 10 messages to reduce API payload
- Element creation is optimized with minimal re-renders

## Troubleshooting

### AI Not Responding

1. Check API key is set correctly
2. Verify network connectivity
3. Check browser console for errors
4. Ensure API endpoint is accessible

### Elements Not Appearing

1. Verify `onCreateElements` callback is wired
2. Check element factory context is updated
3. Ensure framework API is available
4. Look for placement collision issues

### Chat Mode Not Switching

1. Check framework API is properly initialized
2. Verify plugin context has framework reference
3. Ensure app state updates are propagating

## Examples

See the `/examples` directory for complete integration examples:

- `examples/basic-chat.tsx` - Simple sidebar chat
- `examples/canvas-chat.tsx` - Chat on canvas mode
- `examples/custom-ai.tsx` - Custom AI endpoint
- `examples/programmatic.tsx` - Programmatic element creation

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

- Documentation: [docs.derivative-canvas.dev](https://docs.derivative-canvas.dev)
- Issues: [GitHub Issues](https://github.com/your-org/derivative-canvas/issues)
- Discord: [Join our community](https://discord.gg/derivative-canvas)

---

**Built with ❤️ for the Excalidraw community**
