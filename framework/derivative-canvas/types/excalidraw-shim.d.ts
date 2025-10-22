declare module '@excalidraw/excalidraw' {
  import * as React from 'react';
  // Minimal typings to allow compilation; consumers should rely on real package types
  export const Excalidraw: React.ComponentType<any>;
  const _default: any;
  export default _default;
}

declare module '@excalidraw/excalidraw/types' {
  // Minimal type surface needed by the framework
  export type ExcalidrawElement = any;
  export type AppState = any;
  export type BinaryFiles = Record<string, any>;
}

declare module '@excalidraw/*';
