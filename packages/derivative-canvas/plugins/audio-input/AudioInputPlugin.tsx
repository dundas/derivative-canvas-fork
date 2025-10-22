"use client";

import React from 'react';
import type { ExcalidrawPlugin, PluginUIProps } from '../../core/types';
import { AudioInputButton } from './components/AudioInputButton';

/**
 * Audio Input Plugin
 *
 * Provides voice input capabilities with automatic transcription.
 *
 * Features:
 * - Microphone access and audio recording
 * - Real-time transcription (OpenAI Whisper, Deepgram, Azure, Custom)
 * - Push-to-talk or toggle recording modes
 * - Audio level visualization
 * - Floating microphone button
 * - Integration with AI Chat for voice commands
 */
export const AudioInputPlugin: ExcalidrawPlugin = {
  id: 'audio-input',
  name: 'Audio Input',
  version: '1.0.0',
  type: 'media-input',

  capabilities: {
    requiresAuth: false,
    requiresNetwork: true,
    permissions: ['microphone'],
  },

  ui: {
    overlay: [AudioInputOverlay],
  },

  config: {
    // Transcription provider: 'openai', 'deepgram', 'azure', 'custom'
    transcriptionProvider: 'openai',
    transcriptionApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    transcriptionModel: 'whisper-1',
    transcriptionLanguage: 'en',

    // Recording mode: 'push-to-talk' or 'toggle'
    recordingMode: 'toggle',

    // UI settings
    buttonPosition: 'bottom-right',
    showVisualizer: true,

    // Audio settings
    maxRecordingDuration: 300, // 5 minutes
    autoStop: true,

    // Integration with AI Chat
    sendToAIChat: true,
    autoSubmit: true, // Automatically send transcribed text to AI
  },

  defaultConfig: {
    transcriptionProvider: 'openai',
    recordingMode: 'toggle',
    buttonPosition: 'bottom-right',
    showVisualizer: true,
    sendToAIChat: true,
    autoSubmit: false,
  },

  onMount: (context) => {
    console.log('[Audio Input Plugin] Mounted');

    // Check microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log('[Audio Input Plugin] Microphone API available');
    } else {
      console.warn('[Audio Input Plugin] Microphone API not available');
    }
  },

  onUnmount: () => {
    console.log('[Audio Input Plugin] Unmounted');
  },
};

/**
 * Audio Input Overlay Component
 * Renders the floating microphone button
 */
const AudioInputOverlay: React.FC<PluginUIProps> = ({ context, plugin }) => {
  const config = plugin.config || {};

  const handleTranscription = (text: string) => {
    console.log('[Audio Input] Transcribed:', text);

    // If AI Chat integration is enabled, send text to AI
    if (config.sendToAIChat && context.framework) {
      // Find AI Chat plugin
      const aiChatPlugin = context.framework.getPlugin?.('ai-chat');

      if (aiChatPlugin) {
        console.log('[Audio Input] Sending to AI Chat:', text);
        // The AI Chat plugin would need to expose a method to receive text
        // For now, we'll emit an event
        context.framework.emit?.('audio-input:transcription', text);
      }
    }

    // Emit event for other plugins/app to listen
    context.framework?.emit?.('transcription:complete', {
      text,
      source: 'audio-input',
    });
  };

  return (
    <AudioInputButton
      onTranscription={handleTranscription}
      transcriptionConfig={{
        provider: config.transcriptionProvider || 'openai',
        apiKey: config.transcriptionApiKey,
        model: config.transcriptionModel,
        language: config.transcriptionLanguage,
        apiEndpoint: config.transcriptionApiEndpoint,
      }}
      mode={config.recordingMode || 'toggle'}
      position={config.buttonPosition || 'bottom-right'}
      showVisualizer={config.showVisualizer !== false}
    />
  );
};

// Export components for external use
export { AudioInputButton } from './components/AudioInputButton';
export { AudioRecordingService } from './services/audioRecordingService';
export type { TranscriptionResult, RecordingState } from './services/audioRecordingService';
