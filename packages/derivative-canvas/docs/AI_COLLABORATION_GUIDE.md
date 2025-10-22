# AI Canvas Collaboration Framework

**Version:** 2.0.0
**Status:** Production Ready

## Overview

The AI Canvas Collaboration Framework enables AI agents to work directly with humans on an Excalidraw canvas. Instead of AI being a separate chat interface, it becomes an active collaborator that can create, modify, and organize visual objects alongside users.

## Core Vision

> **"AI should be ever-present, not a destination. The canvas becomes the primary UI where you drag, drop, group, and collaborate with AI agents."**

### Use Cases

1. **Coding Collaboration**
   - Chat window for AI conversation
   - VM window showing terminal/execution output
   - Code snippets and documentation on canvas
   - Real-time test results and debugging

2. **Marketing Collaboration**
   - Import product images and website previews
   - AI generates ad variations and copy
   - Organize campaign assets visually
   - Export to marketing platforms

3. **General Collaboration**
   - Visual thinking and brainstorming
   - AI can create diagrams, notes, and organize ideas
   - Selection-based interactions (select objects → ask AI)
   - Multi-agent collaboration on shared canvas

## Three Core Building Blocks

### 1. Canvas Objects

High-level object types that AI can create and manipulate:

```typescript
type CanvasObjectType =
  | 'vm-window'      // Terminal/VM output for coding
  | 'chat-window'    // AI conversation window
  | 'image'          // Images, screenshots, visuals
  | 'website'        // Website preview/embed
  | 'text-block'     // Rich text content
  | 'card'           // Structured data (products, tasks)
  | 'agent'          // AI agent representation
  | 'group'          // Grouped objects
  | 'shape';         // Generic shape
```

### 2. AI-Canvas Interaction Layer

The `AICanvasController` provides high-level APIs for AI to interact with canvas:

```typescript
// Create objects
aiController.createVMWindow(command, output)
aiController.createChatWindow(messages)
aiController.createImage(url, dimensions)
aiController.createCard(title, fields)
aiController.createTextBlock(content)

// Update objects
aiController.updateVMWindow(id, newOutput)
aiController.addChatMessage(id, role, content)
aiController.updateAgentStatus(id, status)

// Query canvas
aiController.getCanvasContext()
aiController.getSelectedObjects()
aiController.getObjectsByType('image')

// Organize
aiController.groupObjects(ids)
aiController.linkObjects(sourceId, targetId)
```

### 3. Smart Object Placement

The `ObjectManager` handles intelligent layout and positioning:

```typescript
const objectManager = new ObjectManager({
  strategy: 'grid',    // 'grid' | 'flow' | 'stack'
  columns: 4,          // for grid layout
  padding: 20,
  margin: 10,
  maxWidth: 1200,      // for flow layout
});
```

**Layout Strategies:**
- **Grid**: Arrange in columns (good for cards, images)
- **Flow**: Left-to-right, top-to-bottom with wrapping
- **Stack**: Vertical stacking (good for chat/VM windows)

## Quick Start

### 1. Basic AI Chat with Canvas Manipulation

```tsx
import { EnhancedAIChatPlugin } from '@derivative-canvas/plugins/ai-canvas-chat';

const config = {
  // ... auth, storage config
  plugins: [
    { pluginId: 'enhanced-ai-chat', enabled: true },
  ],
};
```

The enhanced AI chat can:
- See all objects on canvas
- Create new objects based on user requests
- Respond to selection-based interactions
- Track conversation history

### 2. Coding Use Case

```tsx
import { CodingCollaborationPlugin } from '@derivative-canvas/plugins/use-cases';

const config = {
  plugins: [
    {
      pluginId: 'coding-collaboration',
      enabled: true,
      config: {
        defaultLanguage: 'typescript',
        autoRunTests: true,
      }
    },
  ],
};
```

**Features:**
- Start coding session with task description
- AI creates VM windows for running commands
- Chat window for conversation
- Quick actions: Run Tests, Type Check, Lint, Build
- Context menu: "Run this code", "Explain this code", "Debug this"

### 3. Marketing Use Case

```tsx
import { MarketingCollaborationPlugin } from '@derivative-canvas/plugins/use-cases';

const config = {
  plugins: [
    {
      pluginId: 'marketing-collaboration',
      enabled: true,
      config: {
        supportedPlatforms: ['facebook-ads', 'instagram', 'shopify'],
      }
    },
  ],
};
```

**Features:**
- Import products from Shopify
- Upload images and website previews
- AI generates ad copy and variations
- A/B test suggestions
- Export to marketing platforms
- Context menu: "Improve this design", "Generate variations"

## Creating Custom Plugins

### Example: Custom Agent Plugin

```tsx
import { AICanvasController } from '@derivative-canvas/core/ai-interaction';
import { ObjectManager } from '@derivative-canvas/core/canvas-objects';

export const MyCustomPlugin: ExcalidrawPlugin = {
  id: 'my-custom-plugin',
  name: 'My Custom AI Agent',
  version: '1.0.0',
  type: 'ai-chat',

  capabilities: {
    requiresAuth: true,
    permissions: ['canvas:read', 'canvas:write', 'ai-access'],
  },

  ui: {
    sidebar: [MyCustomSidebar],
    contextMenu: [
      {
        id: 'my-action',
        label: 'AI: Do something custom',
        onClick: (context) => {
          // Your custom logic
          const aiController = new AICanvasController(
            context.framework,
            'my-agent',
            `session_${Date.now()}`
          );

          // Create objects
          aiController.createTextBlock('Hello from AI!');
        },
        condition: (context) => {
          // Show only when something is selected
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
    ],
  },
};
```

## Advanced Usage

### Working with Selected Objects

```typescript
// Get selected objects
const selected = aiController.getSelectedObjects();

// Analyze selection
selected.forEach((obj) => {
  console.log(obj.customData?.canvasObject);
  // Access type, metadata, typeData
});

// Create related object
if (selected.length > 0) {
  const firstPos = selected[0];
  aiController.createTextBlock(
    'Analysis of selection...',
    'markdown',
    { x: firstPos.x + 300, y: firstPos.y }
  );
}
```

### Grouping and Linking Objects

```typescript
// Create related objects
const card1 = aiController.createCard('Product A', 'Description');
const card2 = aiController.createCard('Product B', 'Description');
const card3 = aiController.createCard('Product C', 'Description');

// Group them
const groupId = aiController.groupObjects([card1.id, card2.id, card3.id]);

// Link card1 to card2
aiController.linkObjects(card1.id, card2.id);

// Query grouped objects
const grouped = aiController.getObjectsByGroup(groupId);
```

### Updating Objects in Real-Time

```typescript
// Create VM window
const vmWindow = aiController.createVMWindow('npm test', ['$ npm test']);

// Simulate command output over time
const outputs = [
  ['$ npm test', 'Running tests...'],
  ['$ npm test', 'Running tests...', 'PASS src/test1.tsx'],
  ['$ npm test', 'Running tests...', 'PASS src/test1.tsx', 'PASS src/test2.tsx'],
  ['$ npm test', 'All tests passed! ✓'],
];

outputs.forEach((output, i) => {
  setTimeout(() => {
    aiController.updateVMWindow(vmWindow.id, output);
  }, i * 1000);
});
```

### Canvas Context for AI

```typescript
// Get full context for AI prompts
const context = aiController.getCanvasContext();

const aiPrompt = `
You are helping with a canvas that has:
- ${context.totalElements} total elements
- ${context.canvasObjects.length} canvas objects
- ${context.aiGeneratedCount} AI-generated objects
- ${context.selectedElementIds.length} selected

Object types: ${context.canvasObjects.map(o => o.type).join(', ')}

What should we do next?
`;

// Send to your AI API
const response = await callAI(aiPrompt);
```

## Object Metadata Structure

Every canvas object has rich metadata:

```typescript
interface CanvasObjectMetadata {
  // Core
  objectType: CanvasObjectType;
  id: string;
  createdBy: 'user' | 'ai' | string;
  createdAt: Date;
  updatedAt: Date;

  // AI collaboration
  aiGenerated?: boolean;
  agentId?: string;
  conversationId?: string;

  // Organization
  groupId?: string;
  linkedObjectIds?: string[];
  parentId?: string;

  // Type-specific data
  typeData?: VMWindowData | ChatWindowData | ImageData | CardData | ...;

  // Custom
  custom?: Record<string, any>;
}
```

## Layout Strategies

### Grid Layout

Best for: Product cards, image galleries

```typescript
const objectManager = new ObjectManager({
  strategy: 'grid',
  columns: 4,
  padding: 20,
  margin: 10,
});
```

### Flow Layout

Best for: Mixed content, dynamic placement

```typescript
const objectManager = new ObjectManager({
  strategy: 'flow',
  maxWidth: 1200,
  padding: 20,
  margin: 10,
});
```

### Stack Layout

Best for: Chat windows, sequential content

```typescript
const objectManager = new ObjectManager({
  strategy: 'stack',
  padding: 20,
  margin: 10,
});
```

## Integration with Real AI

The framework is designed to work with any AI provider. Here's how to integrate:

### 1. OpenAI Integration

```typescript
async function callOpenAI(
  messages: Array<{role: string, content: string}>,
  canvasContext: any
) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI canvas collaborator. Canvas state: ${JSON.stringify(canvasContext)}`
        },
        ...messages
      ],
      functions: [
        {
          name: 'create_canvas_object',
          description: 'Create an object on the canvas',
          parameters: {
            type: 'object',
            properties: {
              objectType: {
                type: 'string',
                enum: ['vm-window', 'chat-window', 'image', 'text-block', 'card']
              },
              content: { type: 'string' },
              position: {
                type: 'object',
                properties: { x: {type: 'number'}, y: {type: 'number'} }
              }
            }
          }
        }
      ]
    })
  });

  return response.json();
}
```

### 2. Claude Integration

```typescript
async function callClaude(
  messages: Array<{role: string, content: string}>,
  canvasContext: any,
  aiController: AICanvasController
) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: messages,
      system: `You are an AI canvas collaborator. You can create and modify objects on a visual canvas.

Current canvas state:
${JSON.stringify(canvasContext, null, 2)}

You can use these actions:
- create_vm_window(command: string)
- create_chat_window(messages: Message[])
- create_image(url: string, dimensions: {width, height})
- create_text_block(content: string)
- create_card(title: string, fields: Array<{label, value}>)
`,
    })
  });

  const result = await response.json();

  // Parse AI response and execute canvas actions
  if (result.content) {
    // Extract action requests from AI response
    // Execute via aiController
  }

  return result;
}
```

## Best Practices

### 1. Canvas Context Management

Always sync the ObjectManager with canvas state:

```typescript
useEffect(() => {
  const aiController = new AICanvasController(/* ... */);

  // Sync on mount
  aiController.syncWithCanvas();

  // Listen for changes
  context.framework.on('elements:changed', (elements) => {
    aiController.syncWithCanvas();
  });

  return () => {
    context.framework.off('elements:changed');
  };
}, []);
```

### 2. Progressive Enhancement

Start simple, add features incrementally:

```typescript
// Level 1: Basic chat that sees canvas
const context = aiController.getCanvasContext();
// Send to AI: "You see X objects on canvas"

// Level 2: AI can create basic objects
aiController.createTextBlock(aiResponse);

// Level 3: AI creates specialized objects
aiController.createVMWindow(command, output);

// Level 4: AI organizes and links objects
aiController.groupObjects(relatedIds);
```

### 3. User Control

Always give users control over AI actions:

```typescript
// Show what AI will do
const preview = `AI will create:
- 3 product cards
- 1 chat window
- 1 VM window

Continue?`;

if (await confirm(preview)) {
  // Execute AI actions
}
```

### 4. Selection-Based Interactions

Make AI context-aware of selections:

```typescript
const selected = aiController.getSelectedObjects();

if (selected.length > 0) {
  const prompt = `User selected ${selected.length} objects of types: ${
    selected.map(o => o.customData?.canvasObject?.objectType).join(', ')
  }. What should we do with them?`;

  const response = await callAI(prompt);
}
```

## Examples Gallery

### Example 1: Daily Standup

```typescript
// Agent creates standup board
const standup = async () => {
  const chatWindow = aiController.createChatWindow([{
    id: '1',
    role: 'assistant',
    content: 'Good morning! Ready for standup?',
    timestamp: new Date()
  }]);

  const yesterday = aiController.createCard('Yesterday', 'What did you do?');
  const today = aiController.createCard('Today', 'What will you do?');
  const blockers = aiController.createCard('Blockers', 'Any blockers?');

  aiController.groupObjects([yesterday.id, today.id, blockers.id]);
};
```

### Example 2: Code Review

```typescript
// Agent reviews code and creates feedback cards
const reviewCode = async (code: string) => {
  const vmWindow = aiController.createVMWindow('npm run lint', [
    '$ npm run lint',
    'Checking code...'
  ]);

  const results = await lintCode(code);

  results.forEach((issue) => {
    aiController.createCard(
      `Issue: ${issue.rule}`,
      issue.message,
      [
        { label: 'Line', value: issue.line.toString() },
        { label: 'Severity', value: issue.severity }
      ]
    );
  });
};
```

### Example 3: Marketing Campaign

```typescript
// Import products and generate ad variations
const createCampaign = async (products: Product[]) => {
  // Import products as cards
  products.forEach((product) => {
    aiController.createCard(
      product.name,
      product.description,
      [
        { label: 'Price', value: product.price },
        { label: 'Stock', value: product.stock.toString() }
      ],
      product.imageUrl
    );
  });

  // AI creates chat window for collaboration
  const chat = aiController.createChatWindow([{
    id: '1',
    role: 'assistant',
    content: `I see ${products.length} products. Want me to:
1. Generate ad copy
2. Create design variations
3. Suggest A/B tests?`,
    timestamp: new Date()
  }]);

  // AI generates variations
  const variations = await generateAdVariations(products);
  variations.forEach((v) => {
    aiController.createImage(v.imageUrl, v.description);
  });
};
```

## Troubleshooting

### Objects Not Appearing

```typescript
// Ensure sync is called
aiController.syncWithCanvas();

// Check framework API is working
console.log(context.framework.listPlugins());

// Verify object was created
const obj = objectManager.getObject(id);
console.log(obj);
```

### Layout Issues

```typescript
// Change layout strategy
objectManager.setLayoutConfig({
  strategy: 'flow', // try different strategy
  padding: 50,      // increase padding
});

// Manual positioning
aiController.createCard(
  'Title',
  'Description',
  [],
  undefined,
  { x: 100, y: 100 } // explicit position
);
```

### Performance with Many Objects

```typescript
// Batch creates
const objects = [];
for (let i = 0; i < 100; i++) {
  objects.push(objectManager.createObject(/* ... */));
}

// Update canvas once
context.framework.updateElements([
  ...existingElements,
  ...objects
]);
```

## What's Next?

- **Real-time Collaboration**: Multiple AI agents on same canvas
- **Persistent Sessions**: Save AI conversation with canvas state
- **Voice Integration**: Voice commands to AI on canvas
- **Template Library**: Pre-built templates for common workflows
- **Analytics**: Track how users interact with AI on canvas

## Resources

- [Derivative Canvas Core Docs](../README.md)
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- [API Reference](./API_REFERENCE.md)
- [Examples Repository](../examples/)

## Support

For issues and questions:
- GitHub Issues: [derivative-canvas/issues](https://github.com/your-repo/issues)
- Documentation: [docs.derivativecanvas.com](https://docs.derivativecanvas.com)
- Community: [Discord](https://discord.gg/derivative-canvas)
