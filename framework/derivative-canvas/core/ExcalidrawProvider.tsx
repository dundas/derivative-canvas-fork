"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { PluginManager } from "./PluginManager";
import { EventEmitter } from "./EventEmitter";

import type {
  ExcalidrawFrameworkConfig,
  ExcalidrawFrameworkAPI,
  User,
  PluginContext,
  FrameworkEvent,
} from "./types";

interface ExcalidrawFrameworkContextType {
  config: ExcalidrawFrameworkConfig;
  api: ExcalidrawFrameworkAPI;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const ExcalidrawFrameworkContext =
  createContext<ExcalidrawFrameworkContextType | null>(null);

export const useExcalidrawFramework = () => {
  const context = useContext(ExcalidrawFrameworkContext);
  if (!context) {
    throw new Error(
      "useExcalidrawFramework must be used within ExcalidrawProvider",
    );
  }
  return context;
};

interface ExcalidrawProviderProps {
  children: React.ReactNode;
  config: ExcalidrawFrameworkConfig;
}

export const ExcalidrawProvider: React.FC<ExcalidrawProviderProps> = ({
  children,
  config,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pluginManager] = useState(() => new PluginManager());
  const [eventEmitter] = useState(() => new EventEmitter());

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await config.auth.adapter.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Auth initialization failed"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [config.auth.adapter]);

  // Initialize plugins
  useEffect(() => {
    const initPlugins = async () => {
      try {
        for (const pluginConfig of config.plugins) {
          if (pluginConfig.enabled) {
            // Plugin will be dynamically loaded
            // await pluginManager.loadPlugin(pluginConfig.pluginId, pluginConfig.config);
          }
        }
      } catch (err) {
        console.error("Plugin initialization failed:", err);
      }
    };

    if (!isLoading && user) {
      initPlugins();
    }
  }, [config.plugins, isLoading, user, pluginManager]);

  // Create framework API
  const createFrameworkAPI = (): ExcalidrawFrameworkAPI => ({
    // Plugin management
    registerPlugin: (plugin) => {
      pluginManager.register(plugin);
      eventEmitter.emit("plugin:mounted", plugin);
    },

    unregisterPlugin: (pluginId) => {
      const plugin = pluginManager.get(pluginId);
      if (plugin) {
        pluginManager.unregister(pluginId);
        eventEmitter.emit("plugin:unmounted", plugin);
      }
    },

    getPlugin: (pluginId) => pluginManager.get(pluginId),
    listPlugins: () => pluginManager.list(),
    getPluginsByType: (type) => pluginManager.getByType(type),

    // Canvas operations (to be implemented with Excalidraw integration)
    updateElements: (elements) => {
      // Implementation depends on Excalidraw instance
      eventEmitter.emit("elements:changed", elements);
    },

    updateAppState: (appState) => {
      // Implementation depends on Excalidraw instance
      eventEmitter.emit("appstate:changed", appState);
    },

    addElement: (element) => {
      // Implementation depends on Excalidraw instance
    },

    removeElement: (elementId) => {
      // Implementation depends on Excalidraw instance
    },

    selectElements: (elementIds) => {
      // Implementation depends on Excalidraw instance
    },

    // Storage operations
    saveCanvas: async (name) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      // Implementation depends on current canvas state
      const canvasId = Date.now().toString(); // temporary
      eventEmitter.emit("canvas:saved", canvasId);
      return canvasId;
    },

    loadCanvas: async (canvasId) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const canvasData = await config.storage.adapter.loadCanvas(
        user.id,
        canvasId,
      );
      if (canvasData) {
        eventEmitter.emit("canvas:loaded", canvasData);
      }
    },

    createNewCanvas: () => {
      // Reset canvas to initial state
    },

    duplicateCanvas: async (canvasId) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      // Load canvas and save as new
      const newId = Date.now().toString(); // temporary
      return newId;
    },

    // Collaboration
    shareCanvas: async (permissions) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      // Generate share link
      const shareId = Date.now().toString(); // temporary
      eventEmitter.emit("canvas:shared", shareId);
      return shareId;
    },

    inviteCollaborator: async (email, permission) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      // Send invitation
    },

    // Events
    on: (event, handler) => eventEmitter.on(event, handler),
    off: (event, handler) => eventEmitter.off(event, handler),
    emit: (event, ...args) => eventEmitter.emit(event, ...args),
  });

  const [api] = useState(createFrameworkAPI);

  // Create plugin context
  const createPluginContext = (): PluginContext => ({
    user,
    canvas: {
      elements: [], // Will be updated by Excalidraw integration
      appState: {} as any, // Will be updated by Excalidraw integration
      files: {},
    },
    storage: config.storage.adapter,
    auth: config.auth.adapter,
    framework: api,
  });

  const contextValue: ExcalidrawFrameworkContextType = {
    config,
    api,
    user,
    isLoading,
    error,
  };

  return (
    <ExcalidrawFrameworkContext.Provider value={contextValue}>
      {children}
    </ExcalidrawFrameworkContext.Provider>
  );
};
