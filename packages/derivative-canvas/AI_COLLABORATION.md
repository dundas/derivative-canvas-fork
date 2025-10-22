# AI Canvas Collaboration

> **Transform your canvas into a collaborative workspace where AI agents work alongside humans, creating, organizing, and shipping content together.**

## 🎯 Vision

Instead of AI being a destination you visit (separate chat window, different app), AI becomes **ever-present** on your canvas - a true collaborator that can see what you're working on, create visual objects, and help you organize ideas.

## ✨ What You Can Build

### 🖥️ Coding Collaboration
```
┌─────────────────┐  ┌──────────────────┐
│  Chat with AI   │  │   VM Window      │
│  "Run tests"    │  │   $ npm test     │
│  "Debug this"   │  │   ✓ All passing  │
└─────────────────┘  └──────────────────┘
```
- AI creates VM windows showing terminal output
- Chat window for back-and-forth debugging
- Real-time test results on canvas
- Select code → Ask AI to explain/debug/improve

### 🎨 Marketing Collaboration
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Product  │ │ Product  │ │ Product  │
│  Card    │ │  Card    │ │  Card    │
└──────────┘ └──────────┘ └──────────┘
      ↓           ↓           ↓
┌─────────────────────────────────────┐
│  AI: "Generate ad variations?"      │
│  → Creates 3 design variations      │
│  → Exports to Facebook Ads          │
└─────────────────────────────────────┘
```
- Import products from Shopify → Cards on canvas
- Select images → Ask AI to improve design
- AI generates ad copy and variations
- Ship directly to Facebook Ads, Instagram, etc.

## 🧱 Three Core Building Blocks

### 1. **Canvas Objects** - What AI Can Create

Different types of visual objects AI can place on your canvas:

- **VM Window** - Terminal/execution output for coding
- **Chat Window** - Persistent AI conversation
- **Image** - Screenshots, AI-generated visuals, photos
- **Website Preview** - Live website embeds
- **Text Block** - Notes, documentation, copy
- **Card** - Structured data (products, tasks, ideas)
- **Agent Avatar** - Visual representation of AI on canvas

### 2. **AI Interaction Layer** - How AI Works with Canvas

The `AICanvasController` gives AI the ability to:

```typescript
// See what's on canvas
const context = aiController.getCanvasContext();
// → { totalElements: 12, selectedIds: [3], objectTypes: ['card', 'image'] }

// Create objects
aiController.createVMWindow('npm test', output);
aiController.createCard('Product A', description, fields);
aiController.createImage(url, dimensions);

// Modify objects
aiController.updateVMWindow(id, newOutput);
aiController.addChatMessage(id, 'assistant', message);

// Organize objects
aiController.groupObjects([id1, id2, id3]);
aiController.linkObjects(sourceId, targetId);
```

### 3. **Smart Object Placement** - Intelligent Layout

Objects automatically position themselves without overlapping:

```typescript
const objectManager = new ObjectManager({
  strategy: 'grid',    // grid | flow | stack
  columns: 4,          // for grid layout
  padding: 20,
  margin: 10,
});

// Objects automatically find the right spot
aiController.createCard('Product 1'); // → positions at (20, 20)
aiController.createCard('Product 2'); // → positions at (270, 20)
aiController.createCard('Product 3'); // → positions at (520, 20)
```

## 🚀 Quick Start

### Install

```bash
npm install @derivative-canvas/core
```

### Basic Setup

```tsx
import { DerivativeCanvasProvider } from '@derivative-canvas/core';
import { EnhancedAIChatPlugin } from '@derivative-canvas/plugins';

const config = {
  auth: { /* ... */ },
  storage: { /* ... */ },
  plugins: [
    { pluginId: 'enhanced-ai-chat', enabled: true },
  ],
};

function App() {
  return (
    <DerivativeCanvasProvider config={config}>
      {/* Your app */}
    </DerivativeCanvasProvider>
  );
}
```

### Use Case: Coding

```tsx
import { CodingCollaborationPlugin } from '@derivative-canvas/plugins';

const config = {
  plugins: [
    { pluginId: 'coding-collaboration', enabled: true },
  ],
};

// User says: "Run my tests"
// AI creates:
// - VM window running: npm test
// - Chat window with results
// - Cards for any failing tests
```

### Use Case: Marketing

```tsx
import { MarketingCollaborationPlugin } from '@derivative-canvas/plugins';

const config = {
  plugins: [
    { pluginId: 'marketing-collaboration', enabled: true },
  ],
};

// User workflow:
// 1. Import Shopify products → Cards appear
// 2. Select 3 products → Right-click → "Generate ad variations"
// 3. AI creates variations as images
// 4. Select final version → Export to Facebook Ads
```

## 📖 Example: Complete Workflow

Here's a real workflow showing AI collaboration in action:

```typescript
// 1. User starts marketing campaign
const campaign = await startCampaign('Summer Sale 2024');

// 2. Import products from Shopify
await importProducts('https://mystore.shopify.com');
// → 10 product cards appear on canvas

// 3. User selects 3 products, right-clicks → "Ask AI"
const selected = aiController.getSelectedObjects();
// AI sees: 3 cards with product data

// 4. AI creates variations
aiController.createChatWindow([{
  role: 'assistant',
  content: 'I see 3 summer dresses. Let me create ad variations...'
}]);

['Bright', 'Minimal', 'Bold'].forEach(style => {
  aiController.createCard(
    `${style} Ad`,
    `AI-generated ${style} variation`,
    [{ label: 'Style', value: style }]
  );
});

// 5. AI groups related items
const cardIds = aiController.getObjectsByType('card').map(c => c.id);
aiController.groupObjects(cardIds);

// 6. User selects final version → Export
await exportToFacebookAds(selectedVariation, 'summer-2024-campaign');
```

## 🎬 Real-World Use Cases

### Scenario 1: Developer Debugging

```
User: "My tests are failing, help me debug"

AI creates:
1. VM Window - Runs: npm test
2. Chat Window - "I see 3 failing tests. Let me help..."
3. Text Block - Code snippet with fix
4. Another VM Window - Shows fix working

User can:
- See everything visually on canvas
- Copy code from text blocks
- Watch VM output update in real-time
- Chat with AI about the solution
```

### Scenario 2: Marketer Creating Campaign

```
User: Imports 20 products from Shopify

AI creates:
1. 20 Product Cards - Auto-arranged in grid
2. Chat Window - "Want me to group these by category?"
3. User: "Yes, and generate Facebook ads"
4. AI groups cards, creates ad variations as images
5. Text Blocks with ad copy for each variation

User can:
- Drag/rearrange products
- Select subset → Generate variations
- Export directly to Facebook Ads
- Track entire campaign visually
```

### Scenario 3: Team Brainstorming

```
Multiple team members + AI on canvas

AI creates:
1. Agent Avatar - Visual presence on canvas
2. Text Blocks - Captures ideas as they're discussed
3. Cards - Organizes ideas into categories
4. Links between related concepts

Team can:
- See AI as a participant on canvas
- All ideas visually organized
- Export as PDF or Notion doc
- Continue later (canvas state saved)
```

## 🔧 Advanced Features

### Selection-Based Interactions

```tsx
// Right-click on selected objects → Context menu

{
  id: 'ask-ai',
  label: 'Ask AI about selection',
  onClick: (context) => {
    const selected = aiController.getSelectedObjects();
    // AI analyzes selected objects
  }
}
```

### Multi-Agent Collaboration

```typescript
// Multiple AI agents on same canvas
const coder = new AICanvasController(api, 'coder-agent', session);
const designer = new AICanvasController(api, 'designer-agent', session);

// Coder creates VM window
coder.createVMWindow('npm run build', output);

// Designer creates images
designer.createImage(designUrl, dimensions);

// They can reference each other's work
const coderObjects = coder.getAIObjects();
const designerObjects = designer.getAIObjects();
```

### Custom Object Types

```typescript
// Define your own object types
interface CustomCardData extends CardData {
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: Date;
}

const taskCard = aiController.createCard(
  'Implement Feature X',
  'Build the new dashboard feature',
  [
    { label: 'Priority', value: 'high' },
    { label: 'Assignee', value: 'john@example.com' },
    { label: 'Due', value: '2024-12-31' }
  ]
);
```

## 📚 Documentation

- **[Complete Guide](./docs/AI_COLLABORATION_GUIDE.md)** - Full documentation with examples
- **[API Reference](./docs/API_REFERENCE.md)** - Detailed API documentation
- **[Plugin Development](./docs/PLUGIN_DEVELOPMENT.md)** - Build custom plugins
- **[Examples](./examples/)** - Code examples and templates

## 🎓 Learning Path

1. **Start Here**: Read this README
2. **Try Examples**: Run the example plugins
3. **Build Simple**: Create a basic plugin with `createTextBlock()`
4. **Go Advanced**: Add VM windows, chat windows, custom layouts
5. **Ship It**: Build your own use case (coding, design, sales, etc.)

## 🤝 Contributing

We welcome contributions! Areas we'd love help with:

- New use case plugins (sales, design, education, etc.)
- AI provider integrations (OpenAI, Anthropic, local models)
- Better layout algorithms
- Real-time collaboration features
- Performance optimizations

## 📝 License

MIT

## 🙏 Credits

Built on top of [Excalidraw](https://excalidraw.com) - the excellent open-source whiteboard tool.

---

**Ready to build?** Check out the [Complete Guide](./docs/AI_COLLABORATION_GUIDE.md) →
