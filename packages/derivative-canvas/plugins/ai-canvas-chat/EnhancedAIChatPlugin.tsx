"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { ExcalidrawPlugin, PluginUIProps } from '../../core/types';
import { AICanvasController } from '../../core/ai-interaction/AICanvasController';
import { ObjectManager } from '../../core/canvas-objects/ObjectManager';
import type { CanvasObjectType } from '../../core/canvas-objects/types';

/**
 * Enhanced AI Chat Plugin with Canvas Manipulation
 *
 * Features:
 * - Full canvas awareness and context
 * - Create/modify canvas objects
 * - Selection-based interactions
 * - Real-time collaboration
 */
export const EnhancedAIChatPlugin: ExcalidrawPlugin = {
  id: 'enhanced-ai-chat',
  name: 'AI Canvas Collaborator',
  version: '2.0.0',
  type: 'ai-chat',

  capabilities: {
    requiresAuth: true,
    requiresNetwork: true,
    permissions: ['canvas:read', 'canvas:write', 'ai-access'],
  },

  ui: {
    sidebar: [EnhancedAIChatSidebar],
    toolbar: [EnhancedAIChatButton],
    contextMenu: [
      {
        id: 'ask-ai-about-selection',
        label: 'Ask AI about selection',
        onClick: (context) => {
          // Trigger AI interaction with selected elements
          context.framework.emit('ai:analyze-selection', {
            selectedIds: context.canvas.appState.selectedElementIds || [],
          });
        },
        condition: (context) => {
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
      {
        id: 'ai-improve-selection',
        label: 'AI: Improve this',
        onClick: (context) => {
          context.framework.emit('ai:improve-selection', {
            selectedIds: context.canvas.appState.selectedElementIds || [],
          });
        },
        condition: (context) => {
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
    ],
  },

  onElementsChange: (elements) => {
    console.log('AI Chat: Canvas updated', elements.length, 'elements');
  },

  config: {
    aiProvider: 'openai',
    model: 'gpt-4',
    systemPrompt: `You are an AI assistant collaborating on a visual canvas. You can:
- See and understand all objects on the canvas
- Create new objects (VM windows, images, text, cards, etc.)
- Modify existing objects
- Work with user's selections
- Organize and group related items

When the user asks you to create something, use the available tools to add it to the canvas.
Be proactive and visual - show your work on the canvas!`,
  },
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  canvasActions?: CanvasAction[];
}

interface CanvasAction {
  type: 'create' | 'update' | 'delete';
  objectType?: CanvasObjectType;
  objectId?: string;
  description: string;
}

const EnhancedAIChatSidebar: React.FC<PluginUIProps> = ({ context, plugin }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiController, setAIController] = useState<AICanvasController | null>(null);
  const conversationId = useRef(`conv_${Date.now()}`).current;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize AI Canvas Controller
  useEffect(() => {
    const controller = new AICanvasController(
      context.framework,
      'enhanced-ai-chat',
      conversationId,
      new ObjectManager()
    );
    setAIController(controller);

    // Sync with canvas on mount
    controller.syncWithCanvas();

    // Add welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: `I'm your AI canvas collaborator! I can see everything on your canvas and help you create, organize, and work with objects.

What would you like to do together?

**Try asking me to:**
- "Create a VM window running 'npm test'"
- "Add a chat window to track our conversation"
- "Create cards for these product ideas: X, Y, Z"
- "Organize selected items into a grid"
- "Show me what's on the canvas"`,
        timestamp: new Date(),
      },
    ]);
  }, [context.framework]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !aiController) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get canvas context for AI
      const canvasContext = aiController.getCanvasContext();
      const selectedObjects = aiController.getSelectedObjects();

      // Simulate AI response with canvas manipulation
      // In production, this would call your AI API with canvas context
      const response = await simulateAIResponse(
        input,
        canvasContext,
        selectedObjects,
        aiController
      );

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-semibold text-gray-800">AI Canvas Collaborator</h3>
        <p className="text-xs text-gray-600 mt-1">
          {context.canvas.elements.length} objects on canvas
          {aiController && (
            <> • {aiController.getCanvasContext().aiGeneratedCount} AI-created</>
          )}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === 'user'
                ? 'ml-8'
                : message.role === 'system'
                ? 'mx-2'
                : 'mr-8'
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'system'
                  ? 'bg-gray-100 text-gray-700 text-sm'
                  : 'bg-purple-50 text-gray-800'
              }`}
            >
              <div className="text-xs font-medium mb-1 opacity-70">
                {message.role === 'user'
                  ? 'You'
                  : message.role === 'system'
                  ? 'System'
                  : 'AI Assistant'}
              </div>
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>

              {/* Canvas Actions */}
              {message.canvasActions && message.canvasActions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <div className="text-xs font-medium mb-1">Canvas Actions:</div>
                  {message.canvasActions.map((action, idx) => (
                    <div key={idx} className="text-xs opacity-75">
                      • {action.description}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mr-8">
            <div className="bg-purple-50 text-gray-800 p-3 rounded-lg">
              <div className="text-xs font-medium mb-1">AI Assistant</div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="animate-pulse">Thinking...</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me to create something on the canvas..."
            className="flex-1 px-3 py-2 border rounded-md text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md text-sm font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-1">
          {[
            'Show canvas summary',
            'Create VM window',
            'Add chat window',
            'Create image card',
          ].map((action) => (
            <button
              key={action}
              onClick={() => setInput(action)}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
              disabled={isLoading}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const EnhancedAIChatButton: React.FC<PluginUIProps> = () => {
  return (
    <button
      className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md shadow-sm hover:from-blue-600 hover:to-purple-600 transition-all"
      title="AI Canvas Collaborator"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <span className="text-sm font-medium">AI</span>
    </button>
  );
};

/**
 * Simulate AI response with canvas manipulation
 * In production, this would call your actual AI API
 */
async function simulateAIResponse(
  userInput: string,
  canvasContext: any,
  selectedObjects: any[],
  aiController: AICanvasController
): Promise<Message> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const actions: CanvasAction[] = [];
  let responseText = '';

  const lowerInput = userInput.toLowerCase();

  // Canvas summary
  if (lowerInput.includes('summary') || lowerInput.includes('what') || lowerInput.includes('show')) {
    responseText = `Here's what I see on your canvas:

📊 **Canvas Overview:**
- Total objects: ${canvasContext.totalElements}
- Canvas-specific objects: ${canvasContext.canvasObjects.length}
- AI-generated: ${canvasContext.aiGeneratedCount}
- Currently selected: ${canvasContext.selectedElementIds.length}

${canvasContext.canvasObjects.length > 0 ? `\n**Object Types:**\n${
  Array.from(new Set(canvasContext.canvasObjects.map((o: any) => o.type)))
    .map((type) => `- ${type}: ${canvasContext.canvasObjects.filter((o: any) => o.type === type).length}`)
    .join('\n')
}` : ''}

What would you like to do with these objects?`;
  }

  // Create VM window
  else if (lowerInput.includes('vm') || lowerInput.includes('terminal') || lowerInput.includes('command')) {
    const command = lowerInput.match(/['"](.+?)['"]/)?.[1] || 'npm test';
    const vmWindow = aiController.createVMWindow(command, [
      `$ ${command}`,
      'Initializing...',
    ]);

    actions.push({
      type: 'create',
      objectType: 'vm-window',
      objectId: vmWindow.id,
      description: `Created VM window running: ${command}`,
    });

    responseText = `I've created a VM window running \`${command}\`!

The window is now on your canvas. I'll update it as the command runs.`;
  }

  // Create chat window
  else if (lowerInput.includes('chat window')) {
    const chatWindow = aiController.createChatWindow([
      {
        id: '1',
        role: 'system',
        content: 'Chat window created!',
        timestamp: new Date(),
      },
    ]);

    actions.push({
      type: 'create',
      objectType: 'chat-window',
      objectId: chatWindow.id,
      description: 'Created chat window',
    });

    responseText = 'I've added a chat window to your canvas! You can use it to track our conversation visually.';
  }

  // Create image
  else if (lowerInput.includes('image') || lowerInput.includes('picture')) {
    const image = aiController.createImage(
      'https://via.placeholder.com/300x200',
      'AI-generated placeholder',
      { width: 300, height: 200 },
      undefined,
      true,
      userInput
    );

    actions.push({
      type: 'create',
      objectType: 'image',
      objectId: image.id,
      description: 'Created image placeholder',
    });

    responseText = `I've added an image to your canvas!

(In production, this would generate an actual image based on your request)`;
  }

  // Create cards
  else if (lowerInput.includes('card')) {
    const cardCount = 3;
    for (let i = 0; i < cardCount; i++) {
      const card = aiController.createCard(
        `Card ${i + 1}`,
        'AI-generated card with sample content',
        [
          { label: 'Status', value: 'Active' },
          { label: 'Priority', value: 'High' },
        ]
      );

      actions.push({
        type: 'create',
        objectType: 'card',
        objectId: card.id,
        description: `Created card: Card ${i + 1}`,
      });
    }

    responseText = `I've created ${cardCount} cards for you! They're automatically laid out on your canvas.`;
  }

  // Create text block
  else if (lowerInput.includes('text') || lowerInput.includes('note')) {
    const text = aiController.createTextBlock(
      'This is a text block created by AI!\n\nYou can put notes, ideas, or any content here.',
      'plain'
    );

    actions.push({
      type: 'create',
      objectType: 'text-block',
      objectId: text.id,
      description: 'Created text block',
    });

    responseText = 'I've added a text block to your canvas!';
  }

  // Create agent avatar
  else if (lowerInput.includes('agent') || lowerInput.includes('assistant')) {
    const agent = aiController.createAgentAvatar('AI Collaborator', userInput);

    actions.push({
      type: 'create',
      objectType: 'agent',
      objectId: agent.id,
      description: 'Created AI agent avatar',
    });

    responseText = `I've placed my avatar on the canvas! This represents me as an active collaborator on your board.`;
  }

  // Default helpful response
  else {
    responseText = `I can help you with that! Here's what I can do:

**Create Objects:**
- VM windows for coding (e.g., "create a VM running npm test")
- Chat windows to track conversations
- Images and visuals
- Cards for organizing ideas
- Text blocks for notes
- Agent avatars

**Work with Selections:**
- Analyze selected objects
- Improve or modify selections
- Group related items

What would you like me to create or help you with?`;
  }

  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: responseText,
    timestamp: new Date(),
    canvasActions: actions.length > 0 ? actions : undefined,
  };
}
