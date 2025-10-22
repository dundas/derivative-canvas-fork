import type { ExcalidrawElement, AppState } from "@excalidraw/excalidraw/types";

export interface PlacementOptions {
  preferredX?: number;
  preferredY?: number;
  width: number;
  height: number;
  padding?: number;
  strategy?: 'grid' | 'flow' | 'proximity' | 'viewport-center';
  nearElement?: ExcalidrawElement;
  avoidOverlap?: boolean;
}

export interface PlacementResult {
  x: number;
  y: number;
}

export class PlacementEngine {
  private readonly GRID_SIZE = 50;
  private readonly DEFAULT_PADDING = 20;
  private readonly MAX_ATTEMPTS = 50;

  /**
   * Find an optimal position for a new element on the canvas
   */
  findOptimalPosition(
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    options: PlacementOptions
  ): PlacementResult {
    const padding = options.padding ?? this.DEFAULT_PADDING;

    switch (options.strategy) {
      case 'grid':
        return this.gridBasedPlacement(elements, options, padding);
      case 'flow':
        return this.flowBasedPlacement(elements, options, padding);
      case 'proximity':
        return this.proximityBasedPlacement(elements, options, padding);
      case 'viewport-center':
      default:
        return this.viewportCenterPlacement(elements, appState, options, padding);
    }
  }

  /**
   * Place element in the center of the current viewport
   */
  private viewportCenterPlacement(
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    options: PlacementOptions,
    padding: number
  ): PlacementResult {
    // Calculate viewport center in scene coordinates
    const viewportCenterX = -appState.scrollX + appState.width / 2 / appState.zoom.value;
    const viewportCenterY = -appState.scrollY + appState.height / 2 / appState.zoom.value;

    // Center the element
    let x = viewportCenterX - options.width / 2;
    let y = viewportCenterY - options.height / 2;

    // Avoid overlaps if requested
    if (options.avoidOverlap) {
      const position = this.findNearestNonOverlappingPosition(
        elements,
        { x, y },
        options.width,
        options.height,
        padding
      );
      x = position.x;
      y = position.y;
    }

    return { x, y };
  }

  /**
   * Place element on a grid for clean alignment
   */
  private gridBasedPlacement(
    elements: readonly ExcalidrawElement[],
    options: PlacementOptions,
    padding: number
  ): PlacementResult {
    const startX = options.preferredX ?? 0;
    const startY = options.preferredY ?? 0;

    // Snap to grid
    let x = Math.round(startX / this.GRID_SIZE) * this.GRID_SIZE;
    let y = Math.round(startY / this.GRID_SIZE) * this.GRID_SIZE;

    // Find next available grid position
    if (options.avoidOverlap) {
      for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
        if (!this.hasOverlap(elements, x, y, options.width, options.height, padding)) {
          return { x, y };
        }

        // Try next grid position (spiral pattern)
        const offset = Math.floor(attempt / 4) + 1;
        const direction = attempt % 4;

        switch (direction) {
          case 0: x += this.GRID_SIZE * offset; break; // right
          case 1: y += this.GRID_SIZE * offset; break; // down
          case 2: x -= this.GRID_SIZE * offset; break; // left
          case 3: y -= this.GRID_SIZE * offset; break; // up
        }
      }
    }

    return { x, y };
  }

  /**
   * Place element in a flowing layout (left-to-right, top-to-bottom)
   */
  private flowBasedPlacement(
    elements: readonly ExcalidrawElement[],
    options: PlacementOptions,
    padding: number
  ): PlacementResult {
    if (elements.length === 0) {
      return { x: padding, y: padding };
    }

    // Find the rightmost and bottommost element
    let maxX = 0;
    let maxY = 0;
    let maxXElement: ExcalidrawElement | null = null;

    for (const element of elements) {
      if ('x' in element && 'y' in element) {
        const elementRight = element.x + ('width' in element ? element.width : 0);
        const elementBottom = element.y + ('height' in element ? element.height : 0);

        if (elementRight > maxX) {
          maxX = elementRight;
          maxXElement = element;
        }
        if (elementBottom > maxY) {
          maxY = elementBottom;
        }
      }
    }

    // Try to place to the right of the last element
    let x = maxX + padding;
    let y = maxXElement ? maxXElement.y : padding;

    // Check if it fits in the flow (assuming max width of 2000)
    const MAX_FLOW_WIDTH = 2000;
    if (x + options.width > MAX_FLOW_WIDTH) {
      // Move to next row
      x = padding;
      y = maxY + padding;
    }

    // Verify no overlap
    if (options.avoidOverlap) {
      const position = this.findNearestNonOverlappingPosition(
        elements,
        { x, y },
        options.width,
        options.height,
        padding
      );
      return position;
    }

    return { x, y };
  }

  /**
   * Place element near another specific element
   */
  private proximityBasedPlacement(
    elements: readonly ExcalidrawElement[],
    options: PlacementOptions,
    padding: number
  ): PlacementResult {
    if (!options.nearElement) {
      return this.flowBasedPlacement(elements, options, padding);
    }

    const target = options.nearElement;
    if (!('x' in target && 'y' in target)) {
      return this.flowBasedPlacement(elements, options, padding);
    }

    // Try positions around the target element
    const targetWidth = 'width' in target ? target.width : 100;
    const targetHeight = 'height' in target ? target.height : 100;

    const positions = [
      // Right of target
      { x: target.x + targetWidth + padding, y: target.y },
      // Below target
      { x: target.x, y: target.y + targetHeight + padding },
      // Left of target
      { x: target.x - options.width - padding, y: target.y },
      // Above target
      { x: target.x, y: target.y - options.height - padding },
      // Diagonal bottom-right
      { x: target.x + targetWidth + padding, y: target.y + targetHeight + padding },
    ];

    // Find first position without overlap
    for (const pos of positions) {
      if (!this.hasOverlap(elements, pos.x, pos.y, options.width, options.height, padding)) {
        return pos;
      }
    }

    // Fallback to flow placement
    return this.flowBasedPlacement(elements, options, padding);
  }

  /**
   * Check if a position would overlap with existing elements
   */
  private hasOverlap(
    elements: readonly ExcalidrawElement[],
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number
  ): boolean {
    for (const element of elements) {
      if ('x' in element && 'y' in element) {
        const elementWidth = 'width' in element ? element.width : 0;
        const elementHeight = 'height' in element ? element.height : 0;

        // Check for overlap with padding
        if (
          x < element.x + elementWidth + padding &&
          x + width + padding > element.x &&
          y < element.y + elementHeight + padding &&
          y + height + padding > element.y
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Find nearest position that doesn't overlap
   */
  private findNearestNonOverlappingPosition(
    elements: readonly ExcalidrawElement[],
    preferred: { x: number; y: number },
    width: number,
    height: number,
    padding: number
  ): PlacementResult {
    // Start with preferred position
    let x = preferred.x;
    let y = preferred.y;

    // If no overlap, return immediately
    if (!this.hasOverlap(elements, x, y, width, height, padding)) {
      return { x, y };
    }

    // Try positions in a spiral pattern
    const STEP = 50;
    for (let radius = 1; radius < this.MAX_ATTEMPTS; radius++) {
      const positions = this.getSpiralPositions(preferred.x, preferred.y, radius * STEP);

      for (const pos of positions) {
        if (!this.hasOverlap(elements, pos.x, pos.y, width, height, padding)) {
          return pos;
        }
      }
    }

    // Fallback to offset position
    return { x: x + STEP, y: y + STEP };
  }

  /**
   * Get positions in a spiral pattern around a center point
   */
  private getSpiralPositions(centerX: number, centerY: number, radius: number): PlacementResult[] {
    return [
      { x: centerX + radius, y: centerY }, // right
      { x: centerX, y: centerY + radius }, // down
      { x: centerX - radius, y: centerY }, // left
      { x: centerX, y: centerY - radius }, // up
      { x: centerX + radius, y: centerY + radius }, // diagonal bottom-right
      { x: centerX - radius, y: centerY + radius }, // diagonal bottom-left
      { x: centerX + radius, y: centerY - radius }, // diagonal top-right
      { x: centerX - radius, y: centerY - radius }, // diagonal top-left
    ];
  }

  /**
   * Snap coordinate to grid
   */
  snapToGrid(value: number): number {
    return Math.round(value / this.GRID_SIZE) * this.GRID_SIZE;
  }

  /**
   * Calculate bounding box for multiple elements
   */
  getBoundingBox(elements: readonly ExcalidrawElement[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } | null {
    if (elements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      if ('x' in element && 'y' in element) {
        const elementWidth = 'width' in element ? element.width : 0;
        const elementHeight = 'height' in element ? element.height : 0;

        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + elementWidth);
        maxY = Math.max(maxY, element.y + elementHeight);
      }
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}

// Singleton instance
export const placementEngine = new PlacementEngine();
