import { describe, it, expect, beforeEach, vi } from "vitest";

import React from "react";

import { PluginManager } from "./PluginManager";

import type { ExcalidrawPlugin, PluginContext } from "./types";

// Mock plugin components
const MockToolbarComponent = () => React.createElement("div", null, "Toolbar");
const MockSidebarComponent = () => React.createElement("div", null, "Sidebar");
const MockDialogComponent = () => React.createElement("div", null, "Dialog");
const MockOverlayComponent = () => React.createElement("div", null, "Overlay");

// Mock plugin
const createMockPlugin = (id: string): ExcalidrawPlugin => ({
  id,
  name: `Test Plugin ${id}`,
  version: "1.0.0",
  type: "integration" as const,
  capabilities: {
    requiresAuth: false,
    requiresNetwork: false,
  },
  ui: {
    toolbar: [MockToolbarComponent],
    sidebar: [MockSidebarComponent],
    dialogs: [MockDialogComponent],
    overlay: [MockOverlayComponent],
  },
  onMount: vi.fn(),
  onUnmount: vi.fn(),
});

describe("PluginManager", () => {
  let pluginManager: PluginManager;
  let mockPlugin: ExcalidrawPlugin;

  beforeEach(() => {
    pluginManager = new PluginManager();
    mockPlugin = createMockPlugin("test-plugin");
  });

  describe("Plugin Registration", () => {
    it("should register a plugin successfully", () => {
      expect(() => pluginManager.register(mockPlugin)).not.toThrow();
    });

    it("should throw error when registering duplicate plugin", () => {
      pluginManager.register(mockPlugin);
      expect(() => pluginManager.register(mockPlugin)).toThrow(
        "Plugin with id 'test-plugin' is already registered",
      );
    });

    it("should validate plugin structure", () => {
      const invalidPlugin = { id: "invalid" } as ExcalidrawPlugin;
      expect(() => pluginManager.register(invalidPlugin)).toThrow();
    });

    it("should retrieve registered plugin by ID", () => {
      pluginManager.register(mockPlugin);
      const retrieved = pluginManager.get("test-plugin");
      expect(retrieved).toBe(mockPlugin);
    });

    it("should return null for non-existent plugin", () => {
      const retrieved = pluginManager.get("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("Plugin Mounting", () => {
    beforeEach(() => {
      pluginManager.register(mockPlugin);

      // Set plugin context
      const mockContext: PluginContext = {
        user: null,
        canvas: {
          elements: [],
          appState: {},
          files: {},
        },
        storage: null as any,
        auth: null as any,
        framework: null as any,
      };
      pluginManager.setContext(mockContext);
    });

    it("should mount a plugin successfully", () => {
      expect(() => pluginManager.mount("test-plugin")).not.toThrow();
    });

    it("should call onMount lifecycle hook", () => {
      pluginManager.mount("test-plugin");
      expect(mockPlugin.onMount).toHaveBeenCalledTimes(1);
    });

    it("should throw error when mounting non-existent plugin", () => {
      expect(() => pluginManager.mount("non-existent")).toThrow(
        "Plugin 'non-existent' not found",
      );
    });

    it("should not mount plugin twice", () => {
      pluginManager.mount("test-plugin");
      pluginManager.mount("test-plugin");
      expect(mockPlugin.onMount).toHaveBeenCalledTimes(1);
    });

    it("should track mounted plugins", () => {
      pluginManager.mount("test-plugin");
      const mounted = pluginManager.getMounted();
      expect(mounted).toHaveLength(1);
      expect(mounted[0]).toBe(mockPlugin);
    });
  });

  describe("Plugin Unmounting", () => {
    beforeEach(() => {
      pluginManager.register(mockPlugin);

      // Set plugin context
      const mockContext: PluginContext = {
        user: null,
        canvas: {
          elements: [],
          appState: {},
          files: {},
        },
        storage: null as any,
        auth: null as any,
        framework: null as any,
      };
      pluginManager.setContext(mockContext);

      pluginManager.mount("test-plugin");
    });

    it("should unmount a plugin successfully", () => {
      expect(() => pluginManager.unmount("test-plugin")).not.toThrow();
    });

    it("should call onUnmount lifecycle hook", () => {
      pluginManager.unmount("test-plugin");
      expect(mockPlugin.onUnmount).toHaveBeenCalledTimes(1);
    });

    it("should remove plugin from mounted list", () => {
      pluginManager.unmount("test-plugin");
      const mounted = pluginManager.getMounted();
      expect(mounted).toHaveLength(0);
    });

    it("should handle unmounting non-mounted plugin", () => {
      pluginManager.unmount("test-plugin");
      expect(() => pluginManager.unmount("test-plugin")).not.toThrow();
    });
  });

  describe("UI Component Rendering", () => {
    beforeEach(() => {
      pluginManager.register(mockPlugin);

      // Set plugin context
      const mockContext: PluginContext = {
        user: null,
        canvas: {
          elements: [],
          appState: {},
          files: {},
        },
        storage: null as any,
        auth: null as any,
        framework: null as any,
      };
      pluginManager.setContext(mockContext);

      pluginManager.mount("test-plugin");
    });

    it("should return toolbar components from mounted plugins", () => {
      const components = pluginManager.renderToolbarItems();
      expect(components).toHaveLength(1);
      expect(components[0]).toBe(MockToolbarComponent);
    });

    it("should return sidebar components from mounted plugins", () => {
      const components = pluginManager.renderSidebarItems();
      expect(components).toHaveLength(1);
      expect(components[0]).toBe(MockSidebarComponent);
    });

    it("should return dialog components from mounted plugins", () => {
      const components = pluginManager.renderDialogs();
      expect(components).toHaveLength(1);
      expect(components[0]).toBe(MockDialogComponent);
    });

    it("should return overlay components from mounted plugins", () => {
      const components = pluginManager.renderOverlays();
      expect(components).toHaveLength(1);
      expect(components[0]).toBe(MockOverlayComponent);
    });

    it("should return empty array when no plugins mounted", () => {
      pluginManager.unmount("test-plugin");
      expect(pluginManager.renderToolbarItems()).toHaveLength(0);
      expect(pluginManager.renderSidebarItems()).toHaveLength(0);
      expect(pluginManager.renderDialogs()).toHaveLength(0);
      expect(pluginManager.renderOverlays()).toHaveLength(0);
    });

    it("should aggregate components from multiple plugins", () => {
      const secondPlugin = createMockPlugin("second-plugin");
      pluginManager.register(secondPlugin);
      pluginManager.mount("second-plugin");

      const toolbarComponents = pluginManager.renderToolbarItems();
      expect(toolbarComponents).toHaveLength(2);
    });
  });

  describe("Multiple Plugins", () => {
    it("should handle multiple registered plugins", () => {
      const plugin1 = createMockPlugin("plugin-1");
      const plugin2 = createMockPlugin("plugin-2");
      const plugin3 = createMockPlugin("plugin-3");

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.register(plugin3);

      expect(pluginManager.get("plugin-1")).toBe(plugin1);
      expect(pluginManager.get("plugin-2")).toBe(plugin2);
      expect(pluginManager.get("plugin-3")).toBe(plugin3);
    });

    it("should mount and unmount multiple plugins independently", () => {
      const plugin1 = createMockPlugin("plugin-1");
      const plugin2 = createMockPlugin("plugin-2");

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      // Set plugin context
      const mockContext: PluginContext = {
        user: null,
        canvas: {
          elements: [],
          appState: {},
          files: {},
        },
        storage: null as any,
        auth: null as any,
        framework: null as any,
      };
      pluginManager.setContext(mockContext);

      pluginManager.mount("plugin-1");
      expect(pluginManager.getMounted()).toHaveLength(1);

      pluginManager.mount("plugin-2");
      expect(pluginManager.getMounted()).toHaveLength(2);

      pluginManager.unmount("plugin-1");
      expect(pluginManager.getMounted()).toHaveLength(1);
      expect(pluginManager.getMounted()[0]).toBe(plugin2);
    });
  });

  describe("Plugin Context", () => {
    it("should set and use plugin context", () => {
      const mockContext: PluginContext = {
        user: null,
        canvas: {
          elements: [],
          appState: {},
          files: {},
        },
        storage: null as any,
        auth: null as any,
        framework: null as any,
      };

      expect(() => pluginManager.setContext(mockContext)).not.toThrow();
    });
  });

  describe("Event Notifications", () => {
    beforeEach(() => {
      pluginManager.register(mockPlugin);

      // Set plugin context
      const mockContext: PluginContext = {
        user: null,
        canvas: {
          elements: [],
          appState: {},
          files: {},
        },
        storage: null as any,
        auth: null as any,
        framework: null as any,
      };
      pluginManager.setContext(mockContext);

      pluginManager.mount("test-plugin");
    });

    it("should notify plugins of element changes", () => {
      const elements: any[] = [{ id: "1", type: "rectangle" }];
      expect(() => pluginManager.notifyElementsChanged(elements)).not.toThrow();
    });

    it("should notify plugins of app state changes", () => {
      const appState = { viewBackgroundColor: "#fff" };
      expect(() => pluginManager.notifyAppStateChanged(appState)).not.toThrow();
    });
  });
});
