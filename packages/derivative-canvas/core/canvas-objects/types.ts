import type { ExcalidrawElement } from "@excalidraw/excalidraw/types";

/**
 * Canvas Object Types for AI Collaboration
 *
 * These are high-level object types that AI agents can work with.
 * They extend Excalidraw elements with AI-specific metadata.
 */

export type CanvasObjectType =
  | 'vm-window'      // Terminal/VM output for coding agents
  | 'chat-window'    // AI chat conversation
  | 'image'          // Images, screenshots, generated visuals
  | 'website'        // Website preview/embed
  | 'text-block'     // Rich text content
  | 'card'           // Structured data card (products, tasks, etc.)
  | 'agent'          // AI agent representation
  | 'group'          // Grouped objects
  | 'shape';         // Generic shape

export interface CanvasObjectMetadata {
  // Core identification
  objectType: CanvasObjectType;
  id: string;
  createdBy: 'user' | 'ai' | string; // User ID or 'ai'
  createdAt: Date;
  updatedAt: Date;

  // AI collaboration
  aiGenerated?: boolean;
  agentId?: string;
  conversationId?: string;

  // Grouping and relationships
  groupId?: string;
  linkedObjectIds?: string[];
  parentId?: string;

  // Type-specific data
  typeData?: VMWindowData | ChatWindowData | ImageData | WebsiteData | TextBlockData | CardData | AgentData;

  // Custom metadata
  custom?: Record<string, any>;
}

// Type-specific data interfaces

export interface VMWindowData {
  processId?: string;
  command?: string;
  output?: string[];
  status: 'running' | 'stopped' | 'error';
  env?: Record<string, string>;
  workingDir?: string;
}

export interface ChatWindowData {
  conversationId: string;
  messages: ChatMessage[];
  agentType?: string;
  model?: string;
  systemPrompt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ImageData {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  source?: 'upload' | 'ai-generated' | 'url' | 'screenshot';
  generationPrompt?: string;
}

export interface WebsiteData {
  url: string;
  title?: string;
  screenshot?: string;
  embedType?: 'iframe' | 'screenshot' | 'preview';
  metadata?: Record<string, any>;
}

export interface TextBlockData {
  content: string;
  format?: 'plain' | 'markdown' | 'html';
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
  };
}

export interface CardData {
  title: string;
  description?: string;
  imageUrl?: string;
  fields?: Array<{ label: string; value: string }>;
  actions?: Array<{ label: string; action: string }>;
  status?: string;
  tags?: string[];
}

export interface AgentData {
  agentType: string;
  status: 'idle' | 'thinking' | 'working' | 'done' | 'error';
  task?: string;
  progress?: number;
  output?: any;
  capabilities?: string[];
}

/**
 * Extended Excalidraw element with canvas object metadata
 */
export interface CanvasObject extends ExcalidrawElement {
  customData?: {
    canvasObject?: CanvasObjectMetadata;
  };
}

/**
 * Layout configuration for smart object placement
 */
export interface LayoutConfig {
  strategy: 'grid' | 'flow' | 'stack' | 'manual';
  padding?: number;
  margin?: number;
  columns?: number;
  maxWidth?: number;
  alignment?: 'left' | 'center' | 'right' | 'top' | 'bottom';
}

/**
 * Position for placing objects on canvas
 */
export interface CanvasPosition {
  x: number;
  y: number;
}

/**
 * Dimensions for canvas objects
 */
export interface CanvasDimensions {
  width: number;
  height: number;
}
