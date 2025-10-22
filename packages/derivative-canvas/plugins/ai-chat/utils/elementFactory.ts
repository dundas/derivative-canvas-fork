import type { ExcalidrawElement } from "@excalidraw/excalidraw/types";
import { placementEngine, type PlacementOptions } from "../services/placementEngine";

export interface ElementFactoryContext {
  elements: readonly ExcalidrawElement[];
  appState: any;
}

export interface CodeBlockOptions {
  code: string;
  language?: string;
  title?: string;
  fontSize?: number;
}

export interface TerminalOutputOptions {
  output: string;
  title?: string;
  fontSize?: number;
}

export interface NoteOptions {
  text: string;
  color?: string;
  fontSize?: number;
}

export interface ChatBubbleOptions {
  message: string;
  role: 'user' | 'assistant';
  fontSize?: number;
}

/**
 * Factory class for creating specialized canvas elements
 */
export class ElementFactory {
  private context: ElementFactoryContext;
  private readonly DEFAULT_FONT_SIZE = 16;
  private readonly DEFAULT_PADDING = 20;

  constructor(context: ElementFactoryContext) {
    this.context = context;
  }

  /**
   * Update context with latest canvas state
   */
  updateContext(context: ElementFactoryContext): void {
    this.context = context;
  }

  /**
   * Create a code block element
   */
  createCodeBlock(options: CodeBlockOptions, placement?: Partial<PlacementOptions>): any[] {
    const fontSize = options.fontSize || this.DEFAULT_FONT_SIZE;
    const padding = this.DEFAULT_PADDING;

    // Estimate dimensions based on content
    const lines = options.code.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const width = Math.max(400, Math.min(800, maxLineLength * fontSize * 0.6));
    const height = Math.max(200, lines.length * fontSize * 1.5 + 80);

    // Find optimal position
    const position = placementEngine.findOptimalPosition(
      this.context.elements,
      this.context.appState,
      {
        width,
        height,
        strategy: placement?.strategy || 'viewport-center',
        avoidOverlap: true,
        ...placement,
      }
    );

    const elements: any[] = [];
    const baseId = this.generateId();

    // Create container rectangle
    const container = {
      type: 'rectangle',
      id: `${baseId}-container`,
      x: position.x,
      y: position.y,
      width,
      height,
      strokeColor: '#1e293b',
      backgroundColor: '#0f172a',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0,
      opacity: 95,
      roundness: { type: 3, value: 8 },
      locked: false,
      groupIds: [baseId],
    };
    elements.push(container);

    // Create title bar if provided
    let titleHeight = 0;
    if (options.title || options.language) {
      titleHeight = 30;
      const title = {
        type: 'text',
        id: `${baseId}-title`,
        x: position.x + padding,
        y: position.y + 8,
        width: width - padding * 2,
        height: 20,
        text: options.title || options.language || 'Code',
        fontSize: fontSize * 0.85,
        fontFamily: 1, // monospace
        textAlign: 'left',
        strokeColor: '#94a3b8',
        backgroundColor: 'transparent',
        opacity: 100,
        groupIds: [baseId],
      };
      elements.push(title);

      // Divider line
      const divider = {
        type: 'line',
        id: `${baseId}-divider`,
        x: position.x + padding,
        y: position.y + titleHeight,
        width: width - padding * 2,
        height: 0,
        points: [[0, 0], [width - padding * 2, 0]],
        strokeColor: '#334155',
        strokeWidth: 1,
        roughness: 0,
        opacity: 60,
        groupIds: [baseId],
      };
      elements.push(divider);
    }

    // Create code text
    const codeText = {
      type: 'text',
      id: `${baseId}-code`,
      x: position.x + padding,
      y: position.y + titleHeight + padding,
      width: width - padding * 2,
      height: height - titleHeight - padding * 2,
      text: options.code,
      fontSize,
      fontFamily: 1, // monospace
      textAlign: 'left',
      strokeColor: '#e2e8f0',
      backgroundColor: 'transparent',
      opacity: 100,
      lineHeight: 1.5,
      groupIds: [baseId],
    };
    elements.push(codeText);

    return elements;
  }

  /**
   * Create a terminal output element
   */
  createTerminalOutput(options: TerminalOutputOptions, placement?: Partial<PlacementOptions>): any[] {
    const fontSize = options.fontSize || this.DEFAULT_FONT_SIZE;
    const padding = this.DEFAULT_PADDING;

    // Estimate dimensions
    const lines = options.output.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const width = Math.max(500, Math.min(900, maxLineLength * fontSize * 0.6));
    const height = Math.max(150, lines.length * fontSize * 1.5 + 70);

    // Find optimal position
    const position = placementEngine.findOptimalPosition(
      this.context.elements,
      this.context.appState,
      {
        width,
        height,
        strategy: placement?.strategy || 'viewport-center',
        avoidOverlap: true,
        ...placement,
      }
    );

    const elements: any[] = [];
    const baseId = this.generateId();

    // Create terminal window container
    const container = {
      type: 'rectangle',
      id: `${baseId}-container`,
      x: position.x,
      y: position.y,
      width,
      height,
      strokeColor: '#000000',
      backgroundColor: '#1a1a1a',
      fillStyle: 'solid',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
      roundness: { type: 3, value: 8 },
      groupIds: [baseId],
    };
    elements.push(container);

    // Terminal header with buttons
    const headerHeight = 30;
    const header = {
      type: 'rectangle',
      id: `${baseId}-header`,
      x: position.x,
      y: position.y,
      width,
      height: headerHeight,
      strokeColor: '#000000',
      backgroundColor: '#2d2d2d',
      fillStyle: 'solid',
      strokeWidth: 0,
      roughness: 0,
      opacity: 100,
      roundness: { type: 3, value: 8 },
      groupIds: [baseId],
    };
    elements.push(header);

    // Title
    if (options.title) {
      const title = {
        type: 'text',
        id: `${baseId}-title`,
        x: position.x + padding,
        y: position.y + 8,
        width: width - padding * 2,
        height: 16,
        text: options.title,
        fontSize: fontSize * 0.8,
        fontFamily: 1, // monospace
        textAlign: 'left',
        strokeColor: '#a0a0a0',
        backgroundColor: 'transparent',
        opacity: 100,
        groupIds: [baseId],
      };
      elements.push(title);
    }

    // Terminal output text
    const outputText = {
      type: 'text',
      id: `${baseId}-output`,
      x: position.x + padding,
      y: position.y + headerHeight + padding,
      width: width - padding * 2,
      height: height - headerHeight - padding * 2,
      text: options.output,
      fontSize,
      fontFamily: 1, // monospace
      textAlign: 'left',
      strokeColor: '#00ff00', // Terminal green
      backgroundColor: 'transparent',
      opacity: 100,
      lineHeight: 1.4,
      groupIds: [baseId],
    };
    elements.push(outputText);

    return elements;
  }

  /**
   * Create a sticky note element
   */
  createNote(options: NoteOptions, placement?: Partial<PlacementOptions>): any[] {
    const fontSize = options.fontSize || this.DEFAULT_FONT_SIZE;
    const padding = this.DEFAULT_PADDING;

    // Estimate dimensions
    const lines = options.text.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length), 20);
    const width = Math.max(200, Math.min(400, maxLineLength * fontSize * 0.6));
    const height = Math.max(100, lines.length * fontSize * 1.5 + padding * 2);

    // Find optimal position
    const position = placementEngine.findOptimalPosition(
      this.context.elements,
      this.context.appState,
      {
        width,
        height,
        strategy: placement?.strategy || 'viewport-center',
        avoidOverlap: true,
        ...placement,
      }
    );

    const elements: any[] = [];
    const baseId = this.generateId();

    // Note colors
    const colors = {
      yellow: { bg: '#fef3c7', stroke: '#f59e0b', text: '#78350f' },
      pink: { bg: '#fce7f3', stroke: '#ec4899', text: '#831843' },
      blue: { bg: '#dbeafe', stroke: '#3b82f6', text: '#1e3a8a' },
      green: { bg: '#d1fae5', stroke: '#10b981', text: '#064e3b' },
    };

    const color = colors[options.color as keyof typeof colors] || colors.yellow;

    // Create note rectangle
    const note = {
      type: 'rectangle',
      id: `${baseId}-note`,
      x: position.x,
      y: position.y,
      width,
      height,
      strokeColor: color.stroke,
      backgroundColor: color.bg,
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      opacity: 90,
      roundness: { type: 3, value: 4 },
      groupIds: [baseId],
    };
    elements.push(note);

    // Create note text
    const text = {
      type: 'text',
      id: `${baseId}-text`,
      x: position.x + padding,
      y: position.y + padding,
      width: width - padding * 2,
      height: height - padding * 2,
      text: options.text,
      fontSize,
      fontFamily: 4, // handwritten
      textAlign: 'left',
      strokeColor: color.text,
      backgroundColor: 'transparent',
      opacity: 100,
      lineHeight: 1.5,
      groupIds: [baseId],
    };
    elements.push(text);

    return elements;
  }

  /**
   * Create a chat bubble element
   */
  createChatBubble(options: ChatBubbleOptions, placement?: Partial<PlacementOptions>): any[] {
    const fontSize = options.fontSize || this.DEFAULT_FONT_SIZE;
    const padding = this.DEFAULT_PADDING;

    // Estimate dimensions
    const lines = options.message.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length), 15);
    const width = Math.max(200, Math.min(600, maxLineLength * fontSize * 0.6));
    const height = Math.max(60, lines.length * fontSize * 1.5 + padding * 2);

    // Find optimal position
    const position = placementEngine.findOptimalPosition(
      this.context.elements,
      this.context.appState,
      {
        width,
        height,
        strategy: placement?.strategy || 'flow',
        avoidOverlap: true,
        ...placement,
      }
    );

    const elements: any[] = [];
    const baseId = this.generateId();

    // User vs Assistant styling
    const isUser = options.role === 'user';
    const bubbleColor = isUser ? '#3b82f6' : '#64748b';
    const textColor = '#ffffff';

    // Create bubble
    const bubble = {
      type: 'rectangle',
      id: `${baseId}-bubble`,
      x: position.x,
      y: position.y,
      width,
      height,
      strokeColor: bubbleColor,
      backgroundColor: bubbleColor,
      fillStyle: 'solid',
      strokeWidth: 0,
      roughness: 0,
      opacity: 95,
      roundness: { type: 3, value: 16 },
      groupIds: [baseId],
    };
    elements.push(bubble);

    // Create message text
    const text = {
      type: 'text',
      id: `${baseId}-text`,
      x: position.x + padding,
      y: position.y + padding * 0.75,
      width: width - padding * 2,
      height: height - padding * 1.5,
      text: options.message,
      fontSize,
      fontFamily: 3, // sans-serif
      textAlign: 'left',
      strokeColor: textColor,
      backgroundColor: 'transparent',
      opacity: 100,
      lineHeight: 1.5,
      groupIds: [baseId],
    };
    elements.push(text);

    // Add role label
    const label = {
      type: 'text',
      id: `${baseId}-label`,
      x: position.x + padding,
      y: position.y - 20,
      width: 100,
      height: 16,
      text: isUser ? 'You' : 'AI',
      fontSize: fontSize * 0.75,
      fontFamily: 3,
      textAlign: 'left',
      strokeColor: '#94a3b8',
      backgroundColor: 'transparent',
      opacity: 80,
      groupIds: [baseId],
    };
    elements.push(label);

    return elements;
  }

  /**
   * Create a simple text element
   */
  createTextElement(text: string, placement?: Partial<PlacementOptions>): any {
    const fontSize = 20;
    const width = Math.min(500, text.length * fontSize * 0.6);
    const height = fontSize * 1.5;

    const position = placementEngine.findOptimalPosition(
      this.context.elements,
      this.context.appState,
      {
        width,
        height,
        strategy: placement?.strategy || 'viewport-center',
        avoidOverlap: true,
        ...placement,
      }
    );

    return {
      type: 'text',
      id: this.generateId(),
      x: position.x,
      y: position.y,
      width,
      height,
      text,
      fontSize,
      fontFamily: 3, // sans-serif
      textAlign: 'left',
      strokeColor: '#1e293b',
      backgroundColor: 'transparent',
      opacity: 100,
    };
  }

  /**
   * Create a document/image placeholder
   */
  createDocumentPlaceholder(title: string, type: 'pdf' | 'image' | 'file', placement?: Partial<PlacementOptions>): any[] {
    const width = 300;
    const height = 400;

    const position = placementEngine.findOptimalPosition(
      this.context.elements,
      this.context.appState,
      {
        width,
        height,
        strategy: placement?.strategy || 'viewport-center',
        avoidOverlap: true,
        ...placement,
      }
    );

    const elements: any[] = [];
    const baseId = this.generateId();

    // Container
    const container = {
      type: 'rectangle',
      id: `${baseId}-container`,
      x: position.x,
      y: position.y,
      width,
      height,
      strokeColor: '#94a3b8',
      backgroundColor: '#f8fafc',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
      roundness: { type: 3, value: 8 },
      groupIds: [baseId],
    };
    elements.push(container);

    // Icon/placeholder
    const iconText = type === 'pdf' ? '📄' : type === 'image' ? '🖼️' : '📁';
    const icon = {
      type: 'text',
      id: `${baseId}-icon`,
      x: position.x + width / 2 - 30,
      y: position.y + height / 2 - 60,
      width: 60,
      height: 60,
      text: iconText,
      fontSize: 48,
      fontFamily: 3,
      textAlign: 'center',
      strokeColor: '#64748b',
      backgroundColor: 'transparent',
      opacity: 60,
      groupIds: [baseId],
    };
    elements.push(icon);

    // Title
    const titleElement = {
      type: 'text',
      id: `${baseId}-title`,
      x: position.x + 20,
      y: position.y + height / 2 + 20,
      width: width - 40,
      height: 30,
      text: title,
      fontSize: 18,
      fontFamily: 3,
      textAlign: 'center',
      strokeColor: '#1e293b',
      backgroundColor: 'transparent',
      opacity: 100,
      groupIds: [baseId],
    };
    elements.push(titleElement);

    return elements;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
