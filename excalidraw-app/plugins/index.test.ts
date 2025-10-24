import { describe, it, expect } from "vitest";

import {
  availablePlugins,
  defaultEnabledPlugins,
  getPluginById,
  getPluginsByType,
} from "./index";

describe("Plugin Registry", () => {
  describe("availablePlugins", () => {
    it("should export an array of plugins", () => {
      expect(Array.isArray(availablePlugins)).toBe(true);
    });

    it("should contain valid plugin objects", () => {
      availablePlugins.forEach((plugin) => {
        expect(plugin).toHaveProperty("id");
        expect(plugin).toHaveProperty("name");
        expect(plugin).toHaveProperty("version");
        expect(plugin).toHaveProperty("type");
        expect(typeof plugin.id).toBe("string");
        expect(typeof plugin.name).toBe("string");
        expect(typeof plugin.version).toBe("string");
      });
    });

    it("should have unique plugin IDs", () => {
      const ids = availablePlugins.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("should include AI Chat plugin", () => {
      const aiChatPlugin = availablePlugins.find((p) => p.id === "ai-chat");
      expect(aiChatPlugin).toBeDefined();
      expect(aiChatPlugin?.name).toBe("AI Chat Assistant");
    });

    it("should include Audio Input plugin", () => {
      const audioPlugin = availablePlugins.find((p) => p.id === "audio-input");
      expect(audioPlugin).toBeDefined();
      expect(audioPlugin?.name).toBe("Audio Input");
    });
  });

  describe("defaultEnabledPlugins", () => {
    it("should export an array of plugin IDs", () => {
      expect(Array.isArray(defaultEnabledPlugins)).toBe(true);
    });

    it("should contain only string values", () => {
      defaultEnabledPlugins.forEach((id) => {
        expect(typeof id).toBe("string");
      });
    });

    it("should only reference existing plugins", () => {
      const availableIds = availablePlugins.map((p) => p.id);
      defaultEnabledPlugins.forEach((id) => {
        expect(availableIds).toContain(id);
      });
    });

    it("should include ai-chat by default", () => {
      expect(defaultEnabledPlugins).toContain("ai-chat");
    });

    it("should include audio-input by default", () => {
      expect(defaultEnabledPlugins).toContain("audio-input");
    });
  });

  describe("getPluginById", () => {
    it("should return plugin when found", () => {
      const plugin = getPluginById("ai-chat");
      expect(plugin).toBeDefined();
      expect(plugin?.id).toBe("ai-chat");
    });

    it("should return undefined for non-existent plugin", () => {
      const plugin = getPluginById("non-existent-plugin");
      expect(plugin).toBeUndefined();
    });

    it("should return correct plugin for audio-input", () => {
      const plugin = getPluginById("audio-input");
      expect(plugin).toBeDefined();
      expect(plugin?.id).toBe("audio-input");
      expect(plugin?.name).toBe("Audio Input");
    });

    it("should handle empty string", () => {
      const plugin = getPluginById("");
      expect(plugin).toBeUndefined();
    });
  });

  describe("getPluginsByType", () => {
    it("should return array of plugins matching type", () => {
      const aiChatPlugins = getPluginsByType("ai-chat");
      expect(Array.isArray(aiChatPlugins)).toBe(true);
    });

    it("should return AI Chat plugin when searching for ai-chat type", () => {
      const aiChatPlugins = getPluginsByType("ai-chat");
      const aiChatPlugin = aiChatPlugins.find((p) => p.id === "ai-chat");
      expect(aiChatPlugin).toBeDefined();
    });

    it("should return Audio Input plugin when searching for media-input type", () => {
      const mediaPlugins = getPluginsByType("media-input");
      const audioPlugin = mediaPlugins.find((p) => p.id === "audio-input");
      expect(audioPlugin).toBeDefined();
    });

    it("should return empty array for type with no plugins", () => {
      const noPlugins = getPluginsByType("export" as any);
      expect(Array.isArray(noPlugins)).toBe(true);
      expect(noPlugins.length).toBe(0);
    });

    it("should return all matching plugins for a type", () => {
      const plugins = getPluginsByType("ai-chat");
      plugins.forEach((plugin) => {
        expect(plugin.type).toBe("ai-chat");
      });
    });
  });

  describe("Plugin Structure Validation", () => {
    it("should have required UI properties on plugins", () => {
      availablePlugins.forEach((plugin) => {
        if (plugin.ui) {
          expect(plugin.ui).toBeDefined();
          // UI can have toolbar, sidebar, dialogs, or overlay
          const hasUI =
            plugin.ui.toolbar ||
            plugin.ui.sidebar ||
            plugin.ui.dialogs ||
            plugin.ui.overlay;
          expect(hasUI).toBeTruthy();
        }
      });
    });

    it("should have capabilities defined", () => {
      availablePlugins.forEach((plugin) => {
        expect(plugin.capabilities).toBeDefined();
        expect(typeof plugin.capabilities.requiresAuth).toBe("boolean");
        expect(typeof plugin.capabilities.requiresNetwork).toBe("boolean");
      });
    });

    it("should have lifecycle hooks", () => {
      availablePlugins.forEach((plugin) => {
        if (plugin.onMount) {
          expect(typeof plugin.onMount).toBe("function");
        }
        if (plugin.onUnmount) {
          expect(typeof plugin.onUnmount).toBe("function");
        }
      });
    });
  });
});
