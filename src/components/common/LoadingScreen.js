import React, { useState, useEffect } from 'react';
import { 
    Video, 
    Zap, 
    BarChart3,
    WifiOff
} from 'lucide-react';
import {
    BugAntIcon,
    BeakerIcon,
} from '@heroicons/react/24/outline';

const LoadingScreen = ({ message = 'Loading your workspace' }) => {
    const [currentIconIndex, setCurrentIconIndex] = useState(0);
    const [isOffline, setIsOffline] = useState(false);
    const [showOffline, setShowOffline] = useState(false);

    const icons = [
        { icon: BugAntIcon, color: 'text-red-500' },
        { icon: BeakerIcon, color: 'text-blue-500' },
        { icon: BarChart3, color: 'text-green-500' },
        { icon: Video, color: 'text-purple-500' },
        { icon: Zap, color: 'text-yellow-500' }
    ];

    useEffect(() => {
        // Check if truly offline
        const checkOnlineStatus = () => {
            setIsOffline(!navigator.onLine);
        };

        checkOnlineStatus();

        const handleOnline = () => {
            setIsOffline(false);
            setShowOffline(false);
        };
        
        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Only show offline UI after 2 seconds to avoid false positives
        const offlineTimer = setTimeout(() => {
            if (!navigator.onLine) {
                setShowOffline(true);
            }
        }, 2000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearTimeout(offlineTimer);
        };
    }, []);

    useEffect(() => {
        if (isOffline && showOffline) return; // Don't animate when showing offline state

        const interval = setInterval(() => {
            setCurrentIconIndex((prevIndex) => (prevIndex + 1) % icons.length);
        }, 600);

        return () => clearInterval(interval);
    }, [icons.length, isOffline, showOffline]);

    // Show offline state only if truly offline AND enough time has passed
    if (isOffline && showOffline) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center space-y-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                            <WifiOff className="h-10 w-10 text-red-500 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                            No Internet Connection
                        </h2>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">
                            Please check your network settings and try again
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 font-medium"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // Normal loading state
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center space-y-6">
                {/* Icon Animation */}
                <div className="flex items-center justify-center space-x-4">
                    {icons.map((iconData, index) => {
                        const Icon = iconData.icon;
                        const isActive = index === currentIconIndex;
                        
                        return (
                            <div
                                key={index}
                                className={`
                                    transition-all duration-300 ease-in-out
                                    ${isActive ? 'transform scale-125' : 'transform scale-100'}
                                `}
                            >
                                <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center
                                    transition-all duration-300 ease-in-out
                                    ${isActive 
                                        ? 'bg-white shadow-lg' 
                                        : 'bg-gray-200'
                                    }
                                `}>
                                    <Icon 
                                        className={`
                                            h-4 w-4 transition-all duration-300 ease-in-out
                                            ${isActive ? iconData.color : 'text-gray-400'}
                                        `} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Loading message */}
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {message || 'Loading your workspace'}
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