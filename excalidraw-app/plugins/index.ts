/**
 * Plugin Registry for Excalidraw App
 *
 * This file imports and registers all available plugins for the Excalidraw application.
 */

import { AIChatPlugin } from "../../framework/derivative-canvas/plugins/ai-chat/AIChatPlugin";
import { AudioInputPlugin } from "../../framework/derivative-canvas/plugins/audio-input/AudioInputPlugin";

import type { ExcalidrawPlugin } from "../../framework/derivative-canvas/core/types";

/**
 * Available plugins for the application
 */
export const availablePlugins: ExcalidrawPlugin[] = [
  AIChatPlugin,
  AudioInputPlugin,
  // ScreenCapturePlugin - commented out until we verify its implementation
];

/**
 * Get plugin by ID
 */
export const getPluginById = (
  pluginId: string,
): ExcalidrawPlugin | undefined => {
  return availablePlugins.find((plugin) => plugin.id === pluginId);
};

/**
 * Get plugins by type
 */
export const getPluginsByType = (
  type: ExcalidrawPlugin["type"],
): ExcalidrawPlugin[] => {
  return availablePlugins.filter((plugin) => plugin.type === type);
};

/**
 * Default enabled plugins
 */
export const defaultEnabledPlugins = ["ai-chat", "audio-input"];

export default availablePlugins;
