import type { ExcalidrawElement, AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawFrameworkAPI } from "../types";
import type {
  CanvasObject,
  CanvasObjectType,
  CanvasObjectMetadata,
  CanvasPosition,
  CanvasDimensions,
  ChatMessage,
} from "../canvas-objects/types";
import { ObjectManager } from "../canvas-objects/ObjectManager";

/**
 * AICanvasController - Bridge between AI and Canvas
 *
 * Provides high-level API for AI agents to interact with the canvas:
 * - Create objects (VM windows, images, text, etc.)
 * - Modify existing objects
 * - Query canvas state
 * - Handle selection-based interactions
 */
export class AICanvasController {
  private objectManager: ObjectManager;
  private frameworkAPI: ExcalidrawFrameworkAPI;
  private conversationId: string;
  private agentId: string;

  constructor(
    frameworkAPI: ExcalidrawFrameworkAPI,
    agentId: string,
    conversationId: string,
    objectManager?: ObjectManager
  ) {
    this.frameworkAPI = frameworkAPI;
    this.agentId = agentId;
    this.conversationId = conversationId;
    this.objectManager = objectManager || new ObjectManager();
  }

  /**
   * Get current canvas state for AI context
   */
  getCanvasContext(): CanvasContextData {
    const elements = this.getCurrentElements();
    const canvasObjects = elements.filter(
      (el) => (el as CanvasObject).customData?.canvasObject
    ) as CanvasObject[];

    return {
      totalElements: elements.length,
      canvasObjects: canvasObjects.map((obj) => ({
        id: obj.id,
        type: obj.customData?.canvasObject?.objectType || 'shape',
        metadata: obj.customData?.canvasObject,
        position: { x: obj.x, y: obj.y },
        dimensions: { width: obj.width, height: obj.height },
      })),
      selectedElementIds: this.getSelectedElementIds(),
      aiGeneratedCount: canvasObjects.filter(
        (obj) => obj.customData?.canvasObject?.aiGenerated
      ).length,
    };
  }

  /**
   * Get selected objects for context
   */
  getSelectedObjects(): CanvasObject[] {
    const selectedIds = this.getSelectedElementIds();
    const elements = this.getCurrentElements();

    return elements
      .filter((el) => selectedIds.includes(el.id))
      .filter((el) => (el as CanvasObject).customData?.canvasObject) as CanvasObject[];
  }

  /**
   * Create a VM window for coding agents
   */
  createVMWindow(
    command: string,
    initialOutput?: string[],
    position?: CanvasPosition
  ): CanvasObject {
    const object = this.objectManager.createObject(
      'vm-window',
      {
        createdBy: 'ai',
        aiGenerated: true,
        agentId: this.agentId,
        conversationId: this.conversationId,
        typeData: {
          command,
          output: initialOutput || [],
          status: 'running' as const,
          processId: this.generateProcessId(),
        },
      },
      { width: 700, height: 500 },
      position
    );

    this.addToCanvas(object);
    return object;
  }

  /**
   * Update VM window output
   */
  updateVMWindow(objectId: string, newOutput: string[]): void {
    const object = this.objectManager.getObject(objectId);
    if (!object || object.customData?.canvasObject?.objectType !== 'vm-window') {
      return;
    }

    this.objectManager.updateObject(objectId, {
      typeData: {
        ...object.customData.canvasObject.typeData,
        output: newOutput,
        status: 'running' as const,
      },
    });

    this.updateCanvasObject(objectId);
  }

  /**
   * Create a chat window
   */
  createChatWindow(
    messages?: ChatMessage[],
    position?: CanvasPosition
  ): CanvasObject {
    const object = this.objectManager.createObject(
      'chat-window',
      {
        createdBy: 'ai',
        aiGenerated: true,
        agentId: this.agentId,
        conversationId: this.conversationId,
        typeData: {
          conversationId: this.conversationId,
          messages: messages || [],
          agentType: this.agentId,
        },
      },
      { width: 450, height: 600 },
      position
    );

    this.addToCanvas(object);
    return object;
  }

  /**
   * Add message to chat window
   */
  addChatMessage(
    objectId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): void {
    const object = this.objectManager.getObject(objectId);
    if (!object || object.customData?.canvasObject?.objectType !== 'chat-window') {
      return;
    }

    const currentData = object.customData.canvasObject.typeData as any;
    const newMessage: ChatMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date(),
    };

    this.objectManager.updateObject(objectId, {
      typeData: {
        ...currentData,
        messages: [...(currentData.messages || []), newMessage],
      },
    });

    this.updateCanvasObject(objectId);
  }

  /**
   * Create an image on canvas
   */
  createImage(
    url: string,
    alt?: string,
    dimensions?: CanvasDimensions,
    position?: CanvasPosition,
    aiGenerated = false,
    prompt?: string
  ): CanvasObject {
    const object = this.objectManager.createObject(
      'image',
      {
        createdBy: aiGenerated ? 'ai' : 'user',
        aiGenerated,
        agentId: aiGenerated ? this.agentId : undefined,
        conversationId: this.conversationId,
        typeData: {
          url,
          alt,
          source: aiGenerated ? ('ai-generated' as const) : ('url' as const),
          generationPrompt: prompt,
          width: dimensions?.width,
          height: dimensions?.height,
        },
      },
      dimensions,
      position
    );

    this.addToCanvas(object);
    return object;
  }

  /**
   * Create a website preview
   */
  createWebsitePreview(
    url: string,
    title?: string,
    dimensions?: CanvasDimensions,
    position?: CanvasPosition
  ): CanvasObject {
    const object = this.objectManager.createObject(
      'website',
      {
        createdBy: 'ai',
        aiGenerated: true,
        agentId: this.agentId,
        conversationId: this.conversationId,
        typeData: {
          url,
          title,
          embedType: 'preview' as const,
        },
      },
      dimensions || { width: 900, height: 700 },
      position
    );

    this.addToCanvas(object);
    return object;
  }

  /**
   * Create a text block
   */
  createTextBlock(
    content: string,
    format: 'plain' | 'markdown' | 'html' = 'plain',
    position?: CanvasPosition
  ): CanvasObject {
    const object = this.objectManager.createObject(
      'text-block',
      {
        createdBy: 'ai',
        aiGenerated: true,
        agentId: this.agentId,
        conversationId: this.conversationId,
        typeData: {
          content,
          format,
        },
      },
      undefined,
      position
    );

    this.addToCanvas(object);
    return object;
  }

  /**
   * Create a card (for products, tasks, etc.)
   */
  createCard(
    title: string,
    description?: string,
    fields?: Array<{ label: string; value: string }>,
    imageUrl?: string,
    position?: CanvasPosition
  ): CanvasObject {
    const object = this.objectManager.createObject(
      'card',
      {
        createdBy: 'ai',
        aiGenerated: true,
        agentId: this.agentId,
        conversationId: this.conversationId,
        typeData: {
          title,
          description,
          fields,
          imageUrl,
        },
      },
      undefined,
      position
    );

    this.addToCanvas(object);
    return object;
  }

  /**
   * Create an agent representation
   */
  createAgentAvatar(
    agentType: string,
    task?: string,
    position?: CanvasPosition
  ): CanvasObject {
    const object = this.objectManager.createObject(
      'agent',
      {
        createdBy: 'ai',
        aiGenerated: true,
        agentId: this.agentId,
        conversationId: this.conversationId,
        typeData: {
          agentType,
          status: 'idle' as const,
          task,
        },
      },
      undefined,
      position
    );

    this.addToCanvas(object);
    return object;
  }

  /**
   * Update agent status
   */
  updateAgentStatus(
    objectId: string,
    status: 'idle' | 'thinking' | 'working' | 'done' | 'error',
    progress?: number,
    output?: any
  ): void {
    const object = this.objectManager.getObject(objectId);
    if (!object || object.customData?.canvasObject?.objectType !== 'agent') {
      return;
    }

    const currentData = object.customData.canvasObject.typeData as any;
    this.objectManager.updateObject(objectId, {
      typeData: {
        ...currentData,
        status,
        progress,
        output,
      },
    });

    this.updateCanvasObject(objectId);
  }

  /**
   * Group objects together
   */
  groupObjects(objectIds: string[], groupName?: string): string {
    const groupId = this.generateId();

    objectIds.forEach((id) => {
      this.objectManager.updateObject(id, { groupId });
    });

    // Update canvas
    objectIds.forEach((id) => this.updateCanvasObject(id));

    return groupId;
  }

  /**
   * Link objects together
   */
  linkObjects(sourceId: string, targetId: string): void {
    const source = this.objectManager.getObject(sourceId);
    if (!source || !source.customData?.canvasObject) return;

    const linkedIds = source.customData.canvasObject.linkedObjectIds || [];
    if (!linkedIds.includes(targetId)) {
      this.objectManager.updateObject(sourceId, {
        linkedObjectIds: [...linkedIds, targetId],
      });
      this.updateCanvasObject(sourceId);
    }
  }

  /**
   * Delete object from canvas
   */
  deleteObject(objectId: string): void {
    this.frameworkAPI.removeElement(objectId);
    // ObjectManager will be synced on next update
  }

  /**
   * Move object to position
   */
  moveObject(objectId: string, position: CanvasPosition): void {
    const elements = this.getCurrentElements();
    const updatedElements = elements.map((el) =>
      el.id === objectId ? { ...el, x: position.x, y: position.y } : el
    );
    this.frameworkAPI.updateElements(updatedElements as ExcalidrawElement[]);
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: CanvasObjectType): CanvasObject[] {
    return this.objectManager.getObjectsByType(type);
  }

  /**
   * Get AI-generated objects
   */
  getAIObjects(): CanvasObject[] {
    return this.objectManager.getAIGeneratedObjects();
  }

  /**
   * Sync object manager with current canvas state
   */
  syncWithCanvas(): void {
    const elements = this.getCurrentElements();
    this.objectManager.syncWithElements(elements);
  }

  // Private helper methods

  private addToCanvas(object: CanvasObject): void {
    this.frameworkAPI.addElement(object as ExcalidrawElement);
  }

  private updateCanvasObject(objectId: string): void {
    const object = this.objectManager.getObject(objectId);
    if (!object) return;

    const elements = this.getCurrentElements();
    const updatedElements = elements.map((el) =>
      el.id === objectId ? object : el
    );
    this.frameworkAPI.updateElements(updatedElements as ExcalidrawElement[]);
  }

  private getCurrentElements(): readonly ExcalidrawElement[] {
    // This would be provided by the framework context
    // For now, we'll return an empty array as a placeholder
    return [];
  }

  private getSelectedElementIds(): string[] {
    // This would come from appState.selectedElementIds
    // Placeholder for now
    return [];
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProcessId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
}

/**
 * Canvas context data for AI
 */
export interface CanvasContextData {
  totalElements: number;
  canvasObjects: Array<{
    id: string;
    type: CanvasObjectType;
    metadata?: CanvasObjectMetadata;
    position: CanvasPosition;
    dimensions: CanvasDimensions;
  }>;
  selectedElementIds: string[];
  aiGeneratedCount: number;
}

/**
 * Selection-based AI interaction data
 */
export interface SelectionContext {
  selectedObjects: CanvasObject[];
  count: number;
  types: CanvasObjectType[];
  hasAIGenerated: boolean;
}
