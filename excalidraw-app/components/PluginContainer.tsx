/**
 * Plugin Container Component
 *
 * Renders all plugin UI components (toolbar, sidebar, dialogs, overlays)
 */

import React, { useEffect, useState } from "react";

import { PluginManager } from "../../framework/derivative-canvas/core/PluginManager";

import { availablePlugins, defaultEnabledPlugins } from "../plugins";

import type {
  PluginContext,
  ExcalidrawPlugin,
} from "../../framework/derivative-canvas/core/types";

interface PluginContainerProps {
  elements?: readonly any[];
  appState?: any;
  files?: any;
}

export const PluginContainer: React.FC<PluginContainerProps> = ({
  elements = [],
  appState = {},
  files = {},
}) => {
  const [pluginManager] = useState(() => new PluginManager());
  const [mountedPlugins, setMountedPlugins] = useState<ExcalidrawPlugin[]>([]);

  // Initialize plugins
  useEffect(() => {
    const context: PluginContext = {
      user: null, // TODO: Get from auth
      canvas: {
        elements: Array.from(elements), // Convert readonly to mutable array
        appState,
        files,
      },
      storage: null as any, // TODO: Setup storage adapter
      auth: null as any, // TODO: Setup auth adapter
      framework: null as any, // TODO: Setup framework API
    };

    pluginManager.setContext(context);

    // Register and mount default plugins
    availablePlugins.forEach((plugin) => {
      // Skip plugins that require authentication when user is not available
      if (plugin.capabilities.requiresAuth && !context.user) {
        // Plugin requires authentication but user is not logged in
        return;
      }

      try {
        // Only register if not already registered
        if (!pluginManager.get(plugin.id)) {
          pluginManager.register(plugin);
        }

        if (
          defaultEnabledPlugins.includes(plugin.id) &&
          !pluginManager.isMounted(plugin.id)
        ) {
          pluginManager.mount(plugin.id);
        }
      } catch (error) {
        console.error(`Failed to register/mount plugin ${plugin.id}:`, error);
      }
    });

    setMountedPlugins(pluginManager.getMounted());

    return () => {
      // Cleanup plugins on unmount
      pluginManager.getMounted().forEach((plugin) => {
        try {
          pluginManager.unmount(plugin.id);
        } catch (error) {
          console.error(`Failed to unmount plugin ${plugin.id}:`, error);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginManager]);
  // Note: elements, appState, and files are intentionally not in deps
  // We only want to register/mount plugins once on initial mount
  // Changes to these props are handled by separate useEffects below

  // Notify plugins of element changes
  useEffect(() => {
    pluginManager.notifyElementsChanged(Array.from(elements));
  }, [elements, pluginManager]);

  // Notify plugins of app state changes
  useEffect(() => {
    pluginManager.notifyAppStateChanged(appState);
  }, [appState, pluginManager]);

  // Render plugin UI components
  const renderPluginComponents = () => {
    const context: PluginContext = {
      user: null,
      canvas: { elements: Array.from(elements), appState, files },
      storage: null as any,
      auth: null as any,
      framework: null as any,
    };

    return (
      <>
        {/* Render toolbar items */}
        <div className="plugin-toolbar-items">
          {pluginManager.renderToolbarItems().map((Component, index) => (
            <Component
              key={`toolbar-${index}`}
              context={context}
              plugin={mountedPlugins[index]}
            />
          ))}
        </div>

        {/* Render sidebar items */}
        <div className="plugin-sidebar-items">
          {pluginManager.renderSidebarItems().map((Component, index) => (
            <Component
              key={`sidebar-${index}`}
              context={context}
              plugin={mountedPlugins[index]}
            />
          ))}
        </div>

        {/* Render dialogs */}
        <div className="plugin-dialogs">
          {pluginManager.renderDialogs().map((Component, index) => (
            <Component
              key={`dialog-${index}`}
              context={context}
              plugin={mountedPlugins[index]}
            />
          ))}
        </div>

        {/* Render overlays */}
        <div className="plugin-overlays">
          {pluginManager.renderOverlays().map((Component, index) => (
            <Component
              key={`overlay-${index}`}
              context={context}
              plugin={mountedPlugins[index]}
            />
          ))}
        </div>
      </>
    );
  };

  return <div className="plugin-container">{renderPluginComponents()}</div>;
};

export default PluginContainer;
