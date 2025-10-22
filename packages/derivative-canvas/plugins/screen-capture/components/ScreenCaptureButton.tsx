"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ScreenCaptureService, type CaptureState } from '../services/screenCaptureService';

export interface ScreenCaptureButtonProps {
  onScreenshot?: (dataUrl: string) => void;
  onVideoReady?: (blob: Blob) => void;
  onCaptureStart?: (type: 'screen' | 'window' | 'tab' | 'camera') => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  mode?: 'screenshot' | 'recording' | 'both';
  quality?: 'low' | 'medium' | 'high';
}

export const ScreenCaptureButton: React.FC<ScreenCaptureButtonProps> = ({
  onScreenshot,
  onVideoReady,
  onCaptureStart,
  position = 'bottom-left',
  mode = 'both',
  quality = 'medium',
}) => {
  const [state, setState] = useState<CaptureState>('idle');
  const [isCapturing, setIsCapturing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const serviceRef = useRef<ScreenCaptureService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new ScreenCaptureService({
      videoQuality: quality,
      captureAudio: true,
    });

    serviceRef.current.on('stateChange', (newState) => {
      setState(newState);
    });

    serviceRef.current.on('screenshot', (dataUrl) => {
      if (onScreenshot) {
        onScreenshot(dataUrl);
      }
    });

    serviceRef.current.on('videoReady', (blob) => {
      if (onVideoReady) {
        onVideoReady(blob);
      }
    });

    serviceRef.current.on('error', (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [quality, onScreenshot, onVideoReady]);

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

  const handleStartScreenCapture = async () => {
    if (!serviceRef.current) return;

    try {
      const source = await serviceRef.current.startScreenCapture();
      setIsCapturing(true);
      setShowMenu(false);

      if (onCaptureStart) {
        onCaptureStart(source.type);
      }
    } catch (err) {
      console.error('Failed to start screen capture:', err);
    }
  };

  const handleStartCameraCapture = async () => {
    if (!serviceRef.current) return;

    try {
      const source = await serviceRef.current.startCameraCapture();
      setIsCapturing(true);
      setShowMenu(false);

      if (onCaptureStart) {
        onCaptureStart('camera');
      }
    } catch (err) {
      console.error('Failed to start camera capture:', err);
    }
  };

  const handleTakeScreenshot = async () => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.captureScreenshot();
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to take screenshot:', err);
    }
  };

  const handleStartRecording = async () => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.startRecording();
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleStopRecording = async () => {
    if (!serviceRef.current) return;

    serviceRef.current.stopRecording();
  };

  const handleStopCapture = () => {
    if (!serviceRef.current) return;

    serviceRef.current.stopCapture();
    setIsCapturing(false);
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
      case 'capturing':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-gray-500';
      default:
        return 'bg-purple-500 hover:bg-purple-600';
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
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
        <div className="absolute bottom-full mb-2 left-0 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg whitespace-nowrap">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Recording Duration */}
      {state === 'recording' && (
        <div className="absolute bottom-full mb-2 left-0 bg-gray-900 text-white px-3 py-1 rounded shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-mono">{formatDuration(duration)}</p>
        </div>
      )}

      {/* Menu */}
      {showMenu && !isCapturing && (
        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56">
          <button
            onClick={handleStartScreenCapture}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Share Screen/Window</span>
          </button>

          <button
            onClick={handleStartCameraCapture}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Use Camera</span>
          </button>
        </div>
      )}

      {/* Controls Menu (when capturing) */}
      {showMenu && isCapturing && (
        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56">
          {(mode === 'screenshot' || mode === 'both') && (
            <button
              onClick={handleTakeScreenshot}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Take Screenshot</span>
            </button>
          )}

          {(mode === 'recording' || mode === 'both') && state !== 'recording' && (
            <button
              onClick={handleStartRecording}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
            >
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" />
              </svg>
              <span className="text-sm font-medium">Start Recording</span>
            </button>
          )}

          {state === 'recording' && (
            <button
              onClick={handleStopRecording}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
            >
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span className="text-sm font-medium">Stop Recording</span>
            </button>
          )}

          <div className="border-t border-gray-200 my-2"></div>

          <button
            onClick={handleStopCapture}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3 text-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-medium">Stop Sharing</span>
          </button>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`relative w-16 h-16 rounded-full ${getButtonColor()} text-white shadow-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-opacity-50`}
        title={isCapturing ? 'Capturing...' : 'Start screen/video capture'}
      >
        {getIcon()}

        {/* Pulse animation when recording */}
        {state === 'recording' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></span>
            <span className="absolute inset-0 rounded-full bg-red-500 opacity-50 animate-pulse"></span>
          </>
        )}

        {/* Active indicator */}
        {isCapturing && state !== 'recording' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
        )}
      </button>

      {/* State indicator */}
      <div className="absolute -bottom-2 -right-2 bg-white rounded-full px-2 py-0.5 shadow-md border border-gray-200">
        <p className="text-xs font-medium text-gray-600">
          {state === 'recording' ? 'REC' : isCapturing ? 'LIVE' : 'OFF'}
        </p>
      </div>
    </div>
  );
};
