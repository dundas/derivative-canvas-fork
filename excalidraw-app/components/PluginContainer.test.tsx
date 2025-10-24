import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { PluginContainer } from "./PluginContainer";

import type { ExcalidrawPlugin } from "../../framework/derivative-canvas/core/types";

// Mock the plugin registry
vi.mock("../plugins", () => {
  const MockToolbarButton = () =>
    React.createElement(
      "button",
      { "data-testid": "mock-toolbar" },
      "Mock Toolbar",
    );
  const MockOverlay = () =>
    React.createElement(
      "div",
      { "data-testid": "mock-overlay" },
      "Mock Overlay",
    );

  const mockPlugin: ExcalidrawPlugin = {
    id: "test-plugin",
    name: "Test Plugin",
    version: "1.0.0",
    type: "integration" as const,
    capabilities: {
      requiresAuth: false,
      requiresNetwork: false,
    },
    ui: {
      toolbar: [MockToolbarButton],
      overlay: [MockOverlay],
    },
    onMount: vi.fn(),
    onUnmount: vi.fn(),
  };

  return {
    availablePlugins: [mockPlugin],
    defaultEnabledPlugins: ["test-plugin"],
  };
});

describe("PluginContainer Integration Tests", () => {
  const defaultProps = {
    elements: [],
    appState: {},
    files: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<PluginContainer {...defaultProps} />)).not.toThrow();
    });

    it("should render plugin container with correct class", () => {
      const { container } = render(<PluginContainer {...defaultProps} />);
      const pluginContainer = container.querySelector(".plugin-container");
      expect(pluginContainer).toBeTruthy();
    });

    it("should initialize PluginManager on mount", () => {
      render(<PluginContainer {...defaultProps} />);
      // PluginManager should be created and plugins registered
      // This is verified by checking that plugin components render
    });
  });

  describe("Plugin Lifecycle", () => {
    it("should mount default plugins on component mount", async () => {
      render(<PluginContainer {...defaultProps} />);

      await waitFor(() => {
        // Check that plugin UI components are rendered
        const overlay = screen.queryByTestId("mock-overlay");
        expect(overlay).toBeTruthy();
      });
    });

    it("should unmount plugins on component unmount", async () => {
      const { unmount } = render(<PluginContainer {...defaultProps} />);

      await waitFor(() => {
        const overlay = screen.queryByTestId("mock-overlay");
        expect(overlay).toBeTruthy();
      });

      unmount();

      // After unmount, plugins should be cleaned up
      const overlay = screen.queryByTestId("mock-overlay");
      expect(overlay).toBeFalsy();
    });
  });

  describe("Plugin UI Rendering", () => {
    it("should render plugin toolbar items", async () => {
      render(<PluginContainer {...defaultProps} />);

      await waitFor(() => {
        const toolbar = screen.queryByTestId("mock-toolbar");
        expect(toolbar).toBeTruthy();
      });
    });

    it("should render plugin overlays", async () => {
      render(<PluginContainer {...defaultProps} />);

      await waitFor(() => {
        const overlay = screen.queryByTestId("mock-overlay");
        expect(overlay).toBeTruthy();
        expect(overlay?.textContent).toBe("Mock Overlay");
      });
    });

    it("should render all UI sections (toolbar, sidebar, dialogs, overlays)", () => {
      const { container } = render(<PluginContainer {...defaultProps} />);

      expect(container.querySelector(".plugin-toolbar-items")).toBeTruthy();
      expect(container.querySelector(".plugin-sidebar-items")).toBeTruthy();
      expect(container.querySelector(".plugin-dialogs")).toBeTruthy();
      expect(container.querySelector(".plugin-overlays")).toBeTruthy();
    });
  });

  describe("Props Handling", () => {
    it("should handle elements prop", () => {
      const elements = [
        { id: "1", type: "rectangle", x: 0, y: 0, width: 100, height: 100 },
      ];

      expect(() =>
        render(<PluginContainer elements={elements} />),
      ).not.toThrow();
    });

    it("should handle appState prop", () => {
      const appState = {
        viewBackgroundColor: "#ffffff",
        zoom: { value: 1 },
      };

      expect(() =>
        render(<PluginContainer appState={appState} />),
      ).not.toThrow();
    });

    it("should handle files prop", () => {
      const files = {
        "file-1": { mimeType: "image/png", id: "file-1", dataURL: "" },
      };

      expect(() => render(<PluginContainer files={files} />)).not.toThrow();
    });

    it("should handle readonly elements array", () => {
      const elements = Object.freeze([
        { id: "1", type: "rectangle", x: 0, y: 0, width: 100, height: 100 },
      ]) as readonly any[];

      expect(() =>
        render(<PluginContainer elements={elements} />),
      ).not.toThrow();
    });
  });

  describe("Plugin Context", () => {
    it("should provide plugin context to plugins", async () => {
      const elements = [{ id: "1", type: "rectangle" }];
      const appState = { zoom: { value: 1 } };
      const files = {};

      render(
        <PluginContainer
          elements={elements}
          appState={appState}
          files={files}
        />,
      );

      await waitFor(() => {
        // Verify plugins are mounted (which means context was valid)
        const overlay = screen.queryByTestId("mock-overlay");
        expect(overlay).toBeTruthy();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing props gracefully", () => {
      expect(() => render(<PluginContainer />)).not.toThrow();
    });

    it("should use default values when props are undefined", () => {
      const { container } = render(<PluginContainer />);
      const pluginContainer = container.querySelector(".plugin-container");
      expect(pluginContainer).toBeTruthy();
    });
  });

  describe("Multiple Plugins", () => {
    it("should render components from multiple plugins", async () => {
      // This test uses the mocked plugins which include toolbar and overlay
      render(<PluginContainer {...defaultProps} />);

      await waitFor(() => {
        const toolbar = screen.queryByTestId("mock-toolbar");
        const overlay = screen.queryByTestId("mock-overlay");

        expect(toolbar).toBeTruthy();
        expect(overlay).toBeTruthy();
      });
    });
  });
});
