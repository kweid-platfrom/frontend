import React, { useState, useEffect } from 'react';
import { 
    Video, 
    Zap, 
    BarChart3
} from 'lucide-react';
import {
    BugAntIcon,
    BeakerIcon,
} from '@heroicons/react/24/outline';

const LoadingScreen = () => {
    const [currentIconIndex, setCurrentIconIndex] = useState(0);

    const icons = [
        { icon: BugAntIcon, color: 'text-red-500' },
        { icon: BeakerIcon, color: 'text-blue-500' },
        { icon: BarChart3, color: 'text-green-500' },
        { icon: Video, color: 'text-purple-500' },
        { icon: Zap, color: 'text-yellow-500' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIconIndex((prevIndex) => (prevIndex + 1) % icons.length);
        }, 600);

        return () => clearInterval(interval);
    }, [icons.length]);

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
                        Loading your workspace
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