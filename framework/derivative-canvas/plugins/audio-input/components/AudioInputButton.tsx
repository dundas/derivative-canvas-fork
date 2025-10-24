/**
 * Audio Input Button Component
 * TODO: Full implementation coming soon
 */

import React from "react";

interface AudioInputButtonProps {
  onTranscription: (text: string) => void;
  transcriptionConfig: {
    provider?: string;
    apiKey?: string;
    model?: string;
    language?: string;
    apiEndpoint?: string;
  };
  mode?: "toggle" | "push-to-talk";
  position?: string;
  showVisualizer?: boolean;
}

export const AudioInputButton: React.FC<AudioInputButtonProps> = ({
  onTranscription,
  transcriptionConfig,
  mode = "toggle",
  position = "bottom-right",
  showVisualizer = true,
}) => {
  const handleClick = () => {
    console.log(
      "[Audio Input] Button clicked - Full implementation coming soon",
    );
    // TODO: Implement audio recording and transcription
  };

  return (
    <button
      onClick={handleClick}
      className="audio-input-button"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        zIndex: 1000,
      }}
      title="Audio Input (Coming Soon)"
    >
      🎤
    </button>
  );
};

export default AudioInputButton;
