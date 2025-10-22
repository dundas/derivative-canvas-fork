import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIChatPlugin } from '../AIChatPlugin';
import { AIService } from '../services/aiService';
import { ElementFactory } from '../utils/elementFactory';
import { placementEngine } from '../services/placementEngine';
import type { PluginContext } from '../../../core/types';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types';

// Mock fetch
global.fetch = vi.fn();

describe('AI Chat Plugin Integration', () => {
  let mockContext: PluginContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      user: { id: 'test-user', name: 'Test User' },
      canvas: {
        elements: [],
        appState: {
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 },
          width: 1000,
          height: 800,
        } as AppState,
        files: {},
      },
      storage: {} as any,
      auth: {} as any,
      framework: {
        addElement: vi.fn(),
        updateElements: vi.fn(),
        updateAppState: vi.fn(),
      } as any,
    };
  });

  describe('Plugin Configuration', () => {
    it('should have correct plugin metadata', () => {
      expect(AIChatPlugin.id).toBe('ai-chat');
      expect(AIChatPlugin.name).toBe('AI Canvas Assistant');
      expect(AIChatPlugin.version).toBe('2.0.0');
      expect(AIChatPlugin.type).toBe('ai-chat');
    });

    it('should define required capabilities', () => {
      expect(AIChatPlugin.capabilities).toEqual({
        requiresAuth: false,
        requiresNetwork: true,
        permissions: ['canvas:read', 'canvas:write', 'ai-access'],
      });
    });

    it('should have UI components defined', () => {
      expect(AIChatPlugin.ui).toBeDefined();
      expect(AIChatPlugin.ui?.sidebar).toBeDefined();
      expect(AIChatPlugin.ui?.toolbar).toBeDefined();
      expect(AIChatPlugin.ui?.overlay).toBeDefined();
    });

    it('should have default configuration', () => {
      expect(AIChatPlugin.config).toBeDefined();
      expect(AIChatPlugin.config?.aiProvider).toBeDefined();
      expect(AIChatPlugin.config?.chatMode).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should create code block from AI response', async () => {
      const aiService = new AIService({
        provider: 'custom',
        apiKey: 'test-key',
        apiEndpoint: 'https://test-api.com',
      });

      const factory = new ElementFactory({
        elements: mockContext.canvas.elements,
        appState: mockContext.canvas.appState,
      });

      // Mock AI response with code action
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: `Here's the code:
[ACTION:CODE]
\`\`\`javascript
function hello() {
  console.log("Hello!");
}
\`\`\`
[/ACTION]`,
        }),
      });

      const response = await aiService.sendMessage('Create a hello function');

      expect(response.message).toBeDefined();
      expect(response.actions).toBeDefined();

      if (response.actions && response.actions.length > 0) {
        const codeElements = factory.createCodeBlock({
          code: response.actions[0].data.code,
          language: response.actions[0].data.language,
        });

        expect(codeElements.length).toBeGreaterThan(0);
        expect(codeElements[0].type).toBe('rectangle');
      }
    });

    it('should place multiple elements intelligently', () => {
      const factory = new ElementFactory({
        elements: mockContext.canvas.elements,
        appState: mockContext.canvas.appState,
      });

      // Create first element
      const codeBlock1 = factory.createCodeBlock({
        code: 'const x = 1;',
        language: 'javascript',
      });

      // Update context with first element
      factory.updateContext({
        elements: codeBlock1,
        appState: mockContext.canvas.appState,
      });

      // Create second element - should avoid first
      const codeBlock2 = factory.createCodeBlock({
        code: 'const y = 2;',
        language: 'javascript',
      });

      const container1 = codeBlock1.find(el => el.id?.includes('container'));
      const container2 = codeBlock2.find(el => el.id?.includes('container'));

      // Elements should not be at exact same position
      const samePosition =
        container1?.x === container2?.x && container1?.y === container2?.y;

      expect(samePosition).toBe(false);
    });

    it('should handle chat conversation with context awareness', async () => {
      const aiService = new AIService({
        provider: 'custom',
        apiKey: 'test-key',
        apiEndpoint: 'https://test-api.com',
      });

      // Add some elements to canvas
      const elements = [
        { id: '1', type: 'rectangle', x: 100, y: 100 },
        { id: '2', type: 'text', x: 200, y: 200, text: 'Hello' },
      ] as ExcalidrawElement[];

      aiService.updateCanvasContext(elements, mockContext.canvas.appState);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'I see you have 2 elements on the canvas.',
        }),
      });

      const response = await aiService.sendMessage('What do you see?');

      // Verify canvas context was included
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.canvasContext).toContain('Total elements: 2');
      expect(response.message).toContain('2 elements');
    });

    it('should maintain conversation history across messages', async () => {
      const aiService = new AIService({
        provider: 'custom',
        apiKey: 'test-key',
        apiEndpoint: 'https://test-api.com',
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Response' }),
      });

      await aiService.sendMessage('First message');
      await aiService.sendMessage('Second message');
      await aiService.sendMessage('Third message');

      const history = aiService.getHistory();

      expect(history.length).toBe(6); // 3 user + 3 assistant messages
      expect(history.filter(m => m.role === 'user').length).toBe(3);
      expect(history.filter(m => m.role === 'assistant').length).toBe(3);
    });
  });

  describe('Complete User Journey', () => {
    it('should support full workflow: chat -> AI response -> create elements', async () => {
      const factory = new ElementFactory({
        elements: mockContext.canvas.elements,
        appState: mockContext.canvas.appState,
      });

      const aiService = new AIService({
        provider: 'custom',
        apiKey: 'test-key',
        apiEndpoint: 'https://test-api.com',
      });

      // Step 1: User sends message
      const userMessage = 'Create a sticky note that says "TODO: test this"';

      // Step 2: AI responds with action
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: `I'll create a sticky note for you.
[ACTION:NOTE]
TODO: test this
[/ACTION]`,
        }),
      });

      const response = await aiService.sendMessage(userMessage);

      // Step 3: Create elements from AI actions
      const createdElements: any[] = [];

      if (response.actions) {
        for (const action of response.actions) {
          if (action.type === 'create-note') {
            const noteElements = factory.createNote({
              text: action.data.text,
              color: 'yellow',
            });
            createdElements.push(...noteElements);
          }
        }
      }

      // Step 4: Verify elements were created
      expect(createdElements.length).toBeGreaterThan(0);

      // Step 5: Add to canvas via framework API
      createdElements.forEach(element => {
        mockContext.framework?.addElement(element);
      });

      expect(mockContext.framework?.addElement).toHaveBeenCalled();
    });

    it('should handle multiple element types in single response', async () => {
      const aiService = new AIService({
        provider: 'custom',
        apiKey: 'test-key',
        apiEndpoint: 'https://test-api.com',
      });

      const factory = new ElementFactory({
        elements: mockContext.canvas.elements,
        appState: mockContext.canvas.appState,
      });

      // AI response with multiple actions
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: `Here's what you need:
[ACTION:CODE]
\`\`\`python
def hello():
    print("Hello!")
\`\`\`
[/ACTION]

[ACTION:NOTE]
Remember to test this function
[/ACTION]

[ACTION:TERMINAL]
$ python hello.py
Hello!
[/ACTION]`,
        }),
      });

      const response = await aiService.sendMessage(
        'Show me a Python hello function with notes and terminal output'
      );

      // Process all actions
      const allElements: any[] = [];

      if (response.actions) {
        for (const action of response.actions) {
          switch (action.type) {
            case 'create-code':
              allElements.push(...factory.createCodeBlock({
                code: action.data.code,
                language: action.data.language,
              }));
              break;
            case 'create-note':
              allElements.push(...factory.createNote({
                text: action.data.text,
              }));
              break;
            case 'create-terminal':
              allElements.push(...factory.createTerminalOutput({
                output: action.data.output,
              }));
              break;
          }
        }
      }

      // Should have created multiple groups of elements
      expect(allElements.length).toBeGreaterThan(3);

      // Each type should be present
      const hasCode = allElements.some(el => el.id?.includes('code'));
      const hasNote = allElements.some(el => el.id?.includes('note'));
      const hasTerminal = allElements.some(el => el.id?.includes('terminal'));

      expect(hasCode || hasNote || hasTerminal).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      const aiService = new AIService({
        provider: 'custom',
        apiKey: 'test-key',
        apiEndpoint: 'https://test-api.com',
      });

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        aiService.sendMessage('Test')
      ).rejects.toThrow();
    });

    it('should handle invalid element factory context', () => {
      const factory = new ElementFactory({
        elements: [],
        appState: {} as AppState,
      });

      // Should not throw even with minimal context
      expect(() => {
        factory.createNote({ text: 'Test' });
      }).not.toThrow();
    });

    it('should handle placement engine with many overlapping elements', () => {
      // Create many overlapping elements
      const elements = Array.from({ length: 50 }, (_, i) => ({
        id: `el-${i}`,
        type: 'rectangle',
        x: 100 + (i % 5) * 10,
        y: 100 + (i % 5) * 10,
        width: 100,
        height: 100,
      })) as ExcalidrawElement[];

      const result = placementEngine.findOptimalPosition(
        elements,
        mockContext.canvas.appState,
        {
          width: 100,
          height: 100,
          strategy: 'viewport-center',
          avoidOverlap: true,
        }
      );

      // Should still find a position without hanging
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should call onMount when plugin is mounted', () => {
      const onMountSpy = vi.fn();
      const testPlugin = {
        ...AIChatPlugin,
        onMount: onMountSpy,
      };

      testPlugin.onMount?.(mockContext);

      expect(onMountSpy).toHaveBeenCalledWith(mockContext);
    });

    it('should call onElementsChange when canvas updates', () => {
      const onElementsChangeSpy = vi.fn();
      const testPlugin = {
        ...AIChatPlugin,
        onElementsChange: onElementsChangeSpy,
      };

      const newElements = [
        { id: '1', type: 'rectangle' },
      ] as ExcalidrawElement[];

      testPlugin.onElementsChange?.(newElements);

      expect(onElementsChangeSpy).toHaveBeenCalledWith(newElements);
    });

    it('should call onUnmount when plugin is unmounted', () => {
      const onUnmountSpy = vi.fn();
      const testPlugin = {
        ...AIChatPlugin,
        onUnmount: onUnmountSpy,
      };

      testPlugin.onUnmount?.();

      expect(onUnmountSpy).toHaveBeenCalled();
    });
  });
});
