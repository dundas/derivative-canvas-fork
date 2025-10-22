# AI Chat Plugin Integration Guide

This guide shows you how to integrate the AI Chat plugin into your Derivative Canvas application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Basic Setup](#basic-setup)
3. [Configuration](#configuration)
4. [Integration Examples](#integration-examples)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm/yarn
- Next.js 13+ (App Router recommended)
- Derivative Canvas installed
- Anthropic or OpenAI API key

## Basic Setup

### Step 1: Install Dependencies

```bash
npm install @derivative-canvas/core @excalidraw/excalidraw
# or
yarn add @derivative-canvas/core @excalidraw/excalidraw
```

### Step 2: Set Environment Variables

Create a `.env.local` file:

```bash
# For Anthropic Claude (recommended)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...

# OR for OpenAI
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Optional: Custom endpoint
NEXT_PUBLIC_AI_CHAT_ENDPOINT=https://your-api.com/chat
```

### Step 3: Create Canvas Page

Create `app/canvas/page.tsx`:

```typescript
"use client";

import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { AIChatPlugin } from '@derivative-canvas/core/plugins/ai-chat';

export default function CanvasPage() {
  return (
    <DerivativeCanvasLayout
      layoutType="canvas"
      plugins={[
        {
          plugin: AIChatPlugin,
          config: {
            aiProvider: 'anthropic',
            apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
            chatMode: 'sidebar',
          },
        },
      ]}
    />
  );
}
```

## Configuration

### Anthropic Claude Configuration

```typescript
const aiChatConfig = {
  aiProvider: 'anthropic',
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  chatMode: 'sidebar',
  systemPrompt: 'Custom system prompt here...',
};
```

### OpenAI Configuration

```typescript
const aiChatConfig = {
  aiProvider: 'openai',
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  model: 'gpt-4',
  chatMode: 'sidebar',
};
```

### Custom Endpoint Configuration

```typescript
const aiChatConfig = {
  aiProvider: 'custom',
  apiEndpoint: 'https://your-api.com/chat',
  apiKey: 'your-api-key',
  chatMode: 'sidebar',
};
```

## Integration Examples

### Example 1: Sidebar Chat (Default)

```typescript
"use client";

import React from 'react';
import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { AIChatPlugin } from '@derivative-canvas/core/plugins/ai-chat';

export default function SidebarChatPage() {
  return (
    <div className="h-screen">
      <DerivativeCanvasLayout
        layoutType="canvas"
        showHeader={true}
        showSidebar={true}
        plugins={[
          {
            plugin: AIChatPlugin,
            config: {
              aiProvider: 'anthropic',
              apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
              chatMode: 'sidebar',
            },
          },
        ]}
      />
    </div>
  );
}
```

### Example 2: Chat on Canvas

```typescript
"use client";

import React from 'react';
import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { AIChatPlugin } from '@derivative-canvas/core/plugins/ai-chat';

export default function CanvasChatPage() {
  return (
    <div className="h-screen">
      <DerivativeCanvasLayout
        layoutType="canvas"
        plugins={[
          {
            plugin: AIChatPlugin,
            config: {
              aiProvider: 'anthropic',
              apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
              chatMode: 'canvas', // Messages appear as bubbles on canvas
            },
          },
        ]}
      />
    </div>
  );
}
```

### Example 3: Hybrid Layout with AI Chat

```typescript
"use client";

import React from 'react';
import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { AIChatPlugin } from '@derivative-canvas/core/plugins/ai-chat';

export default function HybridLayoutPage() {
  return (
    <DerivativeCanvasLayout
      layoutType="hybrid"
      onViewToggle={(view) => {
        console.log('Switched to:', view);
      }}
      plugins={[
        {
          plugin: AIChatPlugin,
          config: {
            aiProvider: 'anthropic',
            apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
            chatMode: 'sidebar',
            systemPrompt: `You are helping users design and visualize their ideas.
            Provide helpful suggestions for layout and organization.`,
          },
        },
      ]}
    >
      {/* Traditional view content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Traditional View</h1>
        <p>This shows when users toggle to traditional view</p>
      </div>
    </DerivativeCanvasLayout>
  );
}
```

### Example 4: Multiple Plugins

```typescript
"use client";

import React from 'react';
import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { AIChatPlugin } from '@derivative-canvas/core/plugins/ai-chat';
import { MediaInputPlugin } from '@derivative-canvas/core/plugins/media-input';

export default function MultiPluginPage() {
  return (
    <DerivativeCanvasLayout
      layoutType="canvas"
      plugins={[
        // AI Chat Plugin
        {
          plugin: AIChatPlugin,
          config: {
            aiProvider: 'anthropic',
            apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
            chatMode: 'sidebar',
          },
        },
        // Media Input Plugin
        {
          plugin: MediaInputPlugin,
          config: {
            enableAudio: true,
            enableVideo: true,
            enableScreenCapture: true,
          },
        },
      ]}
    />
  );
}
```

### Example 5: Programmatic Element Creation

```typescript
"use client";

import React, { useRef, useEffect } from 'react';
import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { AIChatPlugin, ElementFactory } from '@derivative-canvas/core/plugins/ai-chat';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

export default function ProgrammaticPage() {
  const excalidrawRef = useRef<ExcalidrawImperativeAPI>(null);

  const createSampleElements = () => {
    if (!excalidrawRef.current) return;

    const elements = excalidrawRef.current.getSceneElements();
    const appState = excalidrawRef.current.getAppState();

    const factory = new ElementFactory({
      elements,
      appState,
    });

    // Create a code block
    const codeBlock = factory.createCodeBlock({
      code: `function hello() {
  console.log("Hello from AI Chat!");
}`,
      language: 'javascript',
      title: 'Sample Code',
    });

    // Create a terminal output
    const terminal = factory.createTerminalOutput({
      output: `$ npm install @derivative-canvas/core
Installing packages...
✓ Done!`,
      title: 'Installation',
    });

    // Create a note
    const note = factory.createNote({
      text: 'AI Chat plugin is awesome! 🎉',
      color: 'yellow',
    });

    // Add all elements to canvas
    excalidrawRef.current.updateScene({
      elements: [...elements, ...codeBlock, ...terminal, ...note],
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <button
          onClick={createSampleElements}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Sample Elements
        </button>
      </div>
      <div className="flex-1">
        <DerivativeCanvasLayout
          ref={excalidrawRef}
          layoutType="canvas"
          plugins={[
            {
              plugin: AIChatPlugin,
              config: {
                aiProvider: 'anthropic',
                apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
                chatMode: 'sidebar',
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
```

## Advanced Usage

### Custom System Prompt for Domain-Specific Use

```typescript
const systemPrompt = `You are an AI assistant specialized in software architecture.

Your role:
- Help users design system architecture diagrams
- Suggest best practices for component organization
- Create clear documentation on canvas
- Generate code examples for architectural patterns

When creating elements:
- Use code blocks for implementation examples
- Use notes for architectural decisions
- Use terminal output for command examples
- Keep diagrams clean and organized

Always provide reasoning for your suggestions.`;

const aiChatConfig = {
  aiProvider: 'anthropic',
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
  chatMode: 'sidebar',
  systemPrompt,
};
```

### Handling AI Events

```typescript
"use client";

import React, { useEffect } from 'react';
import { useDerivativeCanvas } from '@derivative-canvas/core';

export default function EventHandlingPage() {
  const { api, events } = useDerivativeCanvas();

  useEffect(() => {
    // Listen for canvas changes
    const handleElementsChanged = (elements: any[]) => {
      console.log('Canvas updated:', elements.length, 'elements');
    };

    events.on('elements:changed', handleElementsChanged);

    return () => {
      events.off('elements:changed', handleElementsChanged);
    };
  }, [events]);

  return <div>Canvas with event handling</div>;
}
```

### Custom AI Endpoint Implementation

If you're using a custom AI endpoint, it should accept this format:

```typescript
// POST /your-api-endpoint
{
  "message": "User's message here",
  "canvasContext": "Summary of canvas state",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "AI response" }
  ]
}

// Expected response
{
  "message": "AI response text",
  "actions": [
    {
      "type": "create-code",
      "data": {
        "code": "const x = 1;",
        "language": "javascript"
      }
    }
  ]
}
```

## Troubleshooting

### Issue: AI Not Responding

**Solution:**
1. Check API key is correct in `.env.local`
2. Verify environment variable is prefixed with `NEXT_PUBLIC_`
3. Restart development server after changing env vars
4. Check browser console for API errors

```bash
# Verify env vars are loaded
console.log(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? 'Key loaded' : 'Key missing');
```

### Issue: Elements Not Appearing on Canvas

**Solution:**
1. Verify plugin is properly registered
2. Check framework API is available in context
3. Look for errors in browser console
4. Ensure `onCreateElements` callback is wired

```typescript
// Debug element creation
const handleCreateElements = (elements: any[]) => {
  console.log('Creating elements:', elements);
  if (context.framework) {
    addElementsToCanvas(context.framework, elements);
  } else {
    console.error('Framework API not available');
  }
};
```

### Issue: Chat Mode Toggle Not Working

**Solution:**
1. Ensure you're using latest version
2. Check plugin context has framework reference
3. Verify app state updates propagate correctly

```typescript
// Debug chat mode
const toggleChatMode = () => {
  console.log('Current mode:', chatMode);
  console.log('Framework available:', !!context.framework);
  // ... rest of toggle logic
};
```

### Issue: TypeScript Errors

**Solution:**
1. Ensure types are imported correctly
2. Check tsconfig.json includes derivative-canvas types
3. Run `yarn test:typecheck` to see all type errors

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@derivative-canvas/core"]
  }
}
```

## Performance Optimization

### Debounce Canvas Updates

```typescript
import { debounce } from 'lodash';

const handleCanvasChange = debounce((elements) => {
  aiService.updateCanvasContext(elements, appState);
}, 500);
```

### Limit History Size

```typescript
const aiService = new AIService({
  provider: 'anthropic',
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
  maxHistorySize: 5, // Keep only last 5 messages
});
```

## Next Steps

- Explore the [API Reference](../plugins/ai-chat/README.md#api-reference)
- Check out [examples directory](../examples/)
- Read about [custom plugins](../README.md#creating-custom-plugins)
- Join our [Discord community](https://discord.gg/derivative-canvas)

---

**Happy building! 🚀**
