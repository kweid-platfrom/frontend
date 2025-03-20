import React from 'react';

const AIProcessingModal = () => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
                <div className="w-full flex justify-center">
                    <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <h3 className="mt-4 text-xl font-medium text-gray-900">AI Processing Document</h3>
                <div className="mt-4">
                    <p className="text-sm text-gray-500">Our AI is analyzing your document to extract test cases. This may take a moment.</p>
                </div>
                <div className="mt-6">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4"></div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Extracting relevant test scenarios...</p>
                </div>
            </div>
        </div>
    );
};

export default AIProcessingModal;