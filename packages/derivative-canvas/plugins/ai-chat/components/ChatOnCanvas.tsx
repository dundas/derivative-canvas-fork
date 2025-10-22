"use client";

import React, { useState, useEffect } from 'react';
import type { PluginUIProps } from '../../../core/types';
import type { Message } from '../services/aiService';
import { AIService } from '../services/aiService';
import { ElementFactory } from '../utils/elementFactory';

interface ChatOnCanvasProps extends PluginUIProps {
  onCreateElements?: (elements: any[]) => void;
  aiService?: AIService;
  showInput?: boolean;
}

/**
 * Chat component that renders messages as canvas elements (chat bubbles)
 */
export const ChatOnCanvas: React.FC<ChatOnCanvasProps> = ({
  context,
  plugin,
  onCreateElements,
  aiService: externalAiService,
  showInput = true,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiService] = useState(() => {
    if (externalAiService) return externalAiService;

    const config = plugin.config || {};
    return new AIService({
      provider: config.aiProvider || 'custom',
      apiKey: config.apiKey,
      model: config.model,
      apiEndpoint: config.apiEndpoint,
      systemPrompt: config.systemPrompt,
    });
  });

  const elementFactory = React.useRef(new ElementFactory({
    elements: context.canvas.elements,
    appState: context.canvas.appState,
  }));

  // Update context when canvas changes
  useEffect(() => {
    aiService.updateCanvasContext(context.canvas.elements, context.canvas.appState);
    elementFactory.current.updateContext({
      elements: context.canvas.elements,
      appState: context.canvas.appState,
    });
  }, [context.canvas.elements, context.canvas.appState, aiService]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !onCreateElements) return;

    setIsLoading(true);

    try {
      // Create user message bubble on canvas
      const userBubble = elementFactory.current.createChatBubble({
        message: input,
        role: 'user',
      });
      onCreateElements(userBubble);

      // Get AI response
      const response = await aiService.sendMessage(input);

      // Create AI response bubble on canvas
      const aiBubble = elementFactory.current.createChatBubble({
        message: response.message,
        role: 'assistant',
      }, {
        strategy: 'flow', // Place below user message
      });
      onCreateElements(aiBubble);

      // Execute any canvas actions from the AI
      if (response.actions) {
        const actionElements: any[] = [];

        for (const action of response.actions) {
          try {
            switch (action.type) {
              case 'create-code':
                const codeElements = elementFactory.current.createCodeBlock({
                  code: action.data.code,
                  language: action.data.language,
                  title: action.data.language,
                }, {
                  strategy: 'flow',
                });
                actionElements.push(...codeElements);
                break;

              case 'create-terminal':
                const terminalElements = elementFactory.current.createTerminalOutput({
                  output: action.data.output,
                  title: 'Terminal',
                }, {
                  strategy: 'flow',
                });
                actionElements.push(...terminalElements);
                break;

              case 'create-note':
                const noteElements = elementFactory.current.createNote({
                  text: action.data.text,
                  color: 'yellow',
                }, {
                  strategy: 'flow',
                });
                actionElements.push(...noteElements);
                break;
            }
          } catch (error) {
            console.error('Failed to create canvas element:', error);
          }
        }

        if (actionElements.length > 0) {
          onCreateElements(actionElements);
        }
      }

      setInput('');
    } catch (error) {
      console.error('Chat on canvas error:', error);

      // Show error bubble on canvas
      if (onCreateElements) {
        const errorBubble = elementFactory.current.createChatBubble({
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          role: 'assistant',
        }, {
          strategy: 'flow',
        });
        onCreateElements(errorBubble);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!showInput) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 flex items-center space-x-2 px-4 py-2 min-w-[400px] max-w-[600px]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Chat with AI on canvas..."
          className="flex-1 outline-none text-sm bg-transparent"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center space-x-1">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          ) : (
            'Send'
          )}
        </button>
      </div>
      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">
          Messages will appear as bubbles on canvas
        </p>
      </div>
    </div>
  );
};
