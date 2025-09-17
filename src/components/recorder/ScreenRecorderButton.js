import React, { useState, useEffect } from 'react';
import { Video, Plus, Pause, Play, Square } from 'lucide-react';
import EnhancedScreenRecorder from './EnhancedScreenRecorder';
import { useApp } from '../../context/AppProvider';

const formatTime = (s) => {
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  const min = Math.floor(s / 60).toString();
  return `${min}:${sec}`;
};

const attachConsoleCapture = () => {
  const originalMethods = {};
  ["log", "error", "warn", "info"].forEach((level) => {
    originalMethods[level] = console[level];
    console[level] = (...args) => {
      const message = args.map(String).join(" ");
      const logEntry = { 
        level, 
        message, 
        time: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      recordingStore.setState({
        consoleLogs: [...recordingStore.state.consoleLogs, logEntry]
      });
      originalMethods[level].apply(console, args);
    };
  });
  
  return () => {
    Object.keys(originalMethods).forEach(level => {
      console[level] = originalMethods[level];
    });
  };
};

const attachNetworkCapture = () => {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const start = Date.now();
    const requestTime = new Date().toISOString();
    
    try {
      const response = await originalFetch(...args);
      const end = Date.now();
      
      const logEntry = {
        id: `req_${Date.now()}_${Math.random()}`,
        url: args[0],
        method: args[1]?.method || "GET",
        status: response.status,
        time: requestTime,
        duration: end - start,
        headers: Object.fromEntries(response.headers.entries ? [...response.headers.entries()] : []),
        responseText: response.status < 400 ? 'Success' : 'Error'
      };
      
      recordingStore.setState({
        networkLogs: [...recordingStore.state.networkLogs, logEntry]
      });
      return response;
    } catch (err) {
      const logEntry = {
        id: `req_${Date.now()}_${Math.random()}`,
        url: args[0],
        method: args[1]?.method || "GET",
        status: "ERR",
        time: requestTime,
        duration: Date.now() - start,
        error: err.message
      };
      
      recordingStore.setState({
        networkLogs: [...recordingStore.state.networkLogs, logEntry]
      });
      throw err;
    }
  };

  // XHR capture
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__method = method;
    this.__url = url;
    this.__startTime = Date.now();
    return originalOpen.apply(this, [method, url, ...rest]);
  };
  
  XMLHttpRequest.prototype.send = function (body) {
    const xhr = this;
    const requestTime = new Date().toISOString();
    
    xhr.addEventListener("loadend", function () {
      const logEntry = {
        id: `xhr_${Date.now()}_${Math.random()}`,
        url: xhr.__url,
        method: xhr.__method,
        status: xhr.status,
        time: requestTime,
        duration: Date.now() - xhr.__startTime,
        headers: {},
        responseText: xhr.responseText?.substring(0, 200) + (xhr.responseText?.length > 200 ? '...' : '')
      };
      
      recordingStore.setState({
        networkLogs: [...recordingStore.state.networkLogs, logEntry]
      });
    });
    
    return originalSend.apply(this, [body]);
  };

  return () => {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
    XMLHttpRequest.prototype.send = originalSend;
  };
};

const recordingStore = {
  state: {
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    showCountdown: 0,
    showPreview: false,
    previewUrl: null,
    duration: "0:00",
    consoleLogs: [],
    networkLogs: [],
    detectedIssues: [],
    comments: [],
    recorder: null,
    chunks: [],
    stream: null,
    cleanupConsole: null,
    cleanupNetwork: null,
    timerInterval: null,
    countdownInterval: null,
  },
  listeners: [],
  setState: function(updates) {
    this.state = {...this.state, ...updates};
    this.listeners.forEach(listener => listener(this.state));
  },
  subscribe: function(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  actions: {
    startRecording: async () => {
      try {
        recordingStore.setState({
          chunks: [],
          consoleLogs: [],
          networkLogs: [],
          comments: [],
          detectedIssues: [],
          recordingTime: 0,
          isPaused: false,
        });

        const cleanupConsole = attachConsoleCapture();
        recordingStore.setState({cleanupConsole});

        const cleanupNetwork = attachNetworkCapture();
        recordingStore.setState({cleanupNetwork});

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: true,
        });

        recordingStore.setState({stream});

        // Start countdown
        let count = 3;
        recordingStore.setState({showCountdown: count});
        const countdownInterval = setInterval(() => {
          count--;
          if (count > 0) {
            recordingStore.setState({showCountdown: count});
          } else {
            clearInterval(countdownInterval);
            recordingStore.setState({showCountdown: 0, countdownInterval: null});

            // Start recorder
            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: "video/webm;codecs=vp9",
            });

            mediaRecorder.ondataavailable = (ev) => {
              if (ev.data && ev.data.size > 0) {
                recordingStore.setState({
                  chunks: [...recordingStore.state.chunks, ev.data]
                });
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(recordingStore.state.chunks, { type: "video/webm" });
              const url = URL.createObjectURL(blob);
              recordingStore.setState({previewUrl: url, chunks: []}); // Clear chunks to save memory

              const tempVideo = document.createElement("video");
              tempVideo.src = url;
              tempVideo.onloadedmetadata = () => {
                recordingStore.setState({duration: formatTime(tempVideo.duration)});
              };

              recordingStore.state.cleanupConsole();
              recordingStore.state.cleanupNetwork();

              // Compute issues
              const issues = [];
              recordingStore.state.consoleLogs.forEach(log => {
                if (log.level === 'error') {
                  issues.push({
                    id: `console_${Date.now()}_${Math.random()}`,
                    type: 'console_error',
                    message: log.message,
                    time: log.time,
                    severity: 'high',
                    source: 'console'
                  });
                }
              });
              recordingStore.state.networkLogs.forEach(req => {
                if (req.status >= 400 || req.status === 'ERR') {
                  issues.push({
                    id: `network_${Date.now()}_${Math.random()}`,
                    type: 'network_error',
                    message: `${req.method} ${req.url} - Status: ${req.status}`,
                    time: req.time,
                    severity: req.status >= 500 ? 'high' : 'medium',
                    source: 'network',
                    requestData: req
                  });
                }
              });
              recordingStore.setState({detectedIssues: issues});

              recordingStore.setState({showPreview: true});
            };

            mediaRecorder.start();
            recordingStore.setState({recorder: mediaRecorder, isRecording: true});

            const timerInterval = setInterval(() => {
              if (!recordingStore.state.isPaused) {
                recordingStore.setState({recordingTime: recordingStore.state.recordingTime + 1});
              }
            }, 1000);
            recordingStore.setState({timerInterval});
          }
        }, 1000);
        recordingStore.setState({countdownInterval});
      } catch (err) {
        console.warn('User cancelled screen share or error occurred:', err);
      }
    },
    pauseRecording: () => {
      if (recordingStore.state.recorder && !recordingStore.state.isPaused) {
        recordingStore.state.recorder.pause();
        recordingStore.setState({isPaused: true});
      }
    },
    resumeRecording: () => {
      if (recordingStore.state.recorder && recordingStore.state.isPaused) {
        recordingStore.state.recorder.resume();
        recordingStore.setState({isPaused: false});
      }
    },
    stopRecording: () => {
      if (recordingStore.state.recorder) {
        clearInterval(recordingStore.state.timerInterval);
        recordingStore.setState({timerInterval: null, isRecording: false, isPaused: false});
        recordingStore.state.recorder.stop();
        recordingStore.state.stream.getTracks().forEach(track => track.stop());
      }
    },
    setShowPreview: (value) => recordingStore.setState({showPreview: value}),
  }
};

const useRecordingStore = () => {
  const [state, setState] = useState(recordingStore.state);
  useEffect(() => {
    const unsubscribe = recordingStore.subscribe(setState);
    return unsubscribe;
  }, []);
  return { state, actions: recordingStore.actions };
};

const ScreenRecorderButton = ({ 
  disabled = false, 
  className = "",
  variant = "ghost",
  isPrimary = false
}) => {
  const { activeSuite, ui } = useApp();
  const { state, actions } = useRecordingStore();

  const handleStart = () => {
    if (!activeSuite?.id) {
      ui.showNotification({
        id: 'no-suite-selected',
        type: 'warning',
        message: 'Please select a test suite first',
        duration: 3000,
      });
      return;
    }
    actions.startRecording();
  };

  let buttonClass = "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  let icon = <Video className="w-4 h-4 mr-2" />;
  let label = "Screen Record";
  
  if (variant === "contained") {
    buttonClass += " bg-primary text-white hover:bg-primary/90";
    icon = <Plus className="w-4 h-4 mr-2" />;
    label = "New Recording";
  } else {
    buttonClass += " text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800";
  }
  buttonClass += ` ${className}`;

  if (state.isRecording) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-red-600">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          <span className="font-mono text-sm">{formatTime(state.recordingTime)}</span>
        </div>
        <button
          onClick={state.isPaused ? actions.resumeRecording : actions.pauseRecording}
          className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded"
          disabled={disabled}
        >
          {state.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
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
    <>
      <button
        onClick={handleStart}
        disabled={disabled}
        className={buttonClass}
      >
        {icon}
        <span className={variant === "ghost" ? "hidden lg:inline" : ""}>{label}</span>
      </button>

      {isPrimary && state.showCountdown > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-white text-9xl font-bold animate-bounce">
            {state.showCountdown}
          </div>
        </div>
      )}

      {isPrimary && state.showPreview && (
        <EnhancedScreenRecorder
          mode="recorder"
          existingRecording={{
            videoUrl: state.previewUrl,
            duration: state.duration,
            consoleLogs: state.consoleLogs,
            networkLogs: state.networkLogs,
            comments: state.comments,
            detectedIssues: state.detectedIssues,
          }}
          onClose={() => actions.setShowPreview(false)}
        />
      )}
    </>
  );
};

export default ScreenRecorderButton;