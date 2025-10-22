import type { ExcalidrawElement, AppState } from "@excalidraw/excalidraw/types";

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface CanvasAction {
  type: 'create-element' | 'create-code' | 'create-terminal' | 'create-document' | 'create-note' | 'create-diagram';
  data: any;
}

export interface AIResponse {
  message: string;
  actions?: CanvasAction[];
  thinking?: string;
}

export interface AIServiceConfig {
  provider: 'anthropic' | 'openai' | 'custom';
  apiKey?: string;
  model?: string;
  apiEndpoint?: string;
  systemPrompt?: string;
}

export class AIService {
  private config: AIServiceConfig;
  private conversationHistory: Message[] = [];
  private canvasContext: {
    elements: readonly ExcalidrawElement[];
    appState: AppState;
  } | null = null;

  constructor(config: AIServiceConfig) {
    this.config = {
      model: config.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4',
      systemPrompt: this.getDefaultSystemPrompt(),
      ...config,
    };
  }

  /**
   * Update canvas context for AI awareness
   */
  updateCanvasContext(elements: readonly ExcalidrawElement[], appState: AppState): void {
    this.canvasContext = { elements, appState };
  }

  /**
   * Send a message to the AI and get response
   */
  async sendMessage(userMessage: string): Promise<AIResponse> {
    // Add user message to history
    const message: Message = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    this.conversationHistory.push(message);

    // Get canvas context summary
    const canvasSummary = this.getCanvasSummary();

    try {
      let response: AIResponse;

      switch (this.config.provider) {
        case 'anthropic':
          response = await this.sendToAnthropic(userMessage, canvasSummary);
          break;
        case 'openai':
          response = await this.sendToOpenAI(userMessage, canvasSummary);
          break;
        case 'custom':
          response = await this.sendToCustomEndpoint(userMessage, canvasSummary);
          break;
        default:
          throw new Error(`Unknown AI provider: ${this.config.provider}`);
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        metadata: { actions: response.actions },
      });

      return response;
    } catch (error) {
      console.error('AI Service error:', error);
      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send request to Anthropic Claude API
   */
  private async sendToAnthropic(userMessage: string, canvasSummary: string): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const endpoint = this.config.apiEndpoint || 'https://api.anthropic.com/v1/messages';

    const messages = [
      ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user' as const,
        content: `${canvasSummary}\n\nUser message: ${userMessage}`,
      },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        system: this.config.systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    return this.parseAIResponse(content);
  }

  /**
   * Send request to OpenAI API
   */
  private async sendToOpenAI(userMessage: string, canvasSummary: string): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const endpoint = this.config.apiEndpoint || 'https://api.openai.com/v1/chat/completions';

    const messages = [
      { role: 'system' as const, content: this.config.systemPrompt || '' },
      ...this.conversationHistory.slice(-10),
      {
        role: 'user' as const,
        content: `${canvasSummary}\n\nUser message: ${userMessage}`,
      },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return this.parseAIResponse(content);
  }

  /**
   * Send request to custom endpoint
   */
  private async sendToCustomEndpoint(userMessage: string, canvasSummary: string): Promise<AIResponse> {
    if (!this.config.apiEndpoint) {
      throw new Error('Custom API endpoint not configured');
    }

    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        message: userMessage,
        canvasContext: canvasSummary,
        history: this.conversationHistory.slice(-10),
      }),
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Parse AI response and extract canvas actions
   */
  private parseAIResponse(content: string): AIResponse {
    const actions: CanvasAction[] = [];
    let message = content;

    // Look for action markers in the response
    const actionRegex = /\[ACTION:(.*?)\](.*?)\[\/ACTION\]/gs;
    const matches = content.matchAll(actionRegex);

    for (const match of matches) {
      const actionType = match[1].trim();
      const actionData = match[2].trim();

      // Remove action markers from message
      message = message.replace(match[0], '');

      // Parse action based on type
      try {
        switch (actionType) {
          case 'CODE':
            actions.push({
              type: 'create-code',
              data: this.parseCodeAction(actionData),
            });
            break;
          case 'TERMINAL':
            actions.push({
              type: 'create-terminal',
              data: { output: actionData },
            });
            break;
          case 'NOTE':
            actions.push({
              type: 'create-note',
              data: { text: actionData },
            });
            break;
          case 'DIAGRAM':
            actions.push({
              type: 'create-diagram',
              data: { description: actionData },
            });
            break;
        }
      } catch (error) {
        console.error('Failed to parse action:', error);
      }
    }

    return {
      message: message.trim(),
      actions: actions.length > 0 ? actions : undefined,
    };
  }

  /**
   * Parse code block action
   */
  private parseCodeAction(content: string): { language: string; code: string } {
    // Try to extract language from markdown code fence
    const codeBlockRegex = /```(\w+)?\n(.*?)```/s;
    const match = content.match(codeBlockRegex);

    if (match) {
      return {
        language: match[1] || 'text',
        code: match[2].trim(),
      };
    }

    return {
      language: 'text',
      code: content.trim(),
    };
  }

  /**
   * Get summary of current canvas state
   */
  private getCanvasSummary(): string {
    if (!this.canvasContext) {
      return 'Canvas context: Empty canvas';
    }

    const { elements } = this.canvasContext;

    // Count element types
    const elementCounts: Record<string, number> = {};
    for (const element of elements) {
      const type = element.type;
      elementCounts[type] = (elementCounts[type] || 0) + 1;
    }

    // Build summary
    const summary = [
      `Canvas context: ${elements.length} total elements`,
      ...Object.entries(elementCounts).map(([type, count]) => `- ${count} ${type} element(s)`),
    ].join('\n');

    return summary;
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are an AI assistant integrated into an infinite canvas drawing application (Excalidraw).
You can help users create, modify, and organize visual elements on their canvas.

Your capabilities include:
- Answering questions about the canvas and its elements
- Creating various types of content on the canvas (code snippets, notes, diagrams, terminal outputs)
- Providing suggestions for layout and organization
- Helping with design and visualization tasks

When you want to create something on the canvas, use these action markers:

[ACTION:CODE]
\`\`\`language
code here
\`\`\`
[/ACTION]

[ACTION:TERMINAL]
terminal output here
[/ACTION]

[ACTION:NOTE]
note text here
[/ACTION]

[ACTION:DIAGRAM]
description of diagram to create
[/ACTION]

Be helpful, creative, and proactive in suggesting ways to visualize ideas on the canvas.
Keep responses concise but informative.`;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Set custom system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.config.systemPrompt = prompt;
  }
}
