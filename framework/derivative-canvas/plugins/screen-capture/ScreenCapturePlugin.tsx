"use client";

import React from "react";

import { ElementFactory } from "../ai-chat/utils/elementFactory";

import { ScreenCaptureButton } from "./components/ScreenCaptureButton";

import type { ExcalidrawPlugin, PluginUIProps } from "../../core/types";

/**
 * Screen Capture Plugin
 *
 * Provides screen sharing, video recording, and screenshot capabilities.
 *
 * Features:
 * - Screen/window/tab sharing
 * - Camera access
 * - Screenshot capture
 * - Video recording
 * - Send captures to AI for vision analysis
 * - Add screenshots directly to canvas
 * - Floating control button
 */
export const ScreenCapturePlugin: ExcalidrawPlugin = {
  id: "screen-capture",
  name: "Screen & Video Capture",
  version: "1.0.0",
  type: "media-input",

  capabilities: {
    requiresAuth: false,
    requiresNetwork: false, // Can work offline for local captures
    permissions: ["screen-capture", "camera"],
  },

  ui: {
    overlay: [ScreenCaptureOverlay],
  },

  config: {
    // Capture mode: 'screenshot', 'recording', 'both'
    mode: "both",

    // Video quality: 'low', 'medium', 'high'
    videoQuality: "medium",

    // UI settings
    buttonPosition: "bottom-left",

    // Auto add screenshots to canvas
    autoAddToCanvas: true,

    // Integration with AI Chat for vision analysis
    sendToAIChat: true,
    enableVisionAnalysis: true,

    // Recording settings
    maxRecordingDuration: 600, // 10 minutes
    captureAudio: true,
  },

  defaultConfig: {
    mode: "both",
    videoQuality: "medium",
    buttonPosition: "bottom-left",
    autoAddToCanvas: true,
    sendToAIChat: false,
  },

  onMount: (context) => {
    console.log("[Screen Capture Plugin] Mounted");

    // Check API availability
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      console.log("[Screen Capture Plugin] Screen Capture API available");
    } else {
      console.warn("[Screen Capture Plugin] Screen Capture API not available");
    }
  },

  onUnmount: () => {
    console.log("[Screen Capture Plugin] Unmounted");
  },
};

/**
 * Screen Capture Overlay Component
 * Renders the floating capture button
 */
const ScreenCaptureOverlay: React.FC<PluginUIProps> = ({ context, plugin }) => {
  const config = plugin.config || {};

  const handleScreenshot = (dataUrl: string) => {
    console.log("[Screen Capture] Screenshot captured");

    // Add to canvas if enabled
    if (config.autoAddToCanvas && context.framework) {
      const factory = new ElementFactory({
        elements: context.canvas.elements,
        appState: context.canvas.appState,
      });

      const imageElements = factory.createDocumentPlaceholder(
        "Screenshot",
        "image",
      );

      imageElements.forEach((el) => {
        context.framework?.addElement(el);
      });
    }

    // Send to AI Chat for analysis if enabled
    if (config.sendToAIChat && config.enableVisionAnalysis) {
      context.framework?.emit?.("screen-capture:screenshot", {
        dataUrl,
        timestamp: Date.now(),
      });
    }

    // Emit event for other integrations
    context.framework?.emit?.("screenshot:captured", {
      dataUrl,
      source: "screen-capture",
    });
  };

  const handleVideoReady = (blob: Blob) => {
    console.log("[Screen Capture] Video ready:", blob.size, "bytes");

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screen-recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);

    // Emit event
    context.framework?.emit?.("video:recorded", {
      blob,
      source: "screen-capture",
    });
  };

  const handleCaptureStart = (type: "screen" | "window" | "tab" | "camera") => {
    console.log("[Screen Capture] Capture started:", type);

    context.framework?.emit?.("capture:started", {
      type,
      source: "screen-capture",
    });
  };

  return (
    <ScreenCaptureButton
      onScreenshot={handleScreenshot}
      onVideoReady={handleVideoReady}
      onCaptureStart={handleCaptureStart}
      position={config.buttonPosition || "bottom-left"}
      mode={config.mode || "both"}
      quality={config.videoQuality || "medium"}
    />
  );
};

// Export components for external use
export { ScreenCaptureButton } from "./components/ScreenCaptureButton";
export { ScreenCaptureService } from "./services/screenCaptureService";
export type {
  CaptureState,
  CaptureSource,
} from "./services/screenCaptureService";
