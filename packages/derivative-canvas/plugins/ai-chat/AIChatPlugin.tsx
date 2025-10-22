"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { ExcalidrawPlugin, PluginUIProps, PluginContext } from '../../core/types';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatOnCanvas } from './components/ChatOnCanvas';
import { AIService } from './services/aiService';
import { addElementsToCanvas } from './utils/canvasHelpers';

/**
 * Enhanced AI Chat Plugin with Canvas Integration
 *
 * Features:
 * - Intelligent AI assistant with canvas awareness
 * - Create code blocks, terminals, notes, and documents on canvas
 * - Chat in sidebar OR directly on canvas as bubbles
 * - Smart element placement with collision avoidance
 * - Bidirectional canvas interaction
 */
export const AIChatPlugin: ExcalidrawPlugin = {
  id: 'ai-chat',
  name: 'AI Canvas Assistant',
  version: '2.0.0',
  type: 'ai-chat',

  capabilities: {
    requiresAuth: false, // Can work without auth
    requiresNetwork: true, // Needs network for AI API calls
    permissions: ['canvas:read', 'canvas:write', 'ai-access'],
  },

  ui: {
    sidebar: [EnhancedAIChatSidebar],
    toolbar: [AIChatToolbarButton],
    overlay: [ChatOnCanvasOverlay],
  },

  onElementsChange: (elements) => {
    // AI context updates happen automatically in the components
    console.log(`[AI Chat Plugin] Canvas updated: ${elements.length} elements`);
  },

  onMount: (context: PluginContext) => {
    console.log('[AI Chat Plugin] Mounted successfully');
    console.log(`[AI Chat Plugin] Canvas has ${context.canvas.elements.length} elements`);
  },

  onUnmount: () => {
    console.log('[AI Chat Plugin] Unmounted');
  },

  // Default configuration
  config: {
    // AI Provider: 'anthropic', 'openai', or 'custom'
    aiProvider: 'anthropic',

    // API Configuration
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    model: 'claude-3-5-sonnet-20241022', // or 'gpt-4' for OpenAI
    apiEndpoint: undefined, // Optional custom endpoint

    // Chat Mode: 'sidebar' or 'canvas'
    chatMode: 'sidebar',

    // System Prompt
    systemPrompt: `You are an AI assistant integrated into an infinite canvas drawing application (Excalidraw).
You can help users create, modify, and organize visual elements on their canvas.

Your capabilities:
- Create code blocks with syntax highlighting
- Generate terminal output displays
- Add sticky notes and text elements
- Create document placeholders
- Provide design and layout suggestions

When creating canvas elements, use these markers:
[ACTION:CODE]
\`\`\`language
code here
\`\`\`
[/ACTION]

[ACTION:TERMINAL]
terminal output
[/ACTION]

[ACTION:NOTE]
note text
[/ACTION]

Be helpful, creative, and proactive!`,
  },

  defaultConfig: {
    aiProvider: 'custom',
    chatMode: 'sidebar',
  },
};

/**
 * Enhanced AI Chat Sidebar with full functionality
 */
const EnhancedAIChatSidebar: React.FC<PluginUIProps> = ({ context, plugin }) => {
  const aiServiceRef = useRef<AIService | null>(null);

  // Initialize AI service
  useEffect(() => {
    if (!aiServiceRef.current) {
      const config = plugin.config || {};
      aiServiceRef.current = new AIService({
        provider: config.aiProvider || 'custom',
        apiKey: config.apiKey,
        model: config.model,
        apiEndpoint: config.apiEndpoint,
        systemPrompt: config.systemPrompt,
      });
    }
  }, [plugin.config]);

  const handleCreateElements = (elements: any[]) => {
    if (context.framework) {
      addElementsToCanvas(context.framework, elements);
    }
  };

  return (
    <ChatSidebar
      context={context}
      plugin={plugin}
      onCreateElements={handleCreateElements}
      aiService={aiServiceRef.current || undefined}
    />
  );
};

/**
 * Toolbar button to toggle chat
 */
const AIChatToolbarButton: React.FC<PluginUIProps> = ({ context, plugin }) => {
  const [chatMode, setChatMode] = useState<'sidebar' | 'canvas' | 'hidden'>(
    plugin.config?.chatMode || 'sidebar'
  );

  const toggleChatMode = () => {
    const modes: Array<'sidebar' | 'canvas' | 'hidden'> = ['sidebar', 'canvas', 'hidden'];
    const currentIndex = modes.indexOf(chatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setChatMode(nextMode);

    // Update app state to show/hide sidebar
    if (context.framework) {
      context.framework.updateAppState({
        openSidebar: nextMode === 'sidebar' ? { name: 'ai-chat' } : null,
      });
    }
  };

  const getIcon = () => {
    switch (chatMode) {
      case 'sidebar':
        return '💬'; // Chat in sidebar
      case 'canvas':
        return '🎨'; // Chat on canvas
      case 'hidden':
        return '👁️'; // Hidden
      default:
        return '💬';
    }
  };

  const getTitle = () => {
    switch (chatMode) {
      case 'sidebar':
        return 'AI Chat (Sidebar) - Click to switch to Canvas mode';
      case 'canvas':
        return 'AI Chat (Canvas) - Click to hide';
      case 'hidden':
        return 'AI Chat (Hidden) - Click to show in Sidebar';
      default:
        return 'AI Chat Assistant';
    }
  };

  return (
    <button
      onClick={toggleChatMode}
      className="p-2 bg-white rounded-md shadow-sm border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
      title={getTitle()}
    >
      <div className="flex items-center space-x-1">
        <span className="text-lg">{getIcon()}</span>
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
    </button>
  );
};

/**
 * Chat on Canvas overlay component
 */
const ChatOnCanvasOverlay: React.FC<PluginUIProps> = ({ context, plugin }) => {
  const [isCanvasMode, setIsCanvasMode] = useState(
    plugin.config?.chatMode === 'canvas'
  );
  const aiServiceRef = useRef<AIService | null>(null);

  // Initialize AI service
  useEffect(() => {
    if (!aiServiceRef.current) {
      const config = plugin.config || {};
      aiServiceRef.current = new AIService({
        provider: config.aiProvider || 'custom',
        apiKey: config.apiKey,
        model: config.model,
        apiEndpoint: config.apiEndpoint,
        systemPrompt: config.systemPrompt,
      });
    }
  }, [plugin.config]);

  const handleCreateElements = (elements: any[]) => {
    if (context.framework) {
      addElementsToCanvas(context.framework, elements);
    }
  };

  // Listen for mode changes (this would need to be wired up properly)
  useEffect(() => {
    // Check if canvas mode is enabled
    const mode = plugin.config?.chatMode || 'sidebar';
    setIsCanvasMode(mode === 'canvas');
  }, [plugin.config]);

  if (!isCanvasMode) {
    return null;
  }

  return (
    <ChatOnCanvas
      context={context}
      plugin={plugin}
      onCreateElements={handleCreateElements}
      aiService={aiServiceRef.current || undefined}
      showInput={true}
    />
  );
};

// Export components for external use
export { ChatSidebar, ChatOnCanvas };
export { AIService } from './services/aiService';
export { ElementFactory } from './utils/elementFactory';
export { placementEngine } from './services/placementEngine';
export * from './utils/canvasHelpers';
