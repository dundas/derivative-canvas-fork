// Minimal local type definitions to avoid importing Excalidraw sources
export type ExcalidrawElement = any;
export type AppState = any;
export type BinaryFiles = Record<string, any>;

// Core Framework Types
export interface ExcalidrawFrameworkConfig {
  auth: {
    provider: "nextauth" | "clerk" | "auth0" | "custom";
    adapter: AuthAdapter;
  };
  storage: {
    provider: "mongodb" | "postgres" | "firebase" | "supabase" | "localStorage";
    adapter: StorageAdapter;
  };
  plugins: PluginConfig[];
  layout: "canvas" | "hybrid" | "minimal";
  theme?: ExcalidrawTheme;
  collaboration?: CollaborationConfig;
}

// Auth Types
export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  role?: string;
  metadata?: Record<string, any>;
}

export interface AuthAdapter {
  getCurrentUser(): Promise<User | null>;
  signIn(provider?: string): Promise<void>;
  signOut(): Promise<void>;
  getToken(): Promise<string | null>;
  isAuthenticated(): Promise<boolean>;
}

// Storage Types
export interface CanvasData {
  id: string;
  name: string;
  elements: ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  metadata?: Record<string, any>;
}

export interface CanvasMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  thumbnail?: string;
  isPublic?: boolean;
  collaborators?: string[];
}

export interface StorageAdapter {
  saveCanvas(userId: string, canvasId: string, data: CanvasData): Promise<void>;
  loadCanvas(userId: string, canvasId: string): Promise<CanvasData | null>;
  listCanvases(userId: string): Promise<CanvasMetadata[]>;
  deleteCanvas(userId: string, canvasId: string): Promise<void>;
  shareCanvas(
    userId: string,
    canvasId: string,
    permissions: SharePermissions,
  ): Promise<string>;
}

export interface SharePermissions {
  type: "view" | "edit" | "admin";
  users?: string[];
  public?: boolean;
  expiresAt?: Date;
}

// Plugin Types
export interface ExcalidrawPlugin {
  id: string;
  name: string;
  version: string;
  type:
    | "ai-chat"
    | "media-input"
    | "integration"
    | "ui-enhancement"
    | "workflow";

  // Lifecycle hooks
  onMount?: (context: PluginContext) => void;
  onUnmount?: () => void;
  onElementsChange?: (elements: ExcalidrawElement[]) => void;
  onAppStateChange?: (appState: AppState) => void;
  onCanvasLoad?: (canvasData: CanvasData) => void;
  onCanvasSave?: (canvasData: CanvasData) => void;

  // UI integration
  ui?: {
    toolbar?: React.ComponentType<PluginUIProps>[];
    sidebar?: React.ComponentType<PluginUIProps>[];
    dialogs?: React.ComponentType<PluginUIProps>[];
    contextMenu?: ContextMenuItem[];
    overlay?: React.ComponentType<PluginUIProps>[];
  };

  // Capabilities
  capabilities: {
    requiresAuth?: boolean;
    requiresStorage?: boolean;
    requiresNetwork?: boolean;
    permissions?: Permission[];
  };

  // Configuration
  config?: Record<string, any>;
  defaultConfig?: Record<string, any>;
}

export interface PluginContext {
  user: User | null;
  canvas: {
    elements: ExcalidrawElement[];
    appState: AppState;
    files: BinaryFiles;
  };
  storage: StorageAdapter;
  auth: AuthAdapter;
  framework: ExcalidrawFrameworkAPI;
}

export interface PluginUIProps {
  context: PluginContext;
  plugin: ExcalidrawPlugin;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType;
  onClick: (context: PluginContext) => void;
  condition?: (context: PluginContext) => boolean;
}

export interface PluginConfig {
  pluginId: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export type Permission =
  | "canvas:read"
  | "canvas:write"
  | "canvas:delete"
  | "canvas:share"
  | "microphone"
  | "camera"
  | "screen-capture"
  | "file-upload"
  | "ai-access";

// Framework API
export interface ExcalidrawFrameworkAPI {
  // Plugin management
  registerPlugin(plugin: ExcalidrawPlugin): void;
  unregisterPlugin(pluginId: string): void;
  getPlugin(pluginId: string): ExcalidrawPlugin | null;
  listPlugins(): ExcalidrawPlugin[];
  getPluginsByType(type: ExcalidrawPlugin["type"]): ExcalidrawPlugin[];

  // Canvas operations
  updateElements(elements: ExcalidrawElement[]): void;
  updateAppState(appState: Partial<AppState>): void;
  addElement(element: ExcalidrawElement): void;
  removeElement(elementId: string): void;
  selectElements(elementIds: string[]): void;

  // Storage operations
  saveCanvas(name?: string): Promise<string>;
  loadCanvas(canvasId: string): Promise<void>;
  createNewCanvas(): void;
  duplicateCanvas(canvasId: string): Promise<string>;

  // Collaboration
  shareCanvas(permissions: SharePermissions): Promise<string>;
  inviteCollaborator(email: string, permission: "view" | "edit"): Promise<void>;

  // Events
  on(event: FrameworkEvent, handler: (...args: any[]) => void): void;
  off(event: FrameworkEvent, handler: (...args: any[]) => void): void;
  emit(event: FrameworkEvent, ...args: any[]): void;
}

export type FrameworkEvent =
  | "plugin:mounted"
  | "plugin:unmounted"
  | "canvas:loaded"
  | "canvas:saved"
  | "canvas:shared"
  | "elements:changed"
  | "appstate:changed"
  | "user:changed"
  | "collaboration:joined"
  | "collaboration:left"
  | "audio-input:transcription"
  | "transcription:complete";

// Theme Types
export interface ExcalidrawTheme {
  canvasBackground: string;
  elementStroke: string;
  elementBackground: string;
  elementFill: string;
  textColor: string;
  uiBackground: string;
  uiBorder: string;
  uiText: string;
  selectionStroke: string;
  selectionFill: string;
}

// Collaboration Types
export interface CollaborationConfig {
  enabled: boolean;
  provider: "yjs" | "socket.io" | "custom";
  serverUrl?: string;
  roomId?: string;
  maxCollaborators?: number;
}

// Layout Types
export interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  headerComponent?: React.ComponentType;
  toolbarComponent?: React.ComponentType;
  sidebarComponent?: React.ComponentType;
}

// Error Types
export class ExcalidrawFrameworkError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "ExcalidrawFrameworkError";
  }
}

export type ErrorCode =
  | "AUTH_REQUIRED"
  | "PLUGIN_NOT_FOUND"
  | "STORAGE_ERROR"
  | "PERMISSION_DENIED"
  | "CANVAS_NOT_FOUND"
  | "COLLABORATION_ERROR";
