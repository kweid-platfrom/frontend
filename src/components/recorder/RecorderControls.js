'use client';

import React, { useEffect, useState } from 'react';
import { Video, Play, Pause, Square, Mic, MicOff } from 'lucide-react';
import { useRecordingStore } from './ScreenRecorderButton';

const formatTime = (s) => {
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  const min = Math.floor(s / 60).toString();
  return `${min}:${sec}`;
};

const RecorderControls = ({ disabled = false, className = "", variant = "ghost", isPrimary = false }) => {
  const { state, actions } = useRecordingStore();
  const [micMuted, setMicMuted] = useState(false);

  const toggleMic = () => {
    if (state.stream) {
      const audioTracks = state.stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicMuted(!micMuted);
    }
  };

  let buttonClass = `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  if (variant === "contained") {
    buttonClass += " bg-primary text-white hover:bg-primary/90";
  } else {
    buttonClass += " text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800";
  }

  if (state.isRecording) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-red-600">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          <span className="font-mono text-sm">{formatTime(state.recordingTime)}</span>
          {state.isPaused && <span className="text-yellow-600 text-xs">(Paused)</span>}
        </div>
        <button
          onClick={state.isPaused ? actions.resumeRecording : actions.pauseRecording}
          className="p-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
          disabled={disabled}
        >
          {state.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleMic}
          className={`p-1.5 ${micMuted ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded`}
          disabled={disabled}
        >
          {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={actions.stopRecording}
          className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded"
          disabled={disabled}
        >
          <Square className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={actions.startRecording}
      disabled={disabled}
      className={buttonClass}
    >
      {variant === "contained" ? <Video className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
      <span className={variant === "ghost" ? "hidden lg:inline" : ""}>
        {variant === "contained" ? "New Recording" : "Screen Record"}
      </span>
    </button>
  );
};

export default RecorderControls;