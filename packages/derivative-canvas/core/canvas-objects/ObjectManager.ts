import type { ExcalidrawElement, AppState } from "@excalidraw/excalidraw/types";
import type {
  CanvasObject,
  CanvasObjectMetadata,
  CanvasObjectType,
  CanvasPosition,
  CanvasDimensions,
  LayoutConfig,
} from "./types";

/**
 * ObjectManager - Smart canvas object management
 *
 * Handles creation, positioning, and management of canvas objects
 * with intelligent layout and collision avoidance.
 */
export class ObjectManager {
  private objects: Map<string, CanvasObject> = new Map();
  private layoutConfig: LayoutConfig = {
    strategy: 'flow',
    padding: 20,
    margin: 10,
  };

  constructor(layoutConfig?: Partial<LayoutConfig>) {
    if (layoutConfig) {
      this.layoutConfig = { ...this.layoutConfig, ...layoutConfig };
    }
  }

  /**
   * Create a new canvas object with smart positioning
   */
  createObject(
    type: CanvasObjectType,
    metadata: Partial<CanvasObjectMetadata>,
    dimensions?: CanvasDimensions,
    position?: CanvasPosition
  ): CanvasObject {
    const id = this.generateId();
    const now = new Date();

    // Calculate smart position if not provided
    const finalPosition = position || this.calculateSmartPosition(type, dimensions);
    const finalDimensions = dimensions || this.getDefaultDimensions(type);

    // Create base Excalidraw element based on type
    const baseElement = this.createBaseElement(
      id,
      type,
      finalPosition,
      finalDimensions
    );

    // Add canvas object metadata
    const canvasObject: CanvasObject = {
      ...baseElement,
      customData: {
        canvasObject: {
          objectType: type,
          id,
          createdBy: metadata.createdBy || 'user',
          createdAt: now,
          updatedAt: now,
          aiGenerated: metadata.aiGenerated || false,
          agentId: metadata.agentId,
          conversationId: metadata.conversationId,
          groupId: metadata.groupId,
          linkedObjectIds: metadata.linkedObjectIds,
          parentId: metadata.parentId,
          typeData: metadata.typeData,
          custom: metadata.custom,
        },
      },
    };

    this.objects.set(id, canvasObject);
    return canvasObject;
  }

  /**
   * Update an existing canvas object
   */
  updateObject(
    id: string,
    updates: Partial<CanvasObjectMetadata>
  ): CanvasObject | null {
    const object = this.objects.get(id);
    if (!object || !object.customData?.canvasObject) return null;

    object.customData.canvasObject = {
      ...object.customData.canvasObject,
      ...updates,
      updatedAt: new Date(),
    };

    this.objects.set(id, object);
    return object;
  }

  /**
   * Get object by ID
   */
  getObject(id: string): CanvasObject | null {
    return this.objects.get(id) || null;
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: CanvasObjectType): CanvasObject[] {
    return Array.from(this.objects.values()).filter(
      (obj) => obj.customData?.canvasObject?.objectType === type
    );
  }

  /**
   * Get objects in a group
   */
  getObjectsByGroup(groupId: string): CanvasObject[] {
    return Array.from(this.objects.values()).filter(
      (obj) => obj.customData?.canvasObject?.groupId === groupId
    );
  }

  /**
   * Get AI-generated objects
   */
  getAIGeneratedObjects(): CanvasObject[] {
    return Array.from(this.objects.values()).filter(
      (obj) => obj.customData?.canvasObject?.aiGenerated === true
    );
  }

  /**
   * Calculate smart position for new object
   */
  private calculateSmartPosition(
    type: CanvasObjectType,
    dimensions?: CanvasDimensions
  ): CanvasPosition {
    const { strategy, padding = 20, margin = 10 } = this.layoutConfig;
    const dims = dimensions || this.getDefaultDimensions(type);

    if (this.objects.size === 0) {
      // First object - place at origin with padding
      return { x: padding, y: padding };
    }

    switch (strategy) {
      case 'grid':
        return this.calculateGridPosition(dims);
      case 'flow':
        return this.calculateFlowPosition(dims);
      case 'stack':
        return this.calculateStackPosition(dims);
      default:
        return this.calculateFlowPosition(dims);
    }
  }

  /**
   * Grid layout - arrange in columns
   */
  private calculateGridPosition(dimensions: CanvasDimensions): CanvasPosition {
    const { padding = 20, margin = 10, columns = 4 } = this.layoutConfig;
    const index = this.objects.size;
    const row = Math.floor(index / columns);
    const col = index % columns;

    return {
      x: padding + col * (dimensions.width + margin),
      y: padding + row * (dimensions.height + margin),
    };
  }

  /**
   * Flow layout - find next available space
   */
  private calculateFlowPosition(dimensions: CanvasDimensions): CanvasPosition {
    const { padding = 20, margin = 10, maxWidth = 1200 } = this.layoutConfig;

    let x = padding;
    let y = padding;
    let maxHeightInRow = 0;

    // Try to find a spot that doesn't overlap
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidatePos = { x, y };

      if (!this.hasOverlap(candidatePos, dimensions)) {
        return candidatePos;
      }

      // Move to next position
      x += dimensions.width + margin;
      maxHeightInRow = Math.max(maxHeightInRow, dimensions.height);

      // Wrap to next row if exceeding maxWidth
      if (x + dimensions.width > maxWidth) {
        x = padding;
        y += maxHeightInRow + margin;
        maxHeightInRow = 0;
      }
    }

    // Fallback - place with offset
    return {
      x: padding + (this.objects.size % 5) * 50,
      y: padding + Math.floor(this.objects.size / 5) * 50,
    };
  }

  /**
   * Stack layout - vertical stacking
   */
  private calculateStackPosition(dimensions: CanvasDimensions): CanvasPosition {
    const { padding = 20, margin = 10 } = this.layoutConfig;

    if (this.objects.size === 0) {
      return { x: padding, y: padding };
    }

    // Find the bottom-most object
    let maxY = padding;
    let maxHeight = 0;

    this.objects.forEach((obj) => {
      const objY = obj.y || 0;
      const objHeight = obj.height || 0;
      if (objY + objHeight > maxY + maxHeight) {
        maxY = objY;
        maxHeight = objHeight;
      }
    });

    return {
      x: padding,
      y: maxY + maxHeight + margin,
    };
  }

  /**
   * Check if position would overlap with existing objects
   */
  private hasOverlap(
    position: CanvasPosition,
    dimensions: CanvasDimensions
  ): boolean {
    const { margin = 10 } = this.layoutConfig;

    return Array.from(this.objects.values()).some((obj) => {
      const objX = obj.x || 0;
      const objY = obj.y || 0;
      const objWidth = obj.width || 0;
      const objHeight = obj.height || 0;

      return (
        position.x < objX + objWidth + margin &&
        position.x + dimensions.width + margin > objX &&
        position.y < objY + objHeight + margin &&
        position.y + dimensions.height + margin > objY
      );
    });
  }

  /**
   * Get default dimensions for object type
   */
  private getDefaultDimensions(type: CanvasObjectType): CanvasDimensions {
    const defaults: Record<CanvasObjectType, CanvasDimensions> = {
      'vm-window': { width: 600, height: 400 },
      'chat-window': { width: 400, height: 500 },
      'image': { width: 300, height: 200 },
      'website': { width: 800, height: 600 },
      'text-block': { width: 300, height: 150 },
      'card': { width: 250, height: 180 },
      'agent': { width: 200, height: 120 },
      'group': { width: 400, height: 300 },
      'shape': { width: 200, height: 200 },
    };

    return defaults[type] || { width: 200, height: 200 };
  }

  /**
   * Create base Excalidraw element
   */
  private createBaseElement(
    id: string,
    type: CanvasObjectType,
    position: CanvasPosition,
    dimensions: CanvasDimensions
  ): ExcalidrawElement {
    const baseProps = {
      id,
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height,
      angle: 0,
      strokeColor: '#1e1e1e',
      backgroundColor: this.getDefaultBackgroundColor(type),
      fillStyle: 'solid' as const,
      strokeWidth: 2,
      strokeStyle: 'solid' as const,
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 3 as const, value: 8 },
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
    };

    // For most object types, use rectangle
    if (type === 'agent' || type === 'card' || type === 'chat-window' ||
        type === 'vm-window' || type === 'website' || type === 'text-block') {
      return {
        ...baseProps,
        type: 'rectangle' as const,
      };
    }

    // For images, use a rectangle with image reference
    if (type === 'image') {
      return {
        ...baseProps,
        type: 'rectangle' as const,
      };
    }

    // Default to rectangle
    return {
      ...baseProps,
      type: 'rectangle' as const,
    };
  }

  /**
   * Get default background color for object type
   */
  private getDefaultBackgroundColor(type: CanvasObjectType): string {
    const colors: Record<CanvasObjectType, string> = {
      'vm-window': '#1e1e1e',
      'chat-window': '#f0f9ff',
      'image': '#ffffff',
      'website': '#ffffff',
      'text-block': '#fffef0',
      'card': '#faf5ff',
      'agent': '#e0f2fe',
      'group': 'transparent',
      'shape': '#ffffff',
    };

    return colors[type] || '#ffffff';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sync with Excalidraw elements
   */
  syncWithElements(elements: readonly ExcalidrawElement[]): void {
    // Update internal map with elements from Excalidraw
    elements.forEach((element) => {
      const canvasObject = element as CanvasObject;
      if (canvasObject.customData?.canvasObject) {
        this.objects.set(element.id, canvasObject);
      }
    });

    // Remove objects that no longer exist
    const elementIds = new Set(elements.map((e) => e.id));
    this.objects.forEach((_, id) => {
      if (!elementIds.has(id)) {
        this.objects.delete(id);
      }
    });
  }

  /**
   * Get all objects as Excalidraw elements
   */
  toElements(): ExcalidrawElement[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clear all objects
   */
  clear(): void {
    this.objects.clear();
  }

  /**
   * Set layout configuration
   */
  setLayoutConfig(config: Partial<LayoutConfig>): void {
    this.layoutConfig = { ...this.layoutConfig, ...config };
  }
}
