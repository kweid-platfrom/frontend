/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useRef, useEffect } from "react";
import { Video, Plus, UserCircle } from "lucide-react";

const ScreenRecorderButton = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [stream, setStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [countdown, setCountdown] = useState(3);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
    const [showBugForm, setShowBugForm] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [bugReport, setBugReport] = useState({
        title: "",
        description: "",
        browser: "",
        os: "",
        timestamp: "",
        networkDetails: ""
    });

    const buttonRef = useRef(null);
    const overlayRef = useRef(null);
    const timerRef = useRef(null);
    const videoRef = useRef(null);

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
        if (countdown > 0 && showOverlay && !isRecording) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (countdown === 0 && !isRecording && showOverlay) {
            startRecording();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown, showOverlay, isRecording]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
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
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isRecording]);

    // Mock function to check for network errors
    const checkForNetworkErrors = () => {
        // This would be replaced with actual network check logic
        // For now, let's simulate random network errors for demonstration
        return Math.random() < 0.5; // 50% chance of network error
    };

    // Function to gather browser and system information
    const gatherSystemInfo = () => {
        const browserInfo = navigator.userAgent;
        const osInfo = navigator.platform;
        const now = new Date();
        
        // Mock network error details - in a real app, you'd capture actual errors
        const mockNetworkError = {
            status: 503,
            endpoint: "/api/upload-recording",
            error: "Service Unavailable",
            latency: "2541ms"
        };
        
        return {
            browser: browserInfo,
            os: osInfo,
            timestamp: now.toISOString(),
            networkDetails: JSON.stringify(mockNetworkError, null, 2)
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

    const startRecording = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: true
            });

            setStream(displayStream);

            const recorder = new MediaRecorder(displayStream);
            setMediaRecorder(recorder);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks(prev => [...prev, event.data]);
                }
            };

            recorder.onstop = handleRecordingStop;

            recorder.start();
            setIsRecording(true);

            // Start recording timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);

        } catch (error) {
            console.error("Error starting screen recording:", error);
            setShowOverlay(false);
            setCountdown(3);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();

            // Stop all tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Clear timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            
            // Check for network errors
            const hasNetworkError = checkForNetworkErrors();
            setNetworkError(hasNetworkError);
            
            if (hasNetworkError) {
                // Automatically generate bug report
                const systemInfo = gatherSystemInfo();
                
                const generatedReport = {
                    title: "Network Error During Screen Recording Upload",
                    description: `Failed to upload screen recording due to network error. The recording lasted ${formatTime(recordingTime)} and was ${recordedChunks.reduce((total, chunk) => total + chunk.size, 0) / (1024 * 1024)} MB in size.`,
                    ...systemInfo
                };
                
                setBugReport(generatedReport);
                setShowBugForm(true);
            }
        }
    };

    const handleRecordingStop = () => {
        // Create a blob from the recorded chunks
        const blob = new Blob(recordedChunks, { type: "video/webm" });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        setVideoPreviewUrl(url);

        // Reset recording state
        setIsRecording(false);
        setRecordingTime(0);

        // Handle the recording data (you can save it, send it, etc.)
        if (onRecordingComplete) {
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

        // If recording is active, stop it
        if (isRecording) {
            stopRecording();
        }

        // Clear any recorded data
        setRecordedChunks([]);
        setVideoPreviewUrl(null);
        setShowBugForm(false);
    };

    const handleBugReportSubmit = (event) => {
        event.preventDefault();
        // Submit the bug report
        console.log("Bug report submitted:", bugReport);
        setShowBugForm(false);
        setNetworkError(false);
        setShowOverlay(false);
    };

    // Format seconds into MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get button text based on recording state
    const getButtonText = () => {
        if (isRecording) {
            return `Stop Recording (${formatTime(recordingTime)})`;
        } else {
            return "Record Screen";
        }
    };

    return (
        <div className="relative flex items-center">
            {/* Add Team Member Button */}
            <button
                className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-1 hover:bg-gray-100 transition mr-2"
            >
                <Plus className="h-4 w-4" />
                <UserCircle className="h-4 w-4" />
            </button>
            
            {/* Recording Button */}
            <button
                ref={buttonRef}
                className={`px-3 py-2 text-sm rounded-xs flex items-center space-x-2 transition ${
                    isRecording 
                        ? "bg-red-100 text-red-700 hover:bg-red-200" 
                        : "text-[#2D3142] hover:bg-[#A5D6A7] hover:text-white"
                }`}
                onClick={toggleOverlay}
            >
                <Video className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
                <span className="hidden md:inline">{getButtonText()}</span>
                {isRecording && <span className="ml-1 text-red-500 animate-pulse">●</span>}
            </button>

            {/* Screen Recorder Overlay */}
            {showOverlay && (
                <div
                    ref={overlayRef}
                    className="fixed bg-white border border-gray-300 shadow-xl rounded-lg text-sm z-50 w-96"
                    style={{
                        top: `${overlayPosition.top}px`,
                        left: `${overlayPosition.left}px`
                    }}
                >
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-3">Screen Recording</h3>

                        {countdown > 0 && !isRecording ? (
                            <div className="text-center py-6">
                                <div className="text-5xl font-bold text-indigo-600 mb-2">{countdown}</div>
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
                                <form onSubmit={handleBugReportSubmit}>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Title
                                        </label>
                                        <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700">
                                            {bugReport.title}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Description
                                        </label>
                                        <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 text-sm min-h-16">
                                            {bugReport.description}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 font-medium mb-1">
                                            System Information
                                        </label>
                                        <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 text-xs font-mono overflow-auto max-h-32">
                                            <div><strong>Browser:</strong> {bugReport.browser?.substring(0, 50)}...</div>
                                            <div><strong>OS:</strong> {bugReport.os}</div>
                                            <div><strong>Timestamp:</strong> {bugReport.timestamp}</div>
                                            <div className="mt-2"><strong>Network Details:</strong></div>
                                            <pre>{bugReport.networkDetails}</pre>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={cancelRecording}
                                            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
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
                                <div className="flex space-x-2">
                                    <button
                                        onClick={cancelRecording}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowOverlay(false);
                                            // Reset for next recording
                                            setVideoPreviewUrl(null);
                                            setRecordedChunks([]);
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition"
                                    >
                                        Keep Recording
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-3">
                                <p className="text-gray-600 mb-4">Click below to start recording your screen.</p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={cancelRecording}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setCountdown(3)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition"
                                    >
                                        Start Recording
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