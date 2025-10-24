import type { ExcalidrawPlugin, PluginContext, PluginUIProps } from "./types";
import type React from "react";

export class PluginManager {
  private plugins = new Map<string, ExcalidrawPlugin>();
  private mountedPlugins = new Set<string>();
  private context: PluginContext | null = null;

  setContext(context: PluginContext) {
    this.context = context;
  }

  register(plugin: ExcalidrawPlugin): void {
    // Validate plugin structure
    this.validatePlugin(plugin);

    // Check for conflicts
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id '${plugin.id}' is already registered`);
    }

    // Register plugin
    this.plugins.set(plugin.id, plugin);
    console.log(`Plugin '${plugin.name}' (${plugin.id}) registered`);

    // Auto-mount if context is available
    if (this.context) {
      this.mount(plugin.id);
    }
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // Unmount if mounted
    if (this.mountedPlugins.has(pluginId)) {
      this.unmount(pluginId);
    }

    // Remove from registry
    this.plugins.delete(pluginId);
    console.log(`Plugin '${plugin.name}' (${pluginId}) unregistered`);
  }

  mount(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    if (this.mountedPlugins.has(pluginId)) {
      console.warn(`Plugin '${pluginId}' is already mounted`);
      return;
    }

    if (!this.context) {
      throw new Error("Plugin context not available");
    }

    // Check permissions
    if (plugin.capabilities.requiresAuth && !this.context.user) {
      throw new Error(`Plugin '${pluginId}' requires authentication`);
    }

    // Mount plugin
    try {
      plugin.onMount?.(this.context);
      this.mountedPlugins.add(pluginId);
      console.log(`Plugin '${plugin.name}' (${pluginId}) mounted`);
    } catch (error) {
      console.error(`Failed to mount plugin '${pluginId}':`, error);
      throw error;
    }
  }

  unmount(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    if (!this.mountedPlugins.has(pluginId)) {
      console.warn(`Plugin '${pluginId}' is not mounted`);
      return;
    }

    // Unmount plugin
    try {
      plugin.onUnmount?.();
      this.mountedPlugins.delete(pluginId);
      console.log(`Plugin '${plugin.name}' (${pluginId}) unmounted`);
    } catch (error) {
      console.error(`Failed to unmount plugin '${pluginId}':`, error);
    }
  }

  get(pluginId: string): ExcalidrawPlugin | null {
    return this.plugins.get(pluginId) || null;
  }

  list(): ExcalidrawPlugin[] {
    return Array.from(this.plugins.values());
  }

  getByType(type: ExcalidrawPlugin["type"]): ExcalidrawPlugin[] {
    return this.list().filter((plugin) => plugin.type === type);
  }

  getMounted(): ExcalidrawPlugin[] {
    return Array.from(this.mountedPlugins).map((id) => this.plugins.get(id)!);
  }

  isMounted(pluginId: string): boolean {
    return this.mountedPlugins.has(pluginId);
  }

  // Plugin lifecycle events
  notifyElementsChanged(elements: any[]): void {
    for (const pluginId of this.mountedPlugins) {
      const plugin = this.plugins.get(pluginId);
      try {
        plugin?.onElementsChange?.(elements);
      } catch (error) {
        console.error(`Plugin '${pluginId}' error in onElementsChange:`, error);
      }
    }
  }

  notifyAppStateChanged(appState: any): void {
    for (const pluginId of this.mountedPlugins) {
      const plugin = this.plugins.get(pluginId);
      try {
        plugin?.onAppStateChange?.(appState);
      } catch (error) {
        console.error(`Plugin '${pluginId}' error in onAppStateChange:`, error);
      }
    }
  }

  notifyCanvasLoaded(canvasData: any): void {
    for (const pluginId of this.mountedPlugins) {
      const plugin = this.plugins.get(pluginId);
      try {
        plugin?.onCanvasLoad?.(canvasData);
      } catch (error) {
        console.error(`Plugin '${pluginId}' error in onCanvasLoad:`, error);
      }
    }
  }

  notifyCanvasSaved(canvasData: any): void {
    for (const pluginId of this.mountedPlugins) {
      const plugin = this.plugins.get(pluginId);
      try {
        plugin?.onCanvasSave?.(canvasData);
      } catch (error) {
        console.error(`Plugin '${pluginId}' error in onCanvasSave:`, error);
      }
    }
  }

  // UI rendering helpers
  renderToolbarItems(): any[] {
    const components: any[] = [];
    for (const plugin of this.getMounted()) {
      if (plugin.ui?.toolbar) {
        components.push(...plugin.ui.toolbar);
      }
    }
    return components;
  }

  renderSidebarItems(): any[] {
    const components: any[] = [];
    for (const plugin of this.getMounted()) {
      if (plugin.ui?.sidebar) {
        components.push(...plugin.ui.sidebar);
      }
    }
    return components;
  }

  renderDialogs(): any[] {
    const components: any[] = [];
    for (const plugin of this.getMounted()) {
      if (plugin.ui?.dialogs) {
        components.push(...plugin.ui.dialogs);
      }
    }
    return components;
  }

  renderOverlays(): any[] {
    const components: any[] = [];
    for (const plugin of this.getMounted()) {
      if (plugin.ui?.overlay) {
        components.push(...plugin.ui.overlay);
      }
    }
    return components;
  }

  getContextMenuItems(): Array<{ plugin: ExcalidrawPlugin; items: any[] }> {
    const menuItems: Array<{ plugin: ExcalidrawPlugin; items: any[] }> = [];
    for (const plugin of this.getMounted()) {
      if (plugin.ui?.contextMenu) {
        menuItems.push({ plugin, items: plugin.ui.contextMenu });
      }
    }
    return menuItems;
  }

  private validatePlugin(plugin: ExcalidrawPlugin): void {
    if (!plugin.id) {
      throw new Error("Plugin must have an id");
    }

    if (!plugin.name) {
      throw new Error("Plugin must have a name");
    }

    if (!plugin.version) {
      throw new Error("Plugin must have a version");
    }

    if (!plugin.type) {
      throw new Error("Plugin must have a type");
    }

    // Validate plugin type
    const validTypes = [
      "ai-chat",
      "media-input",
      "integration",
      "ui-enhancement",
      "workflow",
    ];
    if (!validTypes.includes(plugin.type)) {
      throw new Error(`Invalid plugin type: ${plugin.type}`);
    }

    // Validate capabilities
    if (!plugin.capabilities) {
      throw new Error("Plugin must define capabilities");
    }

    // Validate UI components
    if (plugin.ui) {
      const uiKeys = Object.keys(plugin.ui);
      const validUIKeys = [
        "toolbar",
        "sidebar",
        "dialogs",
        "contextMenu",
        "overlay",
      ];
      for (const key of uiKeys) {
        if (!validUIKeys.includes(key)) {
          throw new Error(`Invalid UI component type: ${key}`);
        }
      }
    }
  }
}
