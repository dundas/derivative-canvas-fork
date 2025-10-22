"use client";

import React, { useState } from 'react';
import type { ExcalidrawPlugin, PluginUIProps } from '../../core/types';

// AI Chat Plugin Implementation
export const AIChatPlugin: ExcalidrawPlugin = {
  id: 'ai-chat',
  name: 'AI Chat Assistant',
  version: '1.0.0',
  type: 'ai-chat',

  capabilities: {
    requiresAuth: true,
    requiresNetwork: true,
    permissions: ['canvas:read', 'canvas:write'],
  },

  ui: {
    sidebar: [AIChatSidebar],
    toolbar: [AIChatButton],
    dialogs: [AIChatDialog],
  },

  onElementsChange: (elements) => {
    // Update AI context when canvas changes
    console.log('AI Chat: Canvas elements changed', elements.length);
  },

  config: {
    aiProvider: 'openai',
    model: 'gpt-4',
    systemPrompt: 'You are an AI assistant helping with canvas design and drawing. Provide helpful suggestions and answer questions about the drawing.',
  },
}

// AI Chat Sidebar Component
function AIChatSidebar({ context, plugin }: PluginUIProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual AI integration)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiResponse = {
        role: 'assistant' as const,
        content: `I can help you with your canvas! I see you have ${context.canvas.elements.length} elements on the canvas. What would you like to know or do?`
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium">AI Assistant</h3>
        <p className="text-sm text-gray-500">Ask questions about your canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8">
            Start a conversation with your AI assistant
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-4'
                : 'bg-gray-100 mr-4'
            }`}
          >
            <div className="text-xs font-medium text-gray-600 mb-1">
              {message.role === 'user' ? 'You' : 'AI Assistant'}
            </div>
            <div className="text-sm">{message.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="bg-gray-100 mr-4 p-3 rounded-lg">
            <div className="text-xs font-medium text-gray-600 mb-1">AI Assistant</div>
            <div className="text-sm">Thinking...</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your canvas..."
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Chat Toolbar Button
function AIChatButton({ context }: PluginUIProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="p-2 bg-white rounded-md shadow-sm border hover:bg-gray-50"
      title="AI Chat Assistant"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  );
};

// AI Chat Dialog (for full-screen chat)
function AIChatDialog({ context, plugin }: PluginUIProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 h-96 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">AI Chat Assistant</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1">
          <AIChatSidebar context={context} plugin={plugin} />
        </div>
      </div>
    </div>
  );
};