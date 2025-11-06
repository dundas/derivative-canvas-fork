// Core exports
export {
  ExcalidrawProvider,
  useExcalidrawFramework,
} from "./ExcalidrawProvider";
export { PluginManager } from "./PluginManager";
export { EventEmitter } from "./EventEmitter";

// Types
export type {
  ExcalidrawFrameworkConfig,
  ExcalidrawPlugin,
  PluginContext,
  PluginUIProps,
  AuthAdapter,
  StorageAdapter,
  User,
  CanvasData,
  CanvasMetadata,
  SharePermissions,
  ExcalidrawFrameworkAPI,
  FrameworkEvent,
  Permission,
  PluginConfig,
  ContextMenuItem,
  ExcalidrawTheme,
  CollaborationConfig,
  LayoutProps,
  ExcalidrawFrameworkError,
  ErrorCode,
} from "./types";

// Layouts
export { ExcalidrawLayout } from "../layouts/ExcalidrawLayout";

// Auth adapters
export {
  createNextAuthAdapter,
  createServerNextAuthAdapter,
} from "../utils/auth-adapters/nextauth";

// Storage adapters
export {
  createMongoDBAdapter,
  createMongoDBAPIRoutes,
} from "../utils/storage-adapters/mongodb";

// Plugins
export { AIChatPlugin } from "../plugins/ai-chat/AIChatPlugin";
