"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AudioRecordingService, type TranscriptionResult, type RecordingState } from '../services/audioRecordingService';

export interface AudioInputButtonProps {
  onTranscription?: (text: string) => void;
  transcriptionConfig: {
    provider: 'openai' | 'deepgram' | 'azure' | 'custom';
    apiKey?: string;
    model?: string;
    language?: string;
    apiEndpoint?: string;
  };
  mode?: 'push-to-talk' | 'toggle';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showVisualizer?: boolean;
}

export const AudioInputButton: React.FC<AudioInputButtonProps> = ({
  onTranscription,
  transcriptionConfig,
  mode = 'toggle',
  position = 'bottom-right',
  showVisualizer = true,
}) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const serviceRef = useRef<AudioRecordingService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new AudioRecordingService({}, transcriptionConfig);

    serviceRef.current.on('stateChange', (newState) => {
      setState(newState);
    });

    serviceRef.current.on('transcription', (result: TranscriptionResult) => {
      if (onTranscription) {
        onTranscription(result.text);
      }
    });

    serviceRef.current.on('error', (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    });

    serviceRef.current.on('audioLevel', (level) => {
      setAudioLevel(level);
    });

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [transcriptionConfig, onTranscription]);

  // Update duration while recording
  useEffect(() => {
    if (state === 'recording') {
      durationIntervalRef.current = setInterval(() => {
        if (serviceRef.current) {
          setDuration(serviceRef.current.getDuration());
        }
      }, 100);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setDuration(0);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [state]);

  const handleClick = async () => {
    if (!serviceRef.current) return;

    if (state === 'idle') {
      try {
        await serviceRef.current.startRecording();
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    } else if (state === 'recording') {
      await serviceRef.current.stopRecording();
    }
  };

  const handleMouseDown = async () => {
    if (mode !== 'push-to-talk' || !serviceRef.current) return;

    if (state === 'idle') {
      try {
        await serviceRef.current.startRecording();
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }
  };

  const handleMouseUp = async () => {
    if (mode !== 'push-to-talk' || !serviceRef.current) return;

    if (state === 'recording') {
      await serviceRef.current.stopRecording();
    }
  };

  const getPositionClasses = () => {
    const positions = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    };
    return positions[position];
  };

  const getButtonColor = () => {
    switch (state) {
      case 'recording':
        return 'bg-red-500 hover:bg-red-600';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'recording':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  const getTooltip = () => {
    switch (state) {
      case 'recording':
        return mode === 'toggle' ? 'Click to stop recording' : 'Release to stop';
      case 'processing':
        return 'Transcribing audio...';
      case 'error':
        return `Error: ${error}`;
      default:
        return mode === 'toggle' ? 'Click to start recording' : 'Hold to record';
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg whitespace-nowrap">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Recording Duration */}
      {state === 'recording' && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white px-3 py-1 rounded shadow-lg">
          <p className="text-sm font-mono">{formatDuration(duration)}</p>
        </div>
      )}

      {/* Main Button */}
      <div className="relative">
        <button
          onClick={mode === 'toggle' ? handleClick : undefined}
          onMouseDown={mode === 'push-to-talk' ? handleMouseDown : undefined}
          onMouseUp={mode === 'push-to-talk' ? handleMouseUp : undefined}
          onMouseLeave={mode === 'push-to-talk' ? handleMouseUp : undefined}
          onTouchStart={mode === 'push-to-talk' ? handleMouseDown : undefined}
          onTouchEnd={mode === 'push-to-talk' ? handleMouseUp : undefined}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`relative w-16 h-16 rounded-full ${getButtonColor()} text-white shadow-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={state === 'processing' || state === 'error'}
          title={getTooltip()}
        >
          {getIcon()}

          {/* Pulse animation when recording */}
          {state === 'recording' && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></span>
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-50 animate-pulse"></span>
            </>
          )}

          {/* Audio level visualizer */}
          {showVisualizer && state === 'recording' && (
            <div className="absolute -inset-2 rounded-full border-4 border-red-400 opacity-50" style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
              transition: 'transform 0.1s ease-out',
            }}></div>
          )}
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white px-3 py-2 rounded shadow-lg whitespace-nowrap text-sm">
            {getTooltip()}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Mode indicator */}
      <div className="absolute -bottom-2 -right-2 bg-white rounded-full px-2 py-0.5 shadow-md border border-gray-200">
        <p className="text-xs font-medium text-gray-600">
          {mode === 'push-to-talk' ? 'PTT' : 'TAP'}
        </p>
      </div>
    </div>
  );
};
