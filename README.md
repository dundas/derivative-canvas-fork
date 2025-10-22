<<<<<<< HEAD
# Derivative Canvas Framework

**Derivative Canvas** is a powerful, standardized framework for integrating enhanced Excalidraw functionality into Next.js projects. It provides a plugin-based architecture, authentication integration, storage adapters, and customizable layouts.

## 🌟 Key Features

- **🔌 Plugin Architecture**: Extensible plugin system for AI chat, media input, integrations, and more
- **🔐 Authentication Integration**: Built-in support for NextAuth, Clerk, Auth0, and custom auth providers
- **💾 Storage Adapters**: MongoDB, PostgreSQL, Firebase, Supabase, and localStorage support
- **🎨 Flexible Layouts**: Canvas-only, hybrid (traditional + canvas toggle), and minimal layouts
- **🤖 AI-Enhanced**: Ready for AI chat assistants and intelligent canvas operations
- **📱 Responsive**: Works seamlessly across desktop and mobile devices
- **🎯 TypeScript First**: Full TypeScript support with comprehensive type definitions

## 🚀 Quick Start

### Installation

```bash
npm install @derivative-canvas/core @excalidraw/excalidraw
# or
yarn add @derivative-canvas/core @excalidraw/excalidraw
```

### Basic Setup

1. **Configure your app layout** (`app/layout.tsx`):

```typescript
import { DerivativeCanvasProvider } from '@derivative-canvas/core';
import { createNextAuthAdapter } from '@derivative-canvas/core/auth';
import { createMongoDBAdapter } from '@derivative-canvas/core/storage';

const canvasConfig = {
  auth: {
    provider: 'nextauth',
    adapter: createNextAuthAdapter()
  },
  storage: {
    provider: 'mongodb',
    adapter: createMongoDBAdapter({
      connectionString: process.env.MONGODB_URI!
    })
  },
  plugins: [
    { pluginId: 'ai-chat', enabled: true },
  ],
  layout: 'hybrid' // 'canvas' | 'hybrid' | 'minimal'
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DerivativeCanvasProvider config={canvasConfig}>
          {children}
        </DerivativeCanvasProvider>
      </body>
    </html>
  );
}
```

2. **Create a canvas route** (`app/canvas/page.tsx`):

```typescript
import { DerivativeCanvasLayout } from '@derivative-canvas/core';

export default function CanvasPage() {
  return (
    <DerivativeCanvasLayout layoutType="hybrid">
      {/* Traditional view content (optional for hybrid layout) */}
      <div className="p-8">
        <h1>Traditional Board View</h1>
        <p>This shows when users toggle to traditional view</p>
      </div>
    </DerivativeCanvasLayout>
  );
}
```

3. **Add API routes for storage** (`app/api/derivative-canvas/[...operation]/route.ts`):

```typescript
import { createMongoDBAPIRoutes } from '@derivative-canvas/core/storage';

const routes = createMongoDBAPIRoutes();

export async function GET(req: Request) {
  // Handle load and list operations
  return routes.load(req);
}

export async function POST(req: Request) {
  // Handle save operations
  return routes.save(req);
}

export async function DELETE(req: Request) {
  // Handle delete operations
  return routes.delete(req);
}
```

## 🔌 Plugin System

### Built-in Plugins

- **AI Chat Plugin**: Intelligent assistant for canvas operations
- **Media Input Plugin**: Audio/video recording and screen capture
- **Integration Plugins**: Shopify, Facebook Ads, and custom service integrations

### Creating Custom Plugins

```typescript
import type { DerivativeCanvasPlugin } from '@derivative-canvas/core';

export const MyCustomPlugin: DerivativeCanvasPlugin = {
  id: 'my-custom-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',
  type: 'ui-enhancement',

  capabilities: {
    requiresAuth: true,
    permissions: ['canvas:read', 'canvas:write']
  },

  ui: {
    toolbar: [MyToolbarButton],
    sidebar: [MySidebarPanel]
  },

  onElementsChange: (elements) => {
    console.log('Canvas updated:', elements.length);
  },

  config: {
    // Plugin-specific configuration
  }
};
```

## 🎨 Layout Options

### 1. Canvas Layout
Full canvas experience with optional header, toolbar, and sidebar:

```typescript
<DerivativeCanvasLayout
  layoutType="canvas"
  showHeader={true}
  showToolbar={true}
  showSidebar={true}
/>
```

### 2. Hybrid Layout
Toggle between traditional and canvas views:

```typescript
<DerivativeCanvasLayout
  layoutType="hybrid"
  onViewToggle={(view) => console.log('Switched to:', view)}
>
  {/* Traditional view content */}
  <YourExistingApp />
</DerivativeCanvasLayout>
```

### 3. Minimal Layout
Just the canvas with no additional UI:

```typescript
<DerivativeCanvasLayout layoutType="minimal" />
```

## 🔐 Authentication

### NextAuth Integration

```typescript
import { createNextAuthAdapter } from '@derivative-canvas/core/auth';

const authConfig = {
  auth: {
    provider: 'nextauth',
    adapter: createNextAuthAdapter({
      signInPage: '/auth/signin',
      apiRoute: '/api/auth'
    })
  }
};
```

### Custom Auth Provider

```typescript
import type { AuthAdapter } from '@derivative-canvas/core';

const customAuthAdapter: AuthAdapter = {
  getCurrentUser: async () => {
    // Your auth logic
    return user;
  },
  signIn: async () => { /* ... */ },
  signOut: async () => { /* ... */ },
  getToken: async () => { /* ... */ },
  isAuthenticated: async () => { /* ... */ }
};
```

## 💾 Storage

### MongoDB

```typescript
import { createMongoDBAdapter } from '@derivative-canvas/core/storage';

const storageConfig = {
  storage: {
    provider: 'mongodb',
    adapter: createMongoDBAdapter({
      connectionString: process.env.MONGODB_URI!,
      databaseName: 'my-app',
      collectionName: 'canvases'
    })
  }
};
```

### Custom Storage

```typescript
import type { StorageAdapter } from '@derivative-canvas/core';

const customStorageAdapter: StorageAdapter = {
  saveCanvas: async (userId, canvasId, data) => { /* ... */ },
  loadCanvas: async (userId, canvasId) => { /* ... */ },
  listCanvases: async (userId) => { /* ... */ },
  deleteCanvas: async (userId, canvasId) => { /* ... */ },
  shareCanvas: async (userId, canvasId, permissions) => { /* ... */ }
};
```

## 🎯 Real-World Example: HelloConvo Integration

Here's how Derivative Canvas integrates into the HelloConvo project:

```typescript
// app/board/[boardId]/canvas/page.tsx
import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { AIChatPlugin } from '@derivative-canvas/core/plugins';
import { BoardDetails } from '@/components/BoardDetails';

export default function BoardCanvasPage({ params }: { params: { boardId: string } }) {
  return (
    <DerivativeCanvasLayout
      layoutType="hybrid"
      canvasId={params.boardId}
      onViewToggle={(view) => {
        // Analytics or state management
        analytics.track('board_view_changed', { view, boardId: params.boardId });
      }}
    >
      {/* Traditional board view */}
      <BoardDetails boardId={params.boardId} />
    </DerivativeCanvasLayout>
  );
}
```

## 🚀 Advanced Features

### Canvas Operations API

```typescript
import { useDerivativeCanvas } from '@derivative-canvas/core';

function MyComponent() {
  const { api } = useDerivativeCanvas();

  const handleAddElement = () => {
    api.addElement({
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 100
    });
  };

  const handleSaveCanvas = async () => {
    const canvasId = await api.saveCanvas('My Canvas');
    console.log('Saved with ID:', canvasId);
  };

  const handleShareCanvas = async () => {
    const shareUrl = await api.shareCanvas({
      type: 'edit',
      public: true
    });
    console.log('Share URL:', shareUrl);
  };
}
```

### Event System

```typescript
import { useDerivativeCanvas } from '@derivative-canvas/core';

function MyComponent() {
  const { api } = useDerivativeCanvas();

  useEffect(() => {
    const handleElementsChanged = (elements) => {
      console.log('Canvas elements changed:', elements);
    };

    api.on('elements:changed', handleElementsChanged);

    return () => {
      api.off('elements:changed', handleElementsChanged);
    };
  }, [api]);
}
```

## 📦 Package Structure

```
@derivative-canvas/core/
├── core/
│   ├── DerivativeCanvasProvider    # Main provider
│   ├── PluginManager              # Plugin system
│   ├── types                      # TypeScript definitions
│   └── EventEmitter              # Event system
├── layouts/
│   └── DerivativeCanvasLayout    # Layout components
├── plugins/
│   ├── ai-chat/                  # AI chat plugin
│   └── media-input/              # Media recording plugin
└── utils/
    ├── auth-adapters/            # Auth integrations
    └── storage-adapters/         # Storage integrations
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📚 [Documentation](https://docs.derivative-canvas.dev)
- 💬 [Discord Community](https://discord.gg/derivative-canvas)
- 🐛 [Issue Tracker](https://github.com/your-org/derivative-canvas/issues)
- 📧 [Email Support](mailto:support@derivative-canvas.dev)

---

**Derivative Canvas** - Empowering the next generation of canvas-based applications with AI-enhanced collaboration and infinite extensibility.
