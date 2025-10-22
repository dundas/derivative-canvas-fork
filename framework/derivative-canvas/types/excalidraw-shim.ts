// Runtime-agnostic shim for TypeScript only. Emitted JS keeps the original
// module specifier ("@excalidraw/excalidraw") so bundlers resolve the real package.
export const Excalidraw: any = {} as any;
export default Excalidraw;

// Optional minimal types re-export to satisfy type imports if needed
export type ExcalidrawElement = any;
export type AppState = any;
export type BinaryFiles = Record<string, any>;
