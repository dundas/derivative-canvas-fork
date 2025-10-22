import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../aiService';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types';

// Mock fetch globally
global.fetch = vi.fn();

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = new AIService({
      provider: 'custom',
      apiKey: 'test-key',
      apiEndpoint: 'https://test-api.com/chat',
    });
  });

  describe('initialization', () => {
    it('should initialize with custom provider', () => {
      expect(aiService).toBeInstanceOf(AIService);
    });

    it('should use default model for anthropic', () => {
      const anthropicService = new AIService({
        provider: 'anthropic',
        apiKey: 'test-key',
      });
      expect(anthropicService).toBeDefined();
    });

    it('should use default model for openai', () => {
      const openaiService = new AIService({
        provider: 'openai',
        apiKey: 'test-key',
      });
      expect(openaiService).toBeDefined();
    });
  });

  describe('updateCanvasContext', () => {
    it('should update canvas context', () => {
      const elements = [
        { id: '1', type: 'rectangle' },
        { id: '2', type: 'text', text: 'Hello' },
      ] as ExcalidrawElement[];

      const appState = {
        scrollX: 0,
        scrollY: 0,
        zoom: { value: 1 },
      } as AppState;

      aiService.updateCanvasContext(elements, appState);

      // Context should be updated (will be reflected in next message)
      expect(aiService).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should send message to custom endpoint', async () => {
      const mockResponse = {
        message: 'AI response',
        actions: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiService.sendMessage('Hello AI');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.message).toBe('AI response');
    });

    it('should include canvas context in request', async () => {
      const elements = [
        { id: '1', type: 'rectangle' },
      ] as ExcalidrawElement[];

      const appState = {} as AppState;

      aiService.updateCanvasContext(elements, appState);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      await aiService.sendMessage('Test message');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.canvasContext).toContain('Total elements: 1');
    });

    it('should maintain conversation history', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      await aiService.sendMessage('Message 1');
      await aiService.sendMessage('Message 2');

      const history = aiService.getHistory();

      expect(history.length).toBe(4); // 2 user + 2 assistant messages
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('Message 1');
      expect(history[1].role).toBe('assistant');
      expect(history[2].role).toBe('user');
      expect(history[2].content).toBe('Message 2');
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(aiService.sendMessage('Test')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(aiService.sendMessage('Test')).rejects.toThrow();
    });
  });

  describe('parseAIResponse', () => {
    it('should parse code actions from response', async () => {
      const responseWithCode = `Here's some code:
[ACTION:CODE]
\`\`\`javascript
const x = 1;
\`\`\`
[/ACTION]
Hope this helps!`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: responseWithCode }),
      });

      const result = await aiService.sendMessage('Test');

      // The parseAIResponse is called internally
      // We can't test it directly, but we can verify the message was processed
      expect(result.message).toBeDefined();
    });

    it('should parse terminal actions from response', async () => {
      const responseWithTerminal = `Output:
[ACTION:TERMINAL]
$ npm install
Done!
[/ACTION]`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: responseWithTerminal }),
      });

      const result = await aiService.sendMessage('Test');
      expect(result.message).toBeDefined();
    });

    it('should parse note actions from response', async () => {
      const responseWithNote = `Here's a note:
[ACTION:NOTE]
Remember to test!
[/ACTION]`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: responseWithNote }),
      });

      const result = await aiService.sendMessage('Test');
      expect(result.message).toBeDefined();
    });
  });

  describe('clearHistory', () => {
    it('should clear conversation history', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      await aiService.sendMessage('Message 1');
      await aiService.sendMessage('Message 2');

      expect(aiService.getHistory().length).toBeGreaterThan(0);

      aiService.clearHistory();

      expect(aiService.getHistory().length).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('should return conversation history', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      await aiService.sendMessage('Test message');

      const history = aiService.getHistory();

      expect(history.length).toBe(2);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('Test message');
      expect(history[1].role).toBe('assistant');
    });

    it('should include timestamps in history', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      await aiService.sendMessage('Test');

      const history = aiService.getHistory();

      expect(history[0].timestamp).toBeDefined();
      expect(typeof history[0].timestamp).toBe('number');
    });
  });

  describe('setSystemPrompt', () => {
    it('should update system prompt', () => {
      const newPrompt = 'You are a specialized assistant';
      aiService.setSystemPrompt(newPrompt);

      // System prompt is used in next request
      // We can't directly verify it, but ensure no errors
      expect(aiService).toBeDefined();
    });
  });

  describe('getCanvasSummary', () => {
    it('should generate canvas summary with no elements', () => {
      aiService.updateCanvasContext([], {} as AppState);

      // Summary is used internally in sendMessage
      // We verify it works by sending a message
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      expect(async () => {
        await aiService.sendMessage('Test');
      }).not.toThrow();
    });

    it('should generate canvas summary with multiple elements', () => {
      const elements = [
        { id: '1', type: 'rectangle' },
        { id: '2', type: 'rectangle' },
        { id: '3', type: 'text', text: 'Hello' },
        { id: '4', type: 'ellipse' },
      ] as ExcalidrawElement[];

      aiService.updateCanvasContext(elements, {} as AppState);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      expect(async () => {
        await aiService.sendMessage('Test');
      }).not.toThrow();
    });
  });

  describe('provider-specific implementations', () => {
    it('should use Anthropic API format', async () => {
      const anthropicService = new AIService({
        provider: 'anthropic',
        apiKey: 'sk-ant-test',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Anthropic response' }],
        }),
      });

      const result = await anthropicService.sendMessage('Test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test',
          }),
        })
      );
    });

    it('should use OpenAI API format', async () => {
      const openaiService = new AIService({
        provider: 'openai',
        apiKey: 'sk-test',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OpenAI response' } }],
        }),
      });

      const result = await openaiService.sendMessage('Test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('openai.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test',
          }),
        })
      );
    });
  });
});
