"use client"
import React, { useState, useRef, useEffect } from "react";
import { Video } from "lucide-react";

const ScreenRecorderButton = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [stream, setStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [countdown, setCountdown] = useState(3);
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
    const [showBugForm, setShowBugForm] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [isSelectingSource, setIsSelectingSource] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [networkErrors, setNetworkErrors] = useState([]);
    const [bugReport, setBugReport] = useState({
        title: "",
        description: "",
        category: "Technical",
        stepsToReproduce: "",
        attachment: null,
        severity: "Medium",
        browser: "",
        os: "",
        timestamp: "",
        networkDetails: ""
    });

    const buttonRef = useRef(null);
    const overlayRef = useRef(null);
    const timerRef = useRef(null);
    const videoRef = useRef(null);
    const networkMonitorRef = useRef(null);

    // Calculate overlay position relative to button
    const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (showOverlay && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setOverlayPosition({
                top: rect.top - 8, // Position slightly above the button
                left: rect.left - 176 + (rect.width / 2) // Center the 350px overlay
            });
        }
    }, [showOverlay]);

    // Handle countdown
    useEffect(() => {
        if (countdown > 0 && isCountdownActive) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (countdown === 0 && isCountdownActive) {
            startRecording();
            setIsCountdownActive(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown, isCountdownActive]);

    // Set up network error monitoring
    useEffect(() => {
        if (isRecording) {
            // Start monitoring network errors
            networkMonitorRef.current = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    // Filter for failed network requests
                    if (entry.entryType === 'resource' && (
                        entry.transferSize === 0 || 
                        entry.responseStatus >= 400 ||
                        entry.name.includes('error')
                    )) {
                        setNetworkErrors(prev => [...prev, {
                            url: entry.name,
                            initiatorType: entry.initiatorType,
                            startTime: entry.startTime,
                            duration: entry.duration,
                            responseStatus: entry.responseStatus || 'unknown',
                            timestamp: new Date().toISOString()
                        }]);
                    }
                });
            });

            networkMonitorRef.current.observe({ entryTypes: ['resource'] });
        } else if (networkMonitorRef.current) {
            // Stop monitoring when not recording
            networkMonitorRef.current.disconnect();
        }

        return () => {
            if (networkMonitorRef.current) {
                networkMonitorRef.current.disconnect();
            }
        };
    }, [isRecording]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (networkMonitorRef.current) {
                networkMonitorRef.current.disconnect();
            }
        };
    }, [stream]);

    // Handle clicking outside of overlay
    useEffect(() => {
        function handleClickOutside(event) {
            if (overlayRef.current &&
                !overlayRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target) &&
                !isRecording) {
                setShowOverlay(false);
                setCountdown(3);
                setIsCountdownActive(false);
                setIsSelectingSource(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isRecording]);

    // Real function to check for network errors
    const checkForNetworkErrors = () => {
        return networkErrors.length > 0;
    };

    // Function to gather browser and system information
    const gatherSystemInfo = () => {
        const browserInfo = navigator.userAgent;
        const osInfo = navigator.platform;
        const now = new Date();

        // Actual network error details from our monitoring
        const networkErrorDetails = networkErrors.length > 0 
            ? JSON.stringify(networkErrors, null, 2)
            : "No network errors detected";

        return {
            browser: browserInfo,
            os: osInfo,
            timestamp: now.toISOString(),
            networkDetails: networkErrorDetails
        };
    };

    const toggleOverlay = () => {
        if (isRecording) {
            stopRecording();
        } else {
            setShowOverlay(true);
            setCountdown(3);
        }
    };

    const initiateRecording = async () => {
        setIsSelectingSource(true);
        // Reset network errors for new recording
        setNetworkErrors([]);

        try {
            // This will prompt the browser's native UI for selecting what to record
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: true
            });

            // User has selected what to record and clicked Share in the browser UI
            setStream(displayStream);
            setIsSelectingSource(false);

            // Now start the countdown
            setIsCountdownActive(true);
        } catch (error) {
            console.error("Error accessing display media:", error);
            setIsSelectingSource(false);
            setShowOverlay(false);
        }
    };

    const startRecording = async () => {
        try {
            if (!stream) {
                console.error("No stream available for recording");
                return;
            }

            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks(prev => [...prev, event.data]);
                }
            };

            recorder.onstop = handleRecordingStop;

            recorder.start();
            setIsRecording(true);
            setShowOverlay(false); // Hide overlay to allow user to continue using the app

            // Start recording timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);

        } catch (error) {
            console.error("Error starting screen recording:", error);
            setShowOverlay(false);
            setCountdown(3);
            setIsCountdownActive(false);

            // Stop stream if it exists
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();

            // Stop all tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            // Clear timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            // Check for network errors
            const hasNetworkError = checkForNetworkErrors();
            setNetworkError(hasNetworkError);

            if (hasNetworkError) {
                // Automatically generate bug report with actual network errors
                const systemInfo = gatherSystemInfo();

                // Create steps to reproduce
                const stepsToReproduce = `
1. Attempted to record screen for ${formatTime(recordingTime)}
2. Network errors detected during recording (see Network Details)
3. Error(s) occurred at ${systemInfo.timestamp}`;

                const generatedReport = {
                    title: "Network Error During Screen Recording",
                    description: `Network errors detected during screen recording session. The recording lasted ${formatTime(recordingTime)} and was ${recordedChunks.reduce((total, chunk) => total + chunk.size, 0) / (1024 * 1024).toFixed(2)} MB in size.`,
                    category: "Network",
                    stepsToReproduce: stepsToReproduce,
                    attachment: null, // Will be filled with the recording blob
                    severity: "High",
                    ...systemInfo
                };

                setBugReport(generatedReport);
                setShowBugForm(true);
                setShowOverlay(true);
            }
        }
    };

    const handleRecordingStop = () => {
        // Create a blob from the recorded chunks
        const blob = new Blob(recordedChunks, { type: "video/webm" });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        setVideoPreviewUrl(url);

        // Set the blob as attachment for bug report
        setBugReport(prev => ({
            ...prev,
            attachment: blob
        }));

        // Reset recording state
        setIsRecording(false);
        setRecordingTime(0);
        setShowOverlay(true);

        // Handle the recording data for normal flow (no network error)
        if (onRecordingComplete && !networkError) {
            onRecordingComplete({
                blob,
                url,
                type: "video/webm"
            });
        }
    };

    const cancelRecording = () => {
        setShowOverlay(false);
        setCountdown(3);
        setIsCountdownActive(false);
        setIsSelectingSource(false);
        setSaveSuccess(false);

        // If recording is active, stop it
        if (isRecording) {
            stopRecording();
        }

        // If stream exists but not recording yet, stop it
        if (stream && !isRecording) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        // Clear any recorded data
        setRecordedChunks([]);
        setVideoPreviewUrl(null);
        setShowBugForm(false);
    };

    const handleBugReportSubmit = async (event) => {
        event.preventDefault();

        // Prepare form data for submission
        const formData = new FormData();
        formData.append('title', bugReport.title);
        formData.append('description', bugReport.description);
        formData.append('category', bugReport.category);
        formData.append('stepsToReproduce', bugReport.stepsToReproduce);
        formData.append('severity', bugReport.severity);
        formData.append('systemInfo', JSON.stringify({
            browser: bugReport.browser,
            os: bugReport.os,
            timestamp: bugReport.timestamp
        }));
        formData.append('networkDetails', bugReport.networkDetails);

        // Append the recording as an attachment
        if (bugReport.attachment) {
            formData.append('attachment', bugReport.attachment, 'screen-recording.webm');
        }

        try {
            // Make the actual API call to submit the bug report
            const response = await fetch('/api/bug-reports', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error submitting bug report: ${response.status}`);
            }

            console.log("Bug report submitted successfully");
            
            // Reset states
            setShowBugForm(false);
            setNetworkError(false);
            setShowOverlay(false);
            setNetworkErrors([]);
            
        } catch (error) {
            console.error("Error submitting bug report:", error);
            // Handle submission error (could show an error message to the user)
        }
    };

    // Save recording to recordings page
    const saveRecording = async () => {
        if (!videoPreviewUrl || recordedChunks.length === 0) return;
        
        setIsSaving(true);
        
        try {
            // Create a blob from the recorded chunks
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            
            // Create form data to send to server
            const formData = new FormData();
            formData.append('recording', blob, `recording-${new Date().toISOString()}.webm`);
            formData.append('duration', recordingTime.toString());
            formData.append('timestamp', new Date().toISOString());
            formData.append('fileSize', blob.size.toString());
            
            // Send to server
            const response = await fetch('/api/recordings', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error saving recording: ${response.status}`);
            }
            
            // Show success message
            setSaveSuccess(true);
            
            // Notify parent component if needed
            if (onRecordingComplete) {
                onRecordingComplete({
                    blob,
                    url: videoPreviewUrl,
                    type: "video/webm",
                    duration: recordingTime,
                    saved: true
                });
            }
            
            // Close overlay after short delay
            setTimeout(() => {
                setShowOverlay(false);
                setSaveSuccess(false);
                // Reset for next recording
                setVideoPreviewUrl(null);
                setRecordedChunks([]);
            }, 1500);
            
        } catch (error) {
            console.error("Error saving recording:", error);
            // Handle save error - could trigger the bug report form here
            const hasNetworkError = true;
            setNetworkError(hasNetworkError);
            
            if (hasNetworkError) {
                // Generate bug report for save error
                const systemInfo = gatherSystemInfo();
                
                const stepsToReproduce = `
1. Recorded screen for ${formatTime(recordingTime)}
2. Attempted to save recording to recordings page
3. Received network error during save process
4. Error occurred at ${systemInfo.timestamp}`;
                
                const generatedReport = {
                    title: "Error Saving Recording",
                    description: `Failed to save screen recording to recordings page. The recording was ${formatTime(recordingTime)} in duration.`,
                    category: "Network",
                    stepsToReproduce: stepsToReproduce,
                    attachment: blob,
                    severity: "High",
                    ...systemInfo
                };
                
                setBugReport(generatedReport);
                setShowBugForm(true);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Format seconds into HH:MM:SS
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get button text based on recording state
    const getButtonText = () => {
        if (isRecording) {
            return `Stop ${formatTime(recordingTime)}`;
        } else {
            return "Record Screen";
        }
    };

    return (
        <div className="relative flex items-center">
            {/* Recording Button */}
            <button
                ref={buttonRef}
                className={`px-3 py-2 cursor-pointer text-sm rounded-xs flex items-center space-x-2 transition ${isRecording
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "text-[#2D3142] hover:bg-[#A5D6A7] hover:text-[#2d3142]"
                    }`}
                onClick={toggleOverlay}
                disabled={isSelectingSource}
            >
                <Video className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
                <span className="hidden md:inline">{getButtonText()}</span>
                {isRecording && <span className="ml-1 text-red-500 animate-pulse">●</span>}
            </button>

            {/* Screen Recorder Overlay */}
            {showOverlay && (
                <div
                    ref={overlayRef}
                    className="fixed bg-white border border-gray-300 shadow-xl rounded-lg text-sm z-50 w-80 max-h-[90vh] overflow-auto justify-center text-ce" /* Added max-height and overflow */
                    style={{
                        top: `${overlayPosition.top}px`,
                        left: `${overlayPosition.left}px`
                    }}
                >
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-3">Screen Recording</h3>

                        {isSelectingSource ? (
                            <div className="text-center py-4">
                                <div className="animate-pulse text-gray-600 mb-4">
                                    Recording Options
                                </div>
                            </div>
                        ) : isCountdownActive && countdown > 0 ? (
                            <div className="text-center py-6">
                                <div className="text-5xl font-bold text-[#00897B] mb-2">{countdown}</div>
                                <p className="text-gray-600">Recording will start in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
                            </div>
                        ) : isRecording ? (
                            <div className="text-center py-4">
                                <div className="inline-flex items-center justify-center bg-red-100 text-red-800 px-3 py-1 rounded-full mb-2">
                                    <span className="animate-pulse mr-2">●</span>
                                    <span className="font-medium">Recording: {formatTime(recordingTime)}</span>
                                </div>
                                <p className="text-gray-600 mb-4">Recording your screen. Click &quot;Stop&quot; when you&apos;re done.</p>
                                <button
                                    onClick={stopRecording}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
                                >
                                    Stop Recording
                                </button>
                            </div>
                        ) : showBugForm ? (
                            <div className="py-3">
                                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                                    <p className="font-medium">Network Error Detected</p>
                                    <p className="text-sm">Please confirm and submit this bug report.</p>
                                </div>
                                <form onSubmit={handleBugReportSubmit} className="overflow-visible">
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={bugReport.title}
                                            onChange={(e) => setBugReport({ ...bugReport, title: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={bugReport.description}
                                            onChange={(e) => setBugReport({ ...bugReport, description: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700 text-sm"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={bugReport.category}
                                            onChange={(e) => setBugReport({ ...bugReport, category: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                                        >
                                            <option value="Network">Network</option>
                                            <option value="UI">UI</option>
                                            <option value="Performance">Performance</option>
                                            <option value="Technical">Technical</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Steps to Reproduce
                                        </label>
                                        <textarea
                                            value={bugReport.stepsToReproduce}
                                            onChange={(e) => setBugReport({ ...bugReport, stepsToReproduce: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700 text-sm"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Severity
                                        </label>
                                        <select
                                            value={bugReport.severity}
                                            onChange={(e) => setBugReport({ ...bugReport, severity: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Attachment
                                        </label>
                                        <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 text-xs">
                                            <p>Screen recording attached ({
                                                bugReport.attachment ?
                                                    (bugReport.attachment.size / (1024 * 1024)).toFixed(2) + " MB" :
                                                    "No file"
                                            })</p>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            System Information
                                        </label>
                                        <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 text-xs font-mono overflow-auto max-h-24">
                                            <div><strong>Browser:</strong> {bugReport.browser?.substring(0, 50)}...</div>
                                            <div><strong>OS:</strong> {bugReport.os}</div>
                                            <div><strong>Timestamp:</strong> {bugReport.timestamp}</div>
                                            <div className="mt-1"><strong>Network Details:</strong></div>
                                            <pre className="text-xs overflow-x-auto">{bugReport.networkDetails}</pre>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 sticky bottom-0 bg-white pt-2 pb-1">
                                        <button
                                            type="button"
                                            onClick={cancelRecording}
                                            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-xs hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-[#00897B] hover:bg-[#00796B] text-white py-2 px-4 rounded-xs transition"
                                        >
                                            Submit Report
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : videoPreviewUrl ? (
                            <div className="py-3">
                                <p className="text-gray-700 mb-2">Recording Preview:</p>
                                <video
                                    ref={videoRef}
                                    src={videoPreviewUrl}
                                    controls
                                    className="w-full h-40 bg-black rounded-md mb-3"
                                />
                                {saveSuccess ? (
                                    <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Successfully saved to recordings!</span>
                                    </div>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={cancelRecording}
                                            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-xs hover:bg-gray-50 transition"
                                            disabled={isSaving}
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={saveRecording}
                                            className="flex-1 bg-[#00897B] hover:bg-[#00796B] text-white py-2 px-4 rounded-xs transition"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </span>
                                            ) : "Save to Recordings"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-3">
                                <p className="text-gray-600 mb-4">Click the Start Button to proceed</p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={cancelRecording}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-2 rounded-xs hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={initiateRecording}
                                        className="flex-1 bg-[#00897B] hover:bg-[#00796B] text-white py-2 px-2 rounded-xs transition"
                                    >
                                        Start
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenRecorderButton;