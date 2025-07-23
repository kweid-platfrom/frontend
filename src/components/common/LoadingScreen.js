// components/LoadingScreen.js
import React from 'react';

const LoadingScreen = ({ message = "Loading..." }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
                {/* Loading spinner */}
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-solid rounded-full animate-spin mx-auto">
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-teal-600 border-solid rounded-full animate-spin"></div>
                    </div>
                </div>

                {/* Loading message */}
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {message}
                    </h2>
                    <p className="text-sm text-gray-600">
                        Please wait while we prepare your workspace
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;