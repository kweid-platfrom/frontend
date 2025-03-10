"use client"
import React, { useState, useRef } from "react";
import { Video, X, Play, Bug, FileText, Plus, Bell, Search, UserPlus } from "lucide-react";
import BugReportForm from "../BugReportForm";
import Image from "next/image";

const ScreenRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const videoRef = useRef(null);

    const startRecording = async () => {
        setShowModal(true);
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    return (
        <div>
            <header className="bg-[] shadow-sm z-10 py-3 px-4 md:px-6">
                <div className="flex items-center justify-between space-x-2">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-xs md:max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-600" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-400 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00897B] focus:border-[#00897B]"
                            placeholder="Search test cases, bugs, reports..."
                        />
                    </div>

                    {/* Buttons Container */}
                    <div className="flex items-center space-x-3 overflow-x-auto whitespace-nowrap rounded-sm px-3 py-2 bg-white">
                        {/* Run Tests */}
                        <button className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-white transition">
                            <Play className="h-4 w-4" />
                            <span className="hidden md:inline">Run Tests</span>
                        </button>

                        {/* Report Bug */}
                        <button 
                            className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-[#2D3142] transition"
                        >
                            <Bug className="h-4 w-4" />
                            <span className="hidden md:inline">Report Bug</span>
                        </button>

                        {/* Screen Record */}
                        <button 
                            className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-white transition"
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            <Video className="h-4 w-4" />
                            <span>{isRecording ? "Stop Recording" : "Record Screen"}</span>
                        </button>

                        {/* Generate Report */}
                        <button className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-white transition">
                            <FileText className="h-4 w-4" />
                            <span className="hidden md:inline">Generate Report</span>
                        </button>

                        {/* Add Test Case */}
                        <button className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#E1E2E6] hover:text-white transition">
                            <Plus className="h-4 w-4" />
                            <span className="hidden md:inline">Add Test Case</span>
                        </button>
                        <button className="text-[#2D3142] px-2 py-1 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-white transition">
                                <UserPlus className="h-5 w-5" />
                                <span className="hidden md:inline"></span>
                            </button>

                        {/* Notification Bell */}
                        <button className="p-1 rounded-full text-gray-600 hover:text-gray-800 relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                        </button>

                        {/* User Avatar & Add User Button */}
                        <div className="flex items-center space-x-2">
                            <Image
                                className="h-8 w-8 rounded-full bg-indigo-500"
                                src="/api/placeholder/32/32"
                                alt="User avatar"
                                width={32}
                                height={32}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-96">
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                            <h2 className="text-lg font-semibold">Screen Recording</h2>
                            <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
                        </div>
                        <video ref={videoRef} src={videoUrl} controls className="w-full" />
                        <BugReportForm />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenRecorder;
