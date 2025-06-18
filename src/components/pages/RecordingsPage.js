// app/dashboard/recorder/page.js - Screen Recorder Page
'use client'

export default function RecorderPage() {
    return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Screen Recorder</h1>
                    <p className="text-gray-600">Record your screen for test documentation</p>
                </div>
                
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Start Recording</h3>
                        <p className="text-gray-600 mb-4">Click the button below to start recording your screen</p>
                        <button className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700">
                            Start Recording
                        </button>
                    </div>
                </div>
            </div>
    );
}