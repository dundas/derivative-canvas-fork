import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBoundingBox,
  getCanvasSummary,
  getElementsByType,
  findElementsWithText,
  getElementsInArea,
  getDistanceBetweenElements,
  findNearestElement,
  areElementsOverlapping,
  getViewportBounds,
  isElementInViewport,
  addElementsToCanvas,
  getSelectedElements,
} from '../canvasHelpers';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types';

describe('canvasHelpers', () => {
  let mockElements: ExcalidrawElement[];
  let mockAppState: AppState;

  beforeEach(() => {
    mockElements = [
      { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 100 },
      { id: '2', type: 'text', x: 300, y: 200, width: 50, height: 20, text: 'Hello World' },
      { id: '3', type: 'ellipse', x: 500, y: 300, width: 80, height: 80 },
    ] as ExcalidrawElement[];

    mockAppState = {
      scrollX: 0,
      scrollY: 0,
      zoom: { value: 1 },
      width: 1000,
      height: 800,
      selectedElementIds: {},
    } as AppState;
  });

  describe('getBoundingBox', () => {
    it('should return null for empty elements array', () => {
      const result = getBoundingBox([]);
      expect(result).toBeNull();
    });

    it('should calculate bounding box for single element', () => {
      const elements = [mockElements[0]];
      const result = getBoundingBox(elements);

      expect(result).toEqual({
        minX: 100,
        minY: 100,
        maxX: 200,
        maxY: 200,
        width: 100,
        height: 100,
      });
    });

    it('should calculate bounding box for multiple elements', () => {
      const result = getBoundingBox(mockElements);

      expect(result).toEqual({
        minX: 100,
        minY: 100,
        maxX: 580, // 500 + 80
        maxY: 380, // 300 + 80
        width: 480,
        height: 280,
      });
    });
  });

  describe('getCanvasSummary', () => {
    it('should generate summary for empty canvas', () => {
      const summary = getCanvasSummary([]);
      expect(summary).toContain('Total elements: 0');
    });

    it('should count element types', () => {
      const summary = getCanvasSummary(mockElements);

      expect(summary).toContain('Total elements: 3');
      expect(summary).toContain('rectangle: 1');
      expect(summary).toContain('text: 1');
      expect(summary).toContain('ellipse: 1');
    });

    it('should extract text content', () => {
      const summary = getCanvasSummary(mockElements);

      expect(summary).toContain('Text content on canvas:');
      expect(summary).toContain('"Hello World"');
    });

    it('should limit text content display', () => {
      const manyTextElements = Array.from({ length: 10 }, (_, i) => ({
        id: `text-${i}`,
        type: 'text',
        text: `Text ${i}`,
        x: 0,
        y: 0,
      })) as ExcalidrawElement[];

      const summary = getCanvasSummary(manyTextElements);

      expect(summary).toContain('and 5 more');
    });
  });

  describe('getElementsByType', () => {
    it('should filter elements by type', () => {
      const rectangles = getElementsByType(mockElements, 'rectangle');
      expect(rectangles.length).toBe(1);
      expect(rectangles[0].type).toBe('rectangle');

      const texts = getElementsByType(mockElements, 'text');
      expect(texts.length).toBe(1);
      expect(texts[0].type).toBe('text');
    });

    it('should return empty array for non-existent type', () => {
      const result = getElementsByType(mockElements, 'arrow');
      expect(result).toEqual([]);
    });
  });

  describe('findElementsWithText', () => {
    it('should find elements containing search text', () => {
      const result = findElementsWithText(mockElements, 'Hello');

      expect(result.length).toBe(1);
      expect((result[0] as any).text).toContain('Hello');
    });

    it('should be case-insensitive', () => {
      const result = findElementsWithText(mockElements, 'hello');

      expect(result.length).toBe(1);
    });

    it('should return empty array when no match', () => {
      const result = findElementsWithText(mockElements, 'NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('getElementsInArea', () => {
    it('should find elements within specified area', () => {
      const area = { x: 0, y: 0, width: 250, height: 250 };
      const result = getElementsInArea(mockElements, area);

      // Should contain first element (rectangle at 100,100)
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(el => el.id === '1')).toBe(true);
    });

    it('should not include elements outside area', () => {
      const area = { x: 0, y: 0, width: 50, height: 50 };
      const result = getElementsInArea(mockElements, area);

      // No elements in this small area
      expect(result.length).toBe(0);
    });

    it('should include partially overlapping elements', () => {
      const area = { x: 150, y: 150, width: 100, height: 100 };
      const result = getElementsInArea(mockElements, area);

      // Rectangle at 100,100 with width/height 100 should partially overlap
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getDistanceBetweenElements', () => {
    it('should calculate distance between element centers', () => {
      const el1 = mockElements[0]; // Rectangle at 100,100
      const el2 = mockElements[1]; // Text at 300,200

      const distance = getDistanceBetweenElements(el1, el2);

      // Center of el1: (150, 150)
      // Center of el2: (325, 210)
      // Distance = sqrt((325-150)^2 + (210-150)^2) = sqrt(30625 + 3600) = ~185.2
      expect(distance).toBeCloseTo(185.2, 0);
    });

    it('should return Infinity for elements without coordinates', () => {
      const el1 = { id: '1', type: 'selection' } as ExcalidrawElement;
      const el2 = mockElements[0];

      const distance = getDistanceBetweenElements(el1, el2);

      expect(distance).toBe(Infinity);
    });
  });

  describe('findNearestElement', () => {
    it('should find nearest element to point', () => {
      const point = { x: 110, y: 110 };
      const nearest = findNearestElement(mockElements, point);

      // Nearest should be first rectangle at 100,100
      expect(nearest?.id).toBe('1');
    });

    it('should return null for empty elements array', () => {
      const point = { x: 100, y: 100 };
      const nearest = findNearestElement([], point);

      expect(nearest).toBeNull();
    });

    it('should find correct element when point is far from all', () => {
      const point = { x: 1000, y: 1000 };
      const nearest = findNearestElement(mockElements, point);

      // Should still return the nearest element (ellipse at 500,300)
      expect(nearest).not.toBeNull();
      expect(nearest?.id).toBe('3');
    });
  });

  describe('areElementsOverlapping', () => {
    it('should detect overlapping elements', () => {
      const el1 = { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 100 } as ExcalidrawElement;
      const el2 = { id: '2', type: 'rectangle', x: 150, y: 150, width: 100, height: 100 } as ExcalidrawElement;

      const overlapping = areElementsOverlapping(el1, el2);

      expect(overlapping).toBe(true);
    });

    it('should detect non-overlapping elements', () => {
      const el1 = { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 100 } as ExcalidrawElement;
      const el2 = { id: '2', type: 'rectangle', x: 300, y: 300, width: 100, height: 100 } as ExcalidrawElement;

      const overlapping = areElementsOverlapping(el1, el2);

      expect(overlapping).toBe(false);
    });

    it('should respect padding parameter', () => {
      const el1 = { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 100 } as ExcalidrawElement;
      const el2 = { id: '2', type: 'rectangle', x: 200, y: 200, width: 100, height: 100 } as ExcalidrawElement;

      // Without padding - not overlapping
      expect(areElementsOverlapping(el1, el2, 0)).toBe(false);

      // With padding - overlapping
      expect(areElementsOverlapping(el1, el2, 50)).toBe(true);
    });

    it('should return false for elements without coordinates', () => {
      const el1 = { id: '1', type: 'selection' } as ExcalidrawElement;
      const el2 = mockElements[0];

      const overlapping = areElementsOverlapping(el1, el2);

      expect(overlapping).toBe(false);
    });
  });

  describe('getViewportBounds', () => {
    it('should calculate viewport bounds with no scroll', () => {
      const bounds = getViewportBounds(mockAppState);

      expect(bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 1000,
        maxY: 800,
      });
    });

    it('should calculate viewport bounds with scroll', () => {
      const scrolledAppState = {
        ...mockAppState,
        scrollX: -200,
        scrollY: -100,
      };

      const bounds = getViewportBounds(scrolledAppState);

      expect(bounds).toEqual({
        minX: 200,
        minY: 100,
        maxX: 1200,
        maxY: 900,
      });
    });

    it('should account for zoom level', () => {
      const zoomedAppState = {
        ...mockAppState,
        zoom: { value: 2 },
      };

      const bounds = getViewportBounds(zoomedAppState);

      expect(bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 500, // 1000 / 2
        maxY: 400, // 800 / 2
      });
    });
  });

  describe('isElementInViewport', () => {
    it('should return true for element in viewport', () => {
      const element = mockElements[0]; // At 100,100
      const inViewport = isElementInViewport(element, mockAppState);

      expect(inViewport).toBe(true);
    });

    it('should return false for element outside viewport', () => {
      const element = {
        id: 'outside',
        type: 'rectangle',
        x: 2000,
        y: 2000,
        width: 100,
        height: 100,
      } as ExcalidrawElement;

      const inViewport = isElementInViewport(element, mockAppState);

      expect(inViewport).toBe(false);
    });

    it('should account for scroll when checking visibility', () => {
      const element = {
        id: 'test',
        type: 'rectangle',
        x: 1100,
        y: 900,
        width: 100,
        height: 100,
      } as ExcalidrawElement;

      // Not visible with no scroll
      expect(isElementInViewport(element, mockAppState)).toBe(false);

      // Visible after scrolling
      const scrolledAppState = {
        ...mockAppState,
        scrollX: -500,
        scrollY: -500,
      };
      expect(isElementInViewport(element, scrolledAppState)).toBe(true);
    });

    it('should return false for elements without coordinates', () => {
      const element = { id: '1', type: 'selection' } as ExcalidrawElement;

      const inViewport = isElementInViewport(element, mockAppState);

      expect(inViewport).toBe(false);
    });
  });

  describe('addElementsToCanvas', () => {
    it('should add elements via API', () => {
      const mockAPI = {
        addElement: vi.fn(),
      };

      const newElements = [
        { id: 'new-1', type: 'rectangle', x: 0, y: 0 },
        { id: 'new-2', type: 'text', x: 100, y: 100 },
      ];

      addElementsToCanvas(mockAPI as any, newElements);

      expect(mockAPI.addElement).toHaveBeenCalledTimes(2);
    });

    it('should add default properties to elements', () => {
      const mockAPI = {
        addElement: vi.fn(),
      };

      const newElements = [
        { id: 'new-1', type: 'rectangle' },
      ];

      addElementsToCanvas(mockAPI as any, newElements);

      const addedElement = mockAPI.addElement.mock.calls[0][0];

      expect(addedElement.version).toBe(1);
      expect(addedElement.isDeleted).toBe(false);
      expect(addedElement.locked).toBe(false);
      expect(addedElement.versionNonce).toBeDefined();
    });

    it('should handle empty elements array', () => {
      const mockAPI = {
        addElement: vi.fn(),
      };

      addElementsToCanvas(mockAPI as any, []);

      expect(mockAPI.addElement).not.toHaveBeenCalled();
    });
  });

  describe('getSelectedElements', () => {
    it('should return selected elements', () => {
      const appStateWithSelection = {
        ...mockAppState,
        selectedElementIds: { '1': true, '3': true },
      };

      const selected = getSelectedElements(mockElements, appStateWithSelection);

      expect(selected.length).toBe(2);
      expect(selected.map(el => el.id)).toEqual(['1', '3']);
    });

    it('should return empty array when nothing selected', () => {
      const selected = getSelectedElements(mockElements, mockAppState);

      expect(selected).toEqual([]);
    });

    it('should handle null selectedElementIds', () => {
      const appStateNoSelection = {
        ...mockAppState,
        selectedElementIds: null,
      };

      const selected = getSelectedElements(mockElements, appStateNoSelection as any);

      expect(selected).toEqual([]);
    });
  });
});
