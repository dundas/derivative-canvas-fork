# HelloConvo + Derivative Canvas Integration Example

This example shows how to integrate Derivative Canvas into the HelloConvo project to achieve the vision described in your brainstorm transcript.

## 🎯 Vision Implementation

**"AI should be ever-present, not a destination. The canvas becomes the primary UI where you drag, drop, group, and collaborate with AI agents."**

## 📁 File Structure

```
helloconvo-app/
├── app/
│   ├── layout.tsx                 # Root layout with Derivative Canvas provider
│   ├── board/
│   │   └── [boardId]/
│   │       ├── page.tsx           # Traditional board view
│   │       └── canvas/
│   │           └── page.tsx       # Canvas board view
│   └── api/
│       └── derivative-canvas/
│           └── [...operation]/
│               └── route.ts       # Storage API routes
├── components/
│   ├── derivative-canvas/
│   │   ├── HelloConvoProvider.tsx # Custom provider with HelloConvo integration
│   │   ├── AgentSummonPlugin.tsx  # Plugin for summoning AI agents
│   │   ├── ShopifyImportPlugin.tsx # Plugin for importing Shopify data
│   │   └── FacebookAdsPlugin.tsx  # Plugin for Facebook Ads export
│   └── boards/
│       └── BoardDetails.tsx       # Existing traditional board component
└── plugins/
    ├── integrations/
    │   ├── shopify.ts
    │   └── facebook-ads.ts
    └── agents/
        ├── daily-briefing.ts
        └── multi-agent.ts
```

## 🔧 Implementation

### 1. Root Layout Configuration

```typescript
// app/layout.tsx
import { DerivativeCanvasProvider } from '@derivative-canvas/core';
import { HelloConvoProvider } from '@/components/derivative-canvas/HelloConvoProvider';
import { createNextAuthAdapter } from '@derivative-canvas/core/auth';
import { createMongoDBAdapter } from '@derivative-canvas/core/storage';
import { AIChatPlugin } from '@derivative-canvas/core/plugins';
import { AgentSummonPlugin } from '@/components/derivative-canvas/AgentSummonPlugin';
import { ShopifyImportPlugin } from '@/components/derivative-canvas/ShopifyImportPlugin';
import { FacebookAdsPlugin } from '@/components/derivative-canvas/FacebookAdsPlugin';

const derivativeCanvasConfig = {
  auth: {
    provider: 'nextauth',
    adapter: createNextAuthAdapter({
      signInPage: '/auth/signin',
      apiRoute: '/api/auth'
    })
  },
  storage: {
    provider: 'mongodb',
    adapter: createMongoDBAdapter({
      connectionString: process.env.MONGODB_URI!,
      databaseName: 'helloconvo',
      collectionName: 'board_canvases'
    })
  },
  plugins: [
    { pluginId: 'ai-chat', enabled: true },
    { pluginId: 'agent-summon', enabled: true },
    { pluginId: 'shopify-import', enabled: true },
    { pluginId: 'facebook-ads', enabled: true },
  ],
  layout: 'hybrid',
  theme: {
    canvasBackground: '#fafafa',
    elementStroke: '#1e1e1e',
    elementBackground: '#ffffff',
    uiBackground: '#ffffff',
    uiBorder: '#e5e7eb'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DerivativeCanvasProvider config={derivativeCanvasConfig}>
          <HelloConvoProvider>
            {children}
          </HelloConvoProvider>
        </DerivativeCanvasProvider>
      </body>
    </html>
  );
}
```

### 2. HelloConvo Custom Provider

```typescript
// components/derivative-canvas/HelloConvoProvider.tsx
"use client";

import React, { createContext, useContext } from 'react';
import { useDerivativeCanvas } from '@derivative-canvas/core';
import { AgentSummonPlugin } from './AgentSummonPlugin';
import { ShopifyImportPlugin } from './ShopifyImportPlugin';
import { FacebookAdsPlugin } from './FacebookAdsPlugin';

interface HelloConvoContextType {
  summonAgent: (agentType: string, context: any) => Promise<void>;
  importFromShopify: (storeUrl: string) => Promise<void>;
  exportToFacebookAds: (elements: any[], campaignId: string) => Promise<void>;
  startDailyBriefing: () => Promise<void>;
}

const HelloConvoContext = createContext<HelloConvoContextType | null>(null);

export const useHelloConvo = () => {
  const context = useContext(HelloConvoContext);
  if (!context) {
    throw new Error('useHelloConvo must be used within HelloConvoProvider');
  }
  return context;
};

export const HelloConvoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { api } = useDerivativeCanvas();

  // Register HelloConvo-specific plugins
  React.useEffect(() => {
    api.registerPlugin(AgentSummonPlugin);
    api.registerPlugin(ShopifyImportPlugin);
    api.registerPlugin(FacebookAdsPlugin);
  }, [api]);

  const contextValue: HelloConvoContextType = {
    summonAgent: async (agentType: string, context: any) => {
      // Implementation for agent summoning
      console.log('Summoning agent:', agentType, context);

      // Example: Add agent card to canvas
      api.addElement({
        type: 'rectangle',
        x: Math.random() * 400,
        y: Math.random() * 300,
        width: 200,
        height: 100,
        backgroundColor: '#e3f2fd',
        label: `${agentType} Agent`,
        metadata: { type: 'agent', agentType }
      });
    },

    importFromShopify: async (storeUrl: string) => {
      try {
        const response = await fetch('/api/integrations/shopify/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeUrl })
        });

        const { products } = await response.json();

        // Add products as cards to canvas
        products.forEach((product: any, index: number) => {
          api.addElement({
            type: 'rectangle',
            x: 100 + (index % 4) * 220,
            y: 100 + Math.floor(index / 4) * 150,
            width: 200,
            height: 120,
            backgroundColor: '#f3e5f5',
            label: product.title,
            metadata: { type: 'product', productId: product.id, ...product }
          });
        });

        console.log(`Imported ${products.length} products from Shopify`);
      } catch (error) {
        console.error('Shopify import failed:', error);
      }
    },

    exportToFacebookAds: async (elements: any[], campaignId: string) => {
      const productElements = elements.filter(el => el.metadata?.type === 'product');

      try {
        const response = await fetch('/api/integrations/facebook-ads/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: productElements, campaignId })
        });

        const result = await response.json();
        console.log('Facebook Ads export result:', result);
      } catch (error) {
        console.error('Facebook Ads export failed:', error);
      }
    },

    startDailyBriefing: async () => {
      // Start audio briefing
      console.log('Starting daily briefing...');
      // Implementation would integrate with your existing briefing system
    }
  };

  return (
    <HelloConvoContext.Provider value={contextValue}>
      {children}
    </HelloConvoContext.Provider>
  );
};
```

### 3. Board Canvas Route

```typescript
// app/board/[boardId]/canvas/page.tsx
import { DerivativeCanvasLayout } from '@derivative-canvas/core';
import { BoardDetails } from '@/components/boards/BoardDetails';
import { useHelloConvo } from '@/components/derivative-canvas/HelloConvoProvider';

interface BoardCanvasPageProps {
  params: { boardId: string };
}

export default function BoardCanvasPage({ params }: BoardCanvasPageProps) {
  const { summonAgent, importFromShopify, exportToFacebookAds } = useHelloConvo();

  const handleViewToggle = (view: 'canvas' | 'traditional') => {
    // Analytics tracking
    analytics.track('board_view_changed', {
      boardId: params.boardId,
      view,
      timestamp: new Date().toISOString()
    });
  };

  const handleCanvasInteraction = async (action: string, data: any) => {
    switch (action) {
      case 'summon-agent':
        await summonAgent(data.agentType, {
          boardId: params.boardId,
          elements: data.elements
        });
        break;

      case 'import-shopify':
        await importFromShopify(data.storeUrl);
        break;

      case 'export-facebook-ads':
        await exportToFacebookAds(data.elements, data.campaignId);
        break;
    }
  };

  return (
    <DerivativeCanvasLayout
      layoutType="hybrid"
      canvasId={params.boardId}
      onViewToggle={handleViewToggle}
      showHeader={true}
      showToolbar={true}
      showSidebar={true}
      headerComponent={() => (
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-semibold">HelloConvo Board</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => handleCanvasInteraction('summon-agent', { agentType: 'daily-briefing' })}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Daily Briefing
            </button>
            <button
              onClick={() => handleCanvasInteraction('import-shopify', { storeUrl: 'https://mystore.myshopify.com' })}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Import Shopify
            </button>
          </div>
        </div>
      )}
    >
      {/* Traditional board view - shown when user toggles to traditional */}
      <BoardDetails boardId={params.boardId} />
    </DerivativeCanvasLayout>
  );
}
```

### 4. Agent Summon Plugin

```typescript
// components/derivative-canvas/AgentSummonPlugin.tsx
import type { DerivativeCanvasPlugin } from '@derivative-canvas/core';

export const AgentSummonPlugin: DerivativeCanvasPlugin = {
  id: 'agent-summon',
  name: 'AI Agent Summoner',
  version: '1.0.0',
  type: 'ai-chat',

  capabilities: {
    requiresAuth: true,
    requiresNetwork: true,
    permissions: ['canvas:read', 'canvas:write', 'ai-access']
  },

  ui: {
    toolbar: [AgentSummonButton],
    contextMenu: [
      {
        id: 'summon-daily-briefing',
        label: 'Daily Briefing Agent',
        onClick: (context) => {
          // Summon daily briefing agent
          context.framework.emit('agent:summon', {
            type: 'daily-briefing',
            position: { x: 100, y: 100 }
          });
        }
      },
      {
        id: 'summon-content-creator',
        label: 'Content Creator Agent',
        onClick: (context) => {
          // Summon content creation agent
          context.framework.emit('agent:summon', {
            type: 'content-creator',
            position: { x: 200, y: 100 }
          });
        }
      }
    ]
  },

  onElementsChange: (elements) => {
    // Check for agent elements and manage their state
    const agentElements = elements.filter(el => el.metadata?.type === 'agent');
    console.log('Active agents:', agentElements.length);
  },

  config: {
    maxConcurrentAgents: 3,
    agentTypes: ['daily-briefing', 'content-creator', 'shopify-manager', 'facebook-ads-specialist']
  }
};

const AgentSummonButton: React.FC = () => {
  return (
    <button
      className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
      title="Summon AI Agent"
    >
      🤖 Agents
    </button>
  );
};
```

### 5. Shopify Import Plugin

```typescript
// components/derivative-canvas/ShopifyImportPlugin.tsx
import type { DerivativeCanvasPlugin } from '@derivative-canvas/core';

export const ShopifyImportPlugin: DerivativeCanvasPlugin = {
  id: 'shopify-import',
  name: 'Shopify Importer',
  version: '1.0.0',
  type: 'integration',

  capabilities: {
    requiresAuth: true,
    requiresNetwork: true,
    permissions: ['canvas:write']
  },

  ui: {
    toolbar: [ShopifyImportButton],
    dialogs: [ShopifyImportDialog]
  },

  config: {
    supportedStoreTypes: ['shopify', 'shopify-plus'],
    maxProductsPerImport: 100,
    defaultCardLayout: 'grid'
  }
};

const ShopifyImportButton: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        title="Import from Shopify"
      >
        🛍️ Shopify
      </button>
      {showDialog && <ShopifyImportDialog onClose={() => setShowDialog(false)} />}
    </>
  );
};

const ShopifyImportDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [storeUrl, setStoreUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Import logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated import
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Import from Shopify</h3>
        <input
          type="url"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="https://yourstore.myshopify.com"
          className="w-full p-2 border rounded-md mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!storeUrl || isImporting}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🎯 Workflow Implementation

**The exact workflow you described in your transcript:**

1. **"Dump stuff onto a board"** → Drag & drop from Shopify import
2. **"Tag your agent"** → Right-click context menu to summon agents
3. **"Agent goes off, does the thing"** → AI processes canvas content
4. **"Back and forth with it"** → Real-time AI chat integration
5. **"Ship that off to Facebook"** → Export selected elements to Facebook Ads

## 🚀 Usage Example

```typescript
// This is the magic workflow in action:

// 1. User imports Shopify products
await importFromShopify('https://mystore.myshopify.com');

// 2. User selects products and summons agent
await summonAgent('content-creator', {
  selectedProducts: selectedElements,
  campaign: 'Summer Sale 2024'
});

// 3. AI generates content and updates canvas
// 4. User reviews, collaborates, makes changes

// 5. User exports to Facebook Ads
await exportToFacebookAds(finalElements, 'summer-campaign-2024');
```

This implementation brings your vision to life: **"The AI shows up where you're showing up"** - right on the canvas, ready to collaborate, organize, and ship your marketing content wherever it needs to go.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Rename framework to 'Derivative Canvas' and update all references", "status": "completed", "activeForm": "Renaming framework to 'Derivative Canvas' and updating all references"}]