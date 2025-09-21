'use client';

import React from 'react';
import { Video, Play, Pause, Square, Mic, MicOff } from 'lucide-react';

const formatTime = (s) => {
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  const min = Math.floor(s / 60).toString();
  return `${min}:${sec}`;
};

const RecorderControls = ({ 
  disabled = false, 
  className = "", 
  variant = "ghost",
  onStart,
  recordingState,
  actions
}) => {
  let buttonClass = `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  if (variant === "contained") {
    buttonClass += " bg-primary text-white hover:bg-primary/90";
  } else {
    buttonClass += " text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800";
  }

  if (recordingState.isRecording) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-red-600">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
          <span className="font-mono text-sm">{formatTime(recordingState.recordingTime)}</span>
          {recordingState.isPaused && <span className="text-yellow-600 text-xs">(Paused)</span>}
        </div>
        <button
          onClick={recordingState.isPaused ? actions.resumeRecording : actions.pauseRecording}
          className="p-1.5 bg-orange-300 hover:bg-orange-400 text-white rounded transition-colors"
          disabled={disabled}
          title={recordingState.isPaused ? "Resume Recording" : "Pause Recording"}
        >
          {recordingState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <button
          onClick={actions.toggleMute}
          className={`p-1.5 transition-colors text-white rounded ${
            recordingState.micMuted 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
          disabled={disabled}
          title={recordingState.micMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {recordingState.micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={actions.stopRecording}
          className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded transition-colors"
          disabled={disabled}
          title="Stop Recording"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStart}
      disabled={disabled}
      className={buttonClass}
      title="Start Screen Recording"
    >
      {variant === "contained" ? <Video className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
      <span className={variant === "ghost" ? "hidden lg:inline" : ""}>
        {variant === "contained" ? "New Recording" : "Screen Record"}
      </span>
    </button>
  );
};

export default RecorderControls;