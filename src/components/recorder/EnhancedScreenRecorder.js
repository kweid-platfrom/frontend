import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Video, 
  Square, 
  Play, 
  Pause, 
  Bug, 
  Save, 
  Upload,
  MessageCircle,
  Network,
  Terminal,
  Settings,
  Clock,
  Download,
  X,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

const formatTime = (s) => {
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  const min = Math.floor(s / 60).toString();
  return `${min}:${sec}`;
};

const EnhancedScreenRecorder = ({ 
  activeSuite,
  firestoreService, // Your existing service
  onClose,
  mode = 'recorder', // 'recorder' or 'viewer'
  existingRecording = null // For viewing existing recordings
}) => {
  // Recording state
  const videoRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(existingRecording?.videoUrl || null);
  const [duration, setDuration] = useState(existingRecording?.duration || "0:00");
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Dev tools state
  const [consoleLogs, setConsoleLogs] = useState(existingRecording?.consoleLogs || []);
  const [networkLogs, setNetworkLogs] = useState(existingRecording?.networkLogs || []);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('console');
  const [comments, setComments] = useState(existingRecording?.comments || []);
  const [commentText, setCommentText] = useState("");
  const [detectedIssues, setDetectedIssues] = useState([]);
  
  // Saving/sharing state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [selectedBugs, setSelectedBugs] = useState([]);

  // Recording timer
  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Auto-detect issues from logs
  useEffect(() => {
    const issues = [];
    
    // Check console errors
    consoleLogs.forEach(log => {
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

    // Check network errors
    networkLogs.forEach(req => {
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

    setDetectedIssues(issues);
  }, [consoleLogs, networkLogs]);

  // Console capture
  const attachConsoleCapture = useCallback(() => {
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
        
        setConsoleLogs(prev => [...prev, logEntry]);
        originalMethods[level].apply(console, args);
      };
    });
    
    return () => {
      Object.keys(originalMethods).forEach(level => {
        console[level] = originalMethods[level];
      });
    };
  }, []);

  // Network capture
  const attachNetworkCapture = useCallback(() => {
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
        
        setNetworkLogs(prev => [...prev, logEntry]);
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
        
        setNetworkLogs(prev => [...prev, logEntry]);
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
        
        setNetworkLogs(prev => [...prev, logEntry]);
      });
      
      return originalSend.apply(this, [body]);
    };

    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalOpen;
      XMLHttpRequest.prototype.send = originalSend;
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      setChunks([]);
      setConsoleLogs([]);
      setNetworkLogs([]);
      setComments([]);
      setDetectedIssues([]);
      
      const cleanupConsole = attachConsoleCapture();
      const cleanupNetwork = attachNetworkCapture();

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          setChunks(prev => [...prev, ev.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        const tempVideo = document.createElement("video");
        tempVideo.src = url;
        tempVideo.onloadedmetadata = () => {
          setDuration(formatTime(tempVideo.duration));
        };
        
        cleanupConsole();
        cleanupNetwork();
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Failed to start screen recording. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      recorder.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  // Add comment at current time
  const addCommentAtCurrentTime = (text) => {
    if (!videoRef.current || !text.trim()) return;
    
    const currentTime = videoRef.current.currentTime;
    const comment = {
      id: `comment_${Date.now()}_${Math.random()}`,
      text: text.trim(),
      time: Number(currentTime.toFixed(1)),
      timeStr: formatTime(currentTime),
      createdAt: new Date().toISOString(),
    };
    
    setComments(prev => [...prev, comment]);
    setCommentText("");
  };

  // Seek to specific time
  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  // Upload video to YouTube (you'll need to implement this service)
  const uploadToYouTube = async (blob, metadata) => {
    // This should call your YouTube service
    // For now, returning a mock response
    console.log('Uploading to YouTube:', metadata);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      success: true, 
      data: { 
        videoId: `yt_${Date.now()}`, 
        url: `https://youtube.com/watch?v=demo_${Date.now()}` 
      } 
    };
  };

  // Save recording
  const saveRecording = async () => {
    if (!previewUrl && chunks.length === 0) {
      alert("No recording to save.");
      return;
    }

    if (!activeSuite?.id) {
      alert("Please select a test suite first.");
      return;
    }

    setSaving(true);
    setUploading(true);

    try {
      let blob;
      if (chunks.length) {
        blob = new Blob(chunks, { type: "video/webm" });
      } else if (previewUrl) {
        const resp = await fetch(previewUrl);
        blob = await resp.blob();
      }

      // Upload to YouTube
      const uploadResult = await uploadToYouTube(blob, {
        title: `Recording - ${activeSuite.name} - ${new Date().toLocaleDateString()}`,
        description: `Screen recording for test suite: ${activeSuite.name}`,
        privacy: 'private'
      });

      if (!uploadResult.success) {
        throw new Error('Failed to upload video');
      }

      // Save to Firestore
      const recordingData = {
        title: `Recording - ${new Date().toLocaleDateString()}`,
        videoUrl: uploadResult.data.url,
        youtubeId: uploadResult.data.videoId,
        duration,
        consoleLogs,
        networkLogs,
        comments,
        detectedIssues,
        platform: navigator.userAgent,
        suiteId: activeSuite.id,
        status: 'active'
      };

      const result = await firestoreService.createRecording(activeSuite.id, recordingData);
      
      if (result.success) {
        setShareLink(`/recordings/${result.data.id}`);
        alert("Recording saved successfully!");
      } else {
        throw new Error(result.error?.message || 'Failed to save recording');
      }
    } catch (err) {
      console.error("Failed to save recording:", err);
      alert("Failed to save recording: " + err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // Create bug from detected issue
  const createBugFromIssue = async (issue) => {
    if (!activeSuite?.id) {
      alert("Please select a test suite first.");
      return;
    }

    try {
      const bugData = {
        title: `Bug: ${issue.message}`,
        description: `Automatically detected issue from screen recording\n\nType: ${issue.type}\nSeverity: ${issue.severity}\nTime: ${issue.time}\n\nDetails: ${issue.message}`,
        severity: issue.severity,
        status: 'open',
        source: 'screen_recording',
        recordingData: {
          consoleLogs: issue.source === 'console' ? [issue] : [],
          networkLogs: issue.source === 'network' ? [issue.requestData] : [],
        }
      };

      const result = await firestoreService.createBug(activeSuite.id, bugData);
      
      if (result.success) {
        setSelectedBugs(prev => [...prev, result.data.id]);
        alert("Bug created successfully!");
      } else {
        throw new Error(result.error?.message || 'Failed to create bug');
      }
    } catch (err) {
      console.error("Failed to create bug:", err);
      alert("Failed to create bug: " + err.message);
    }
  };

  // Video player overlay state
  const [playerOverlayHidden, setPlayerOverlayHidden] = useState(false);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const onPlay = () => setPlayerOverlayHidden(true);
    const onPause = () => setPlayerOverlayHidden(false);
    
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'viewer' ? 'Recording Viewer' : 'Screen Recorder'}
          </h2>
          
          <div className="flex items-center space-x-2">
            {recording && (
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {mode === 'recorder' && (
                <>
                  {!recording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Recording</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop Recording</span>
                    </button>
                  )}
                  
                  {previewUrl && !recording && (
                    <button
                      onClick={saveRecording}
                      disabled={saving}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? <Upload className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{uploading ? "Uploading..." : "Save Recording"}</span>
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Dev Tools */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('console')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'console'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Terminal className="w-4 h-4 inline mr-2" />
                Console ({consoleLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'network'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Network className="w-4 h-4 inline mr-2" />
                Network ({networkLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'issues'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bug className="w-4 h-4 inline mr-2" />
                Issues ({detectedIssues.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'console' && (
                <div className="h-full overflow-y-auto p-3">
                  {consoleLogs.length === 0 ? (
                    <div className="text-gray-500 text-sm">No console logs</div>
                  ) : (
                    <div className="space-y-1">
                      {consoleLogs.slice().reverse().map((log, i) => (
                        <div key={i} className="text-xs border-b border-gray-100 dark:border-gray-700 pb-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-[10px]">
                              {new Date(log.time).toLocaleTimeString()}
                            </span>
                            <span className={`font-medium text-[10px] px-1 rounded ${
                              log.level === 'error' ? 'bg-red-100 text-red-700' :
                              log.level === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {log.level}
                            </span>
                          </div>
                          <div className="mt-1 text-gray-700 dark:text-gray-300">
                            {log.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'network' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-3">
                    {networkLogs.length === 0 ? (
                      <div className="text-gray-500 text-sm">No network requests</div>
                    ) : (
                      <div className="space-y-1">
                        {networkLogs.slice().reverse().map((req, i) => (
                          <div 
                            key={req.id || i}
                            onClick={() => setSelectedRequest(req)}
                            className="cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs font-medium px-1 rounded ${
                                  req.status >= 400 ? 'bg-red-100 text-red-700' :
                                  req.status >= 300 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {req.method}
                                </span>
                                <span className={`text-xs font-medium ${
                                  req.status >= 400 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {req.status}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {req.duration}ms
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 truncate">
                              {req.url}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedRequest && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                      <div className="text-sm font-medium mb-2">Request Details</div>
                      <div className="text-xs space-y-1">
                        <div><strong>URL:</strong> {selectedRequest.url}</div>
                        <div><strong>Method:</strong> {selectedRequest.method}</div>
                        <div><strong>Status:</strong> {selectedRequest.status}</div>
                        <div><strong>Duration:</strong> {selectedRequest.duration}ms</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'issues' && (
                <div className="h-full overflow-y-auto p-3">
                  {detectedIssues.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <div>No issues detected</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detectedIssues.map((issue) => (
                        <div 
                          key={issue.id}
                          className={`p-3 rounded border-l-4 ${
                            issue.severity === 'high' ? 'border-red-500 bg-red-50' :
                            issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-blue-500 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className={`w-4 h-4 ${
                                  issue.severity === 'high' ? 'text-red-600' :
                                  issue.severity === 'medium' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`} />
                                <span className="text-sm font-medium capitalize">
                                  {issue.type.replace('_', ' ')}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                                  issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {issue.severity}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {issue.message}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {new Date(issue.time).toLocaleTimeString()}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => createBugFromIssue(issue)}
                              className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              disabled={selectedBugs.includes(issue.id)}
                            >
                              {selectedBugs.includes(issue.id) ? 'Created' : 'Create Bug'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-2">Comments</div>
              
              {/* Add comment */}
              <div className="flex space-x-2 mb-3">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs border rounded px-2 py-1"
                  onKeyPress={(e) => e.key === 'Enter' && addCommentAtCurrentTime(commentText)}
                />
                <button
                  onClick={() => addCommentAtCurrentTime(commentText)}
                  disabled={!commentText.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Comment at {videoRef.current ? formatTime(videoRef.current.currentTime || 0) : "0:00"}
                </button>
              </div>
              
              {/* Comments list */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {comments.length === 0 ? (
                  <div className="text-xs text-gray-500">No comments yet</div>
                ) : (
                  comments.slice().reverse().map(comment => (
                    <div key={comment.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => seekTo(comment.time)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          [{comment.timeStr}]
                        </button>
                        <span className="text-gray-400 text-[10px]">
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1">{comment.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Video */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-black relative">
              {previewUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Play overlay */}
                  {!playerOverlayHidden && (
                    <div
                      onClick={() => videoRef.current?.play()}
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/20"
                    >
                      <div className="bg-white/90 rounded-full p-6 shadow-lg">
                        <Play className="w-12 h-12 text-gray-800" />
                      </div>
                      <div className="mt-4 bg-black/70 text-white text-sm rounded px-3 py-1">
                        {duration}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <div>
                      {mode === 'recorder' 
                        ? "Start recording to see preview" 
                        : "No recording available"
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700">
              <div 
                className="h-2 bg-blue-500 transition-all duration-300"
                style={{ width: previewUrl ? "60%" : "0%" }}
              />
            </div>
          </div>
        </div>

        {/* Share link display */}
        {shareLink && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
            <div className="text-sm text-green-700 dark:text-green-300">
              Recording saved successfully! 
              <a 
                href={shareLink} 
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Recording
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedScreenRecorder;