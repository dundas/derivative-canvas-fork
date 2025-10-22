import { describe, it, expect, beforeEach } from 'vitest';
import { PlacementEngine, placementEngine } from '../placementEngine';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types';

describe('PlacementEngine', () => {
  let engine: PlacementEngine;
  let mockElements: ExcalidrawElement[];
  let mockAppState: AppState;

  beforeEach(() => {
    engine = new PlacementEngine();
    mockElements = [];
    mockAppState = {
      scrollX: 0,
      scrollY: 0,
      zoom: { value: 1 },
      width: 1000,
      height: 800,
    } as AppState;
  });

  describe('findOptimalPosition', () => {
    it('should place element in viewport center when no elements exist', () => {
      const result = engine.findOptimalPosition(
        mockElements,
        mockAppState,
        {
          width: 200,
          height: 100,
          strategy: 'viewport-center',
        }
      );

      // Viewport center: (width/2 - elementWidth/2, height/2 - elementHeight/2)
      expect(result.x).toBe(400); // 1000/2 - 200/2
      expect(result.y).toBe(350); // 800/2 - 100/2
    });

    it('should avoid overlapping existing elements', () => {
      const existingElement = {
        id: 'test-1',
        type: 'rectangle',
        x: 400,
        y: 350,
        width: 200,
        height: 100,
      } as ExcalidrawElement;

      mockElements = [existingElement];

      const result = engine.findOptimalPosition(
        mockElements,
        mockAppState,
        {
          width: 200,
          height: 100,
          strategy: 'viewport-center',
          avoidOverlap: true,
          padding: 20,
        }
      );

      // Should not be at exact same position
      const isSamePosition = result.x === 400 && result.y === 350;
      expect(isSamePosition).toBe(false);
    });

    it('should snap to grid when using grid strategy', () => {
      const result = engine.findOptimalPosition(
        mockElements,
        mockAppState,
        {
          width: 200,
          height: 100,
          strategy: 'grid',
          preferredX: 123,
          preferredY: 456,
        }
      );

      // Should be snapped to 50px grid
      expect(result.x % 50).toBe(0);
      expect(result.y % 50).toBe(0);
    });

    it('should place elements in flow layout', () => {
      const element1 = {
        id: 'test-1',
        type: 'rectangle',
        x: 20,
        y: 20,
        width: 100,
        height: 100,
      } as ExcalidrawElement;

      mockElements = [element1];

      const result = engine.findOptimalPosition(
        mockElements,
        mockAppState,
        {
          width: 100,
          height: 100,
          strategy: 'flow',
          avoidOverlap: true,
        }
      );

      // Should be placed to the right with padding
      expect(result.x).toBeGreaterThan(element1.x + element1.width);
      expect(result.y).toBe(element1.y);
    });

    it('should place near target element with proximity strategy', () => {
      const targetElement = {
        id: 'test-1',
        type: 'rectangle',
        x: 500,
        y: 500,
        width: 100,
        height: 100,
      } as ExcalidrawElement;

      mockElements = [targetElement];

      const result = engine.findOptimalPosition(
        mockElements,
        mockAppState,
        {
          width: 100,
          height: 100,
          strategy: 'proximity',
          nearElement: targetElement,
          padding: 20,
        }
      );

      // Calculate distance from target
      const distance = Math.sqrt(
        Math.pow(result.x - targetElement.x, 2) +
        Math.pow(result.y - targetElement.y, 2)
      );

      // Should be relatively close (within 300px)
      expect(distance).toBeLessThan(300);
    });
  });

  describe('hasOverlap', () => {
    it('should detect overlap between elements', () => {
      const element = {
        id: 'test-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      } as ExcalidrawElement;

      mockElements = [element];

      // @ts-ignore - accessing private method for testing
      const hasOverlap = engine.hasOverlap(mockElements, 150, 150, 50, 50, 0);
      expect(hasOverlap).toBe(true);
    });

    it('should not detect overlap when elements are separated', () => {
      const element = {
        id: 'test-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      } as ExcalidrawElement;

      mockElements = [element];

      // @ts-ignore - accessing private method for testing
      const hasOverlap = engine.hasOverlap(mockElements, 300, 300, 50, 50, 0);
      expect(hasOverlap).toBe(false);
    });

    it('should respect padding when detecting overlap', () => {
      const element = {
        id: 'test-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      } as ExcalidrawElement;

      mockElements = [element];

      // Without padding - no overlap
      // @ts-ignore
      const noOverlap = engine.hasOverlap(mockElements, 200, 200, 50, 50, 0);
      expect(noOverlap).toBe(false);

      // With padding - should overlap
      // @ts-ignore
      const withOverlap = engine.hasOverlap(mockElements, 200, 200, 50, 50, 20);
      expect(withOverlap).toBe(true);
    });
  });

  describe('getBoundingBox', () => {
    it('should return null for empty element array', () => {
      const result = engine.getBoundingBox([]);
      expect(result).toBeNull();
    });

    it('should calculate correct bounding box for single element', () => {
      const element = {
        id: 'test-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
      } as ExcalidrawElement;

      const result = engine.getBoundingBox([element]);

      expect(result).toEqual({
        minX: 100,
        minY: 200,
        maxX: 250,
        maxY: 300,
        width: 150,
        height: 100,
      });
    });

    it('should calculate correct bounding box for multiple elements', () => {
      const elements = [
        { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 100 },
        { id: '2', type: 'rectangle', x: 300, y: 200, width: 100, height: 100 },
        { id: '3', type: 'rectangle', x: 50, y: 150, width: 50, height: 50 },
      ] as ExcalidrawElement[];

      const result = engine.getBoundingBox(elements);

      expect(result).toEqual({
        minX: 50,
        minY: 100,
        maxX: 400,
        maxY: 300,
        width: 350,
        height: 200,
      });
    });
  });

  describe('snapToGrid', () => {
    it('should snap value to nearest grid position', () => {
      expect(engine.snapToGrid(0)).toBe(0);
      expect(engine.snapToGrid(24)).toBe(0);
      expect(engine.snapToGrid(25)).toBe(50);
      expect(engine.snapToGrid(49)).toBe(50);
      expect(engine.snapToGrid(75)).toBe(100);
      expect(engine.snapToGrid(123)).toBe(100);
      expect(engine.snapToGrid(126)).toBe(150);
    });

    it('should handle negative values', () => {
      expect(engine.snapToGrid(-24)).toBe(0);
      expect(engine.snapToGrid(-26)).toBe(-50);
      expect(engine.snapToGrid(-75)).toBe(-100);
    });
  });

  describe('getSpiralPositions', () => {
    it('should return 8 positions in spiral pattern', () => {
      // @ts-ignore - accessing private method for testing
      const positions = engine.getSpiralPositions(100, 100, 50);

      expect(positions).toHaveLength(8);

      // Verify positions are around the center
      expect(positions).toContainEqual({ x: 150, y: 100 }); // right
      expect(positions).toContainEqual({ x: 100, y: 150 }); // down
      expect(positions).toContainEqual({ x: 50, y: 100 }); // left
      expect(positions).toContainEqual({ x: 100, y: 50 }); // up
      expect(positions).toContainEqual({ x: 150, y: 150 }); // diagonal bottom-right
      expect(positions).toContainEqual({ x: 50, y: 150 }); // diagonal bottom-left
      expect(positions).toContainEqual({ x: 150, y: 50 }); // diagonal top-right
      expect(positions).toContainEqual({ x: 50, y: 50 }); // diagonal top-left
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(placementEngine).toBeInstanceOf(PlacementEngine);
    });
  });
});
