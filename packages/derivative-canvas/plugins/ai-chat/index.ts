/**
 * AI Chat Plugin for Derivative Canvas
 *
 * An intelligent AI assistant that integrates with Excalidraw canvas,
 * capable of creating various interactive elements and chatting with users.
 *
 * @packageDocumentation
 */

// Main plugin export
export { AIChatPlugin } from './AIChatPlugin';

// Components
export { ChatSidebar } from './components/ChatSidebar';
export { ChatOnCanvas } from './components/ChatOnCanvas';

// Services
export { AIService } from './services/aiService';
export type { Message, CanvasAction, AIResponse, AIServiceConfig } from './services/aiService';

export { PlacementEngine, placementEngine } from './services/placementEngine';
export type { PlacementOptions, PlacementResult } from './services/placementEngine';

// Utilities
export { ElementFactory } from './utils/elementFactory';
export type {
  ElementFactoryContext,
  CodeBlockOptions,
  TerminalOutputOptions,
  NoteOptions,
  ChatBubbleOptions,
} from './utils/elementFactory';

export {
  addElementsToCanvas,
  getSelectedElements,
  getBoundingBox,
  scrollToElements,
  groupElements,
  getCanvasSummary,
  getElementsByType,
  findElementsWithText,
  getElementsInArea,
  getDistanceBetweenElements,
  findNearestElement,
  areElementsOverlapping,
  getViewportBounds,
  isElementInViewport,
} from './utils/canvasHelpers';
