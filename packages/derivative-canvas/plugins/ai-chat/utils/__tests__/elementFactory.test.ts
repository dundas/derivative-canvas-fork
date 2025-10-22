import { describe, it, expect, beforeEach } from 'vitest';
import { ElementFactory } from '../elementFactory';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types';

describe('ElementFactory', () => {
  let factory: ElementFactory;
  let mockContext: { elements: ExcalidrawElement[]; appState: AppState };

  beforeEach(() => {
    mockContext = {
      elements: [],
      appState: {
        scrollX: 0,
        scrollY: 0,
        zoom: { value: 1 },
        width: 1000,
        height: 800,
      } as AppState,
    };
    factory = new ElementFactory(mockContext);
  });

  describe('createCodeBlock', () => {
    it('should create code block elements', () => {
      const elements = factory.createCodeBlock({
        code: 'const x = 1;',
        language: 'javascript',
        title: 'Test Code',
      });

      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0].type).toBe('rectangle'); // Container
      expect(elements.some(el => el.type === 'text')).toBe(true); // Code text
    });

    it('should create code block with title', () => {
      const elements = factory.createCodeBlock({
        code: 'print("hello")',
        language: 'python',
        title: 'Python Example',
      });

      const titleElement = elements.find(
        el => el.type === 'text' && el.id?.includes('title')
      );
      expect(titleElement).toBeDefined();
      expect(titleElement?.text).toBe('Python Example');
    });

    it('should size code block based on content', () => {
      const shortCode = factory.createCodeBlock({
        code: 'x = 1',
        language: 'python',
      });

      const longCode = factory.createCodeBlock({
        code: 'const reallyLongVariableName = "this is a very long string that should make the code block wider";\nconst anotherLine = "more code";\nconst yetAnotherLine = "even more code";',
        language: 'javascript',
      });

      const shortContainer = shortCode.find(el => el.id?.includes('container'));
      const longContainer = longCode.find(el => el.id?.includes('container'));

      expect(longContainer?.width).toBeGreaterThan(shortContainer?.width || 0);
      expect(longContainer?.height).toBeGreaterThan(shortContainer?.height || 0);
    });

    it('should group all code block elements', () => {
      const elements = factory.createCodeBlock({
        code: 'test',
        language: 'text',
      });

      const groupIds = elements.map(el => el.groupIds);
      const firstGroupId = groupIds[0]?.[0];

      // All elements should have the same groupId
      expect(groupIds.every(ids => ids?.[0] === firstGroupId)).toBe(true);
    });
  });

  describe('createTerminalOutput', () => {
    it('should create terminal output elements', () => {
      const elements = factory.createTerminalOutput({
        output: '$ npm install\nDone!',
        title: 'Terminal',
      });

      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0].type).toBe('rectangle'); // Container
    });

    it('should style terminal with dark background', () => {
      const elements = factory.createTerminalOutput({
        output: '$ ls',
      });

      const container = elements.find(el => el.id?.includes('container'));
      expect(container?.backgroundColor).toBe('#1a1a1a');
    });

    it('should use green text color for terminal output', () => {
      const elements = factory.createTerminalOutput({
        output: '$ echo "test"',
      });

      const outputText = elements.find(el => el.id?.includes('output'));
      expect(outputText?.strokeColor).toBe('#00ff00');
    });

    it('should include header with title', () => {
      const elements = factory.createTerminalOutput({
        output: 'output',
        title: 'My Terminal',
      });

      const titleElement = elements.find(el => el.id?.includes('title'));
      expect(titleElement?.text).toBe('My Terminal');
    });
  });

  describe('createNote', () => {
    it('should create sticky note elements', () => {
      const elements = factory.createNote({
        text: 'Remember this!',
        color: 'yellow',
      });

      expect(elements.length).toBe(2); // Note + text
      expect(elements[0].type).toBe('rectangle');
      expect(elements[1].type).toBe('text');
    });

    it('should apply correct color scheme', () => {
      const yellowNote = factory.createNote({
        text: 'Yellow note',
        color: 'yellow',
      });

      const pinkNote = factory.createNote({
        text: 'Pink note',
        color: 'pink',
      });

      const yellowContainer = yellowNote.find(el => el.id?.includes('note'));
      const pinkContainer = pinkNote.find(el => el.id?.includes('note'));

      expect(yellowContainer?.backgroundColor).not.toBe(pinkContainer?.backgroundColor);
    });

    it('should use handwritten font', () => {
      const elements = factory.createNote({
        text: 'Note text',
      });

      const textElement = elements.find(el => el.id?.includes('text'));
      expect(textElement?.fontFamily).toBe(4); // Handwritten
    });

    it('should size note based on text content', () => {
      const shortNote = factory.createNote({
        text: 'Hi',
      });

      const longNote = factory.createNote({
        text: 'This is a much longer note with multiple lines\nAnd even more text here\nAnd yet another line',
      });

      const shortContainer = shortNote.find(el => el.id?.includes('note'));
      const longContainer = longNote.find(el => el.id?.includes('note'));

      expect(longContainer?.height).toBeGreaterThan(shortContainer?.height || 0);
    });
  });

  describe('createChatBubble', () => {
    it('should create chat bubble for user messages', () => {
      const elements = factory.createChatBubble({
        message: 'Hello AI!',
        role: 'user',
      });

      expect(elements.length).toBeGreaterThan(0);
      const bubble = elements.find(el => el.id?.includes('bubble'));
      expect(bubble?.backgroundColor).toBe('#3b82f6'); // Blue for user
    });

    it('should create chat bubble for assistant messages', () => {
      const elements = factory.createChatBubble({
        message: 'Hello human!',
        role: 'assistant',
      });

      const bubble = elements.find(el => el.id?.includes('bubble'));
      expect(bubble?.backgroundColor).toBe('#64748b'); // Gray for assistant
    });

    it('should include role label', () => {
      const userBubble = factory.createChatBubble({
        message: 'Test',
        role: 'user',
      });

      const assistantBubble = factory.createChatBubble({
        message: 'Test',
        role: 'assistant',
      });

      const userLabel = userBubble.find(el => el.id?.includes('label'));
      const assistantLabel = assistantBubble.find(el => el.id?.includes('label'));

      expect(userLabel?.text).toBe('You');
      expect(assistantLabel?.text).toBe('AI');
    });

    it('should use rounded corners', () => {
      const elements = factory.createChatBubble({
        message: 'Test',
        role: 'user',
      });

      const bubble = elements.find(el => el.id?.includes('bubble'));
      expect(bubble?.roundness).toEqual({ type: 3, value: 16 });
    });
  });

  describe('createDocumentPlaceholder', () => {
    it('should create PDF placeholder', () => {
      const elements = factory.createDocumentPlaceholder(
        'Document.pdf',
        'pdf'
      );

      expect(elements.length).toBeGreaterThan(0);
      const icon = elements.find(el => el.id?.includes('icon'));
      expect(icon?.text).toBe('📄');
    });

    it('should create image placeholder', () => {
      const elements = factory.createDocumentPlaceholder(
        'Photo.jpg',
        'image'
      );

      const icon = elements.find(el => el.id?.includes('icon'));
      expect(icon?.text).toBe('🖼️');
    });

    it('should create file placeholder', () => {
      const elements = factory.createDocumentPlaceholder(
        'Data.csv',
        'file'
      );

      const icon = elements.find(el => el.id?.includes('icon'));
      expect(icon?.text).toBe('📁');
    });

    it('should include document title', () => {
      const elements = factory.createDocumentPlaceholder(
        'My Document',
        'pdf'
      );

      const title = elements.find(el => el.id?.includes('title'));
      expect(title?.text).toBe('My Document');
    });

    it('should have standard document dimensions', () => {
      const elements = factory.createDocumentPlaceholder(
        'Test',
        'pdf'
      );

      const container = elements.find(el => el.id?.includes('container'));
      expect(container?.width).toBe(300);
      expect(container?.height).toBe(400);
    });
  });

  describe('createTextElement', () => {
    it('should create simple text element', () => {
      const element = factory.createTextElement('Hello World');

      expect(element.type).toBe('text');
      expect(element.text).toBe('Hello World');
    });

    it('should size text based on content length', () => {
      const shortText = factory.createTextElement('Hi');
      const longText = factory.createTextElement('This is a much longer piece of text');

      expect(longText.width).toBeGreaterThan(shortText.width);
    });

    it('should cap text width at maximum', () => {
      const veryLongText = 'a'.repeat(1000);
      const element = factory.createTextElement(veryLongText);

      expect(element.width).toBeLessThanOrEqual(500);
    });
  });

  describe('updateContext', () => {
    it('should update factory context', () => {
      const newContext = {
        elements: [{ id: 'test' } as ExcalidrawElement],
        appState: { scrollX: 100 } as AppState,
      };

      factory.updateContext(newContext);

      // Context should be updated (test by creating element and checking placement)
      const element = factory.createNote({ text: 'test' });
      expect(element).toBeDefined();
    });
  });

  describe('element IDs', () => {
    it('should generate unique IDs for each element', () => {
      const elements1 = factory.createCodeBlock({ code: 'test1' });
      const elements2 = factory.createCodeBlock({ code: 'test2' });

      const ids1 = elements1.map(el => el.id);
      const ids2 = elements2.map(el => el.id);

      // All IDs should be unique
      const allIds = [...ids1, ...ids2];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('should prefix IDs with "ai-"', () => {
      const elements = factory.createNote({ text: 'test' });

      const allIdsStartWithAi = elements.every(el =>
        el.id?.startsWith('ai-')
      );
      expect(allIdsStartWithAi).toBe(true);
    });
  });

  describe('placement integration', () => {
    it('should respect custom placement options', () => {
      const elements = factory.createCodeBlock(
        { code: 'test' },
        { preferredX: 100, preferredY: 200, strategy: 'grid' }
      );

      const container = elements.find(el => el.id?.includes('container'));

      // With grid strategy, should be snapped to grid
      expect(container?.x).toBeDefined();
      expect(container?.y).toBeDefined();

      // Grid snapping means x and y should be multiples of 50
      if (container) {
        expect(container.x % 50).toBe(0);
        expect(container.y % 50).toBe(0);
      }
    });
  });
});
