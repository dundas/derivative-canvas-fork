import type { ExcalidrawElement, AppState } from "@excalidraw/excalidraw/types";
import type { ExcalidrawFrameworkAPI } from "../../../core/types";

/**
 * Helper utilities for canvas operations
 */

/**
 * Add elements to the canvas
 */
export function addElementsToCanvas(
  api: ExcalidrawFrameworkAPI,
  newElements: any[]
): void {
  if (!newElements || newElements.length === 0) return;

  // Add required properties to elements
  const elementsWithDefaults = newElements.map(element => ({
    ...element,
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  }));

  // Add elements to canvas
  for (const element of elementsWithDefaults) {
    api.addElement(element);
  }
}

/**
 * Get selected elements from canvas
 */
export function getSelectedElements(
  elements: readonly ExcalidrawElement[],
  appState: AppState
): ExcalidrawElement[] {
  const selectedIds = appState.selectedElementIds || {};
  return elements.filter(el => selectedIds[el.id]) as ExcalidrawElement[];
}

/**
 * Calculate bounding box for elements
 */
export function getBoundingBox(elements: readonly ExcalidrawElement[]): {
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
      const width = 'width' in element ? element.width : 0;
      const height = 'height' in element ? element.height : 0;

      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + width);
      maxY = Math.max(maxY, element.y + height);
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

/**
 * Scroll canvas to show specific elements
 */
export function scrollToElements(
  api: ExcalidrawFrameworkAPI,
  elementIds: string[]
): void {
  if (elementIds.length === 0) return;

  // Select the elements first (this typically triggers scrolling)
  api.selectElements(elementIds);
}

/**
 * Group elements together
 */
export function groupElements(
  api: ExcalidrawFrameworkAPI,
  elementIds: string[]
): void {
  if (elementIds.length === 0) return;

  // Select elements
  api.selectElements(elementIds);

  // The grouping would typically be done through the API
  // This is a placeholder for the actual grouping logic
  console.log('Grouping elements:', elementIds);
}

/**
 * Get canvas summary for AI context
 */
export function getCanvasSummary(
  elements: readonly ExcalidrawElement[]
): string {
  const elementCounts: Record<string, number> = {};
  const textContent: string[] = [];

  for (const element of elements) {
    // Count by type
    elementCounts[element.type] = (elementCounts[element.type] || 0) + 1;

    // Extract text content
    if (element.type === 'text' && 'text' in element) {
      textContent.push((element as any).text);
    }
  }

  const summary = [
    `Total elements: ${elements.length}`,
    '',
    'Element types:',
    ...Object.entries(elementCounts).map(([type, count]) => `  ${type}: ${count}`),
  ];

  if (textContent.length > 0) {
    summary.push('', 'Text content on canvas:', ...textContent.slice(0, 5).map(t => `  "${t}"`));
    if (textContent.length > 5) {
      summary.push(`  ... and ${textContent.length - 5} more`);
    }
  }

  return summary.join('\n');
}

/**
 * Find elements by type
 */
export function getElementsByType(
  elements: readonly ExcalidrawElement[],
  type: string
): ExcalidrawElement[] {
  return elements.filter(el => el.type === type) as ExcalidrawElement[];
}

/**
 * Find elements containing text
 */
export function findElementsWithText(
  elements: readonly ExcalidrawElement[],
  searchText: string
): ExcalidrawElement[] {
  const lowerSearch = searchText.toLowerCase();
  return elements.filter(el => {
    if (el.type === 'text' && 'text' in el) {
      return (el as any).text.toLowerCase().includes(lowerSearch);
    }
    return false;
  }) as ExcalidrawElement[];
}

/**
 * Get elements in a specific area
 */
export function getElementsInArea(
  elements: readonly ExcalidrawElement[],
  area: { x: number; y: number; width: number; height: number }
): ExcalidrawElement[] {
  return elements.filter(el => {
    if (!('x' in el && 'y' in el)) return false;

    const elWidth = 'width' in el ? el.width : 0;
    const elHeight = 'height' in el ? el.height : 0;

    // Check if element overlaps with area
    return (
      el.x < area.x + area.width &&
      el.x + elWidth > area.x &&
      el.y < area.y + area.height &&
      el.y + elHeight > area.y
    );
  }) as ExcalidrawElement[];
}

/**
 * Calculate distance between two elements
 */
export function getDistanceBetweenElements(
  el1: ExcalidrawElement,
  el2: ExcalidrawElement
): number {
  if (!('x' in el1 && 'y' in el1 && 'x' in el2 && 'y' in el2)) {
    return Infinity;
  }

  const centerX1 = el1.x + ('width' in el1 ? el1.width / 2 : 0);
  const centerY1 = el1.y + ('height' in el1 ? el1.height / 2 : 0);
  const centerX2 = el2.x + ('width' in el2 ? el2.width / 2 : 0);
  const centerY2 = el2.y + ('height' in el2 ? el2.height / 2 : 0);

  return Math.sqrt(
    Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
  );
}

/**
 * Find nearest element to a point
 */
export function findNearestElement(
  elements: readonly ExcalidrawElement[],
  point: { x: number; y: number }
): ExcalidrawElement | null {
  let nearest: ExcalidrawElement | null = null;
  let minDistance = Infinity;

  for (const element of elements) {
    if (!('x' in element && 'y' in element)) continue;

    const centerX = element.x + ('width' in element ? element.width / 2 : 0);
    const centerY = element.y + ('height' in element ? element.height / 2 : 0);

    const distance = Math.sqrt(
      Math.pow(centerX - point.x, 2) + Math.pow(centerY - point.y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = element as ExcalidrawElement;
    }
  }

  return nearest;
}

/**
 * Check if two elements are overlapping
 */
export function areElementsOverlapping(
  el1: ExcalidrawElement,
  el2: ExcalidrawElement,
  padding: number = 0
): boolean {
  if (!('x' in el1 && 'y' in el1 && 'x' in el2 && 'y' in el2)) {
    return false;
  }

  const width1 = 'width' in el1 ? el1.width : 0;
  const height1 = 'height' in el1 ? el1.height : 0;
  const width2 = 'width' in el2 ? el2.width : 0;
  const height2 = 'height' in el2 ? el2.height : 0;

  return (
    el1.x < el2.x + width2 + padding &&
    el1.x + width1 + padding > el2.x &&
    el1.y < el2.y + height2 + padding &&
    el1.y + height1 + padding > el2.y
  );
}

/**
 * Get viewport bounds in scene coordinates
 */
export function getViewportBounds(appState: AppState): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const zoom = appState.zoom.value;
  const scrollX = appState.scrollX;
  const scrollY = appState.scrollY;
  const width = appState.width;
  const height = appState.height;

  return {
    minX: -scrollX,
    minY: -scrollY,
    maxX: -scrollX + width / zoom,
    maxY: -scrollY + height / zoom,
  };
}

/**
 * Check if element is visible in viewport
 */
export function isElementInViewport(
  element: ExcalidrawElement,
  appState: AppState
): boolean {
  if (!('x' in element && 'y' in element)) return false;

  const viewport = getViewportBounds(appState);
  const elWidth = 'width' in element ? element.width : 0;
  const elHeight = 'height' in element ? element.height : 0;

  return (
    element.x + elWidth > viewport.minX &&
    element.x < viewport.maxX &&
    element.y + elHeight > viewport.minY &&
    element.y < viewport.maxY
  );
}
