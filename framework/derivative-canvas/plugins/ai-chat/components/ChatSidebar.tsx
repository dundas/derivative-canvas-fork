"use client";

import React, { useState, useRef, useEffect } from "react";

import { AIService } from "../services/aiService";

import { ElementFactory } from "../utils/elementFactory";

import type { PluginUIProps } from "../../../core/types";
import type { Message, CanvasAction } from "../services/aiService";

interface ChatSidebarProps extends PluginUIProps {
  onCreateElements?: (elements: any[]) => void;
  aiService?: AIService;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  context,
  plugin,
  onCreateElements,
  aiService: externalAiService,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiService] = useState(() => {
    if (externalAiService) {
      return externalAiService;
    }

    // Initialize with config from plugin
    const config = plugin.config || {};
    return new AIService({
      provider: config.aiProvider || "custom",
      apiKey: config.apiKey,
      model: config.model,
      apiEndpoint: config.apiEndpoint,
      systemPrompt: config.systemPrompt,
    });
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const elementFactory = useRef(
    new ElementFactory({
      elements: context.canvas.elements,
      appState: context.canvas.appState,
    }),
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update AI service with canvas context
  useEffect(() => {
    aiService.updateCanvasContext(
      context.canvas.elements,
      context.canvas.appState,
    );
    elementFactory.current.updateContext({
      elements: context.canvas.elements,
      appState: context.canvas.appState,
    });
  }, [context.canvas.elements, context.canvas.appState, aiService]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage(input);

      // Add AI response to messages
      const aiMessage: Message = {
        role: "assistant",
        content: response.message,
        timestamp: Date.now(),
        metadata: { actions: response.actions },
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Execute canvas actions if any
      if (response.actions && onCreateElements) {
        executeCanvasActions(response.actions);
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCanvasActions = (actions: CanvasAction[]) => {
    const newElements: any[] = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case "create-code":
            const codeElements = elementFactory.current.createCodeBlock({
              code: action.data.code,
              language: action.data.language,
              title: action.data.language
                ? `${action.data.language} Code`
                : "Code",
            });
            newElements.push(...codeElements);
            break;

          case "create-terminal":
            const terminalElements =
              elementFactory.current.createTerminalOutput({
                output: action.data.output,
                title: "Terminal Output",
              });
            newElements.push(...terminalElements);
            break;

          case "create-note":
            const noteElements = elementFactory.current.createNote({
              text: action.data.text,
              color: "yellow",
            });
            newElements.push(...noteElements);
            break;

          case "create-document":
            const docElements =
              elementFactory.current.createDocumentPlaceholder(
                action.data.title || "Document",
                action.data.type || "file",
              );
            newElements.push(...docElements);
            break;
        }
      } catch (error) {
        console.error("Failed to create element:", error);
      }
    }

    if (newElements.length > 0 && onCreateElements) {
      onCreateElements(newElements);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    aiService.clearHistory();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">AI Canvas Assistant</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Chat and create on canvas
          </p>
        </div>
        <button
          onClick={clearChat}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          title="Clear chat history"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Start a conversation
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Ask me to create code snippets, diagrams, notes, or help you with
              your canvas
            </p>
            <div className="mt-4 space-y-2 text-xs text-gray-400">
              <p>Try: "Create a Python function to sort a list"</p>
              <p>Try: "Add a sticky note with my ideas"</p>
              <p>Try: "Show me terminal output example"</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="text-xs opacity-70 mb-1">
                {message.role === "user" ? "You" : "AI Assistant"}
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
              {message.metadata?.actions && (
                <div className="mt-2 text-xs opacity-80 border-t border-white/20 pt-2">
                  ✓ Created {message.metadata.actions.length} canvas element(s)
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-[85%]">
              <div className="text-xs opacity-70 mb-1">AI Assistant</div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI to create something on canvas..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
