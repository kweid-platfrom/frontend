'use client';

import React, { useState, useEffect } from 'react';
import { BugAntIcon } from '@heroicons/react/24/outline';

const LoadingSpinner = ({
    size = 'md',
    className = '',
    variant = 'default',
    color = 'teal',
    speed = 'normal',
    text = null,
    fullscreen = false,
    overlay = false,
    progress = null,
    pulseCenter = false,
    showDots = false
}) => {
    const [dots, setDots] = useState('');

    // Size classes with improved scaling
    const sizeClasses = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-24 w-24'
    };

    // Icon size classes for BugAnt variant
    const iconSizeClasses = {
        xs: 'h-4 w-4',
        sm: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-10 w-10',
        '2xl': 'h-12 w-12'
    };

    // Color schemes with proper contrast
    const colorSchemes = {
        teal: {
            primary: 'border-teal-600',
            secondary: 'border-gray-200',
            accent: 'bg-teal-50',
            text: 'text-teal-700',
            progress: 'bg-teal-500',
            icon: 'text-teal-600'
        },
        blue: {
            primary: 'border-blue-600',
            secondary: 'border-gray-200',
            accent: 'bg-blue-50',
            text: 'text-blue-700',
            progress: 'bg-blue-500',
            icon: 'text-blue-600'
        },
        indigo: {
            primary: 'border-indigo-600',
            secondary: 'border-gray-200',
            accent: 'bg-indigo-50',
            text: 'text-indigo-700',
            progress: 'bg-indigo-500',
            icon: 'text-indigo-600'
        },
        purple: {
            primary: 'border-purple-600',
            secondary: 'border-gray-200',
            accent: 'bg-purple-50',
            text: 'text-purple-700',
            progress: 'bg-purple-500',
            icon: 'text-purple-600'
        },
        pink: {
            primary: 'border-pink-600',
            secondary: 'border-gray-200',
            accent: 'bg-pink-50',
            text: 'text-pink-700',
            progress: 'bg-pink-500',
            icon: 'text-pink-600'
        },
        gray: {
            primary: 'border-gray-600',
            secondary: 'border-gray-200',
            accent: 'bg-gray-50',
            text: 'text-gray-700',
            progress: 'bg-gray-500',
            icon: 'text-gray-600'
        }
    };

    // Speed classes for different animation speeds
    const speedClasses = {
        slow: 'duration-1000',
        normal: 'duration-700',
        fast: 'duration-500'
    };

    // Speed values for bug animation
    const bugSpeedValues = {
        slow: '3s',
        normal: '2s',
        fast: '1.5s'
    };

    const colors = colorSchemes[color] || colorSchemes.teal;

    // Animated dots effect
    useEffect(() => {
        if (showDots || text) {
            const interval = setInterval(() => {
                setDots(prev => prev.length >= 3 ? '' : prev + '.');
            }, 500);
            return () => clearInterval(interval);
        }
    }, [showDots, text]);

    // Spinner variants
    const SpinnerVariant = ({ variant: variantType, size: spinnerSize }) => {
        const baseClasses = `${sizeClasses[spinnerSize]} ${speedClasses[speed]} ease-linear`;

        switch (variantType) {
            case 'bugs':
                return (
                    <div className="relative flex items-center justify-center" style={{ width: '120px', height: '40px' }}>
                        {[0, 1, 2].map((i) => (
                            <BugAntIcon
                                key={i}
                                className={`absolute ${iconSizeClasses[spinnerSize]} ${colors.icon} bug-move`}
                                style={{
                                    animationDelay: `${i * 0.5}s`,
                                    animationDuration: bugSpeedValues[speed],
                                }}
                            />
                        ))}
                    </div>
                );

            case 'dots':
                return (
                    <div className={`flex space-x-1 ${baseClasses.replace('ease-linear', '')}`}>
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 ${colors.progress} rounded-full animate-bounce`}
                                style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }}
                            />
                        ))}
                    </div>
                );

            case 'pulse':
                return (
                    <div className={`${baseClasses} ${colors.progress} rounded-full animate-pulse`} />
                );

            case 'ring':
                return (
                    <div className={`${baseClasses} relative`}>
                        <div className={`absolute inset-0 rounded-full border-2 ${colors.secondary}`} />
                        <div className={`absolute inset-0 rounded-full border-2 ${colors.primary} border-t-transparent animate-spin ${speedClasses[speed]}`} />
                    </div>
                );

            case 'dual-ring':
                return (
                    <div className={`${baseClasses} relative`}>
                        {/* Outer ring */}
                        <div className={`absolute inset-0 rounded-full border-2 ${colors.secondary}`} />
                        <div className={`absolute inset-0 rounded-full border-2 ${colors.primary} border-t-transparent animate-spin ${speedClasses[speed]}`} />
                        {/* Inner ring */}
                        <div className={`absolute inset-2 rounded-full border-2 ${colors.secondary}`} />
                        <div className={`absolute inset-2 rounded-full border-2 ${colors.primary} border-b-transparent animate-spin ${speedClasses[speed]} reverse-spin`} />
                    </div>
                );

            case 'bars':
                return (
                    <div className={`flex items-end space-x-1 ${baseClasses.replace('ease-linear', '')}`}>
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-1 ${colors.progress} animate-pulse`}
                                style={{
                                    height: `${20 + (i % 2) * 10}px`,
                                    animationDelay: `${i * 0.15}s`,
                                    animationDuration: '1s'
                                }}
                            />
                        ))}
                    </div>
                );

            case 'orbit':
                return (
                    <div className={`${baseClasses} relative`}>
                        <div className={`absolute inset-0 rounded-full border ${colors.secondary}`} />
                        <div className={`absolute top-0 left-1/2 w-2 h-2 -mt-1 -ml-1 ${colors.progress} rounded-full animate-spin ${speedClasses[speed]} origin-center`}
                            style={{ transformOrigin: `0 ${sizeClasses[spinnerSize].includes('h-3') ? '6px' : sizeClasses[spinnerSize].includes('h-4') ? '8px' : sizeClasses[spinnerSize].includes('h-8') ? '16px' : sizeClasses[spinnerSize].includes('h-12') ? '24px' : sizeClasses[spinnerSize].includes('h-16') ? '32px' : '48px'}` }} />
                    </div>
                );

            default: // Enhanced default spinner
                return (
                    <div className={`${baseClasses} relative`}>
                        {/* Outer ring */}
                        <div className={`absolute inset-0 rounded-full border-4 ${colors.secondary}`} />
                        {/* Spinning ring */}
                        <div className={`absolute inset-0 rounded-full border-4 ${colors.primary} border-t-transparent animate-spin ${speedClasses[speed]}`} />
                        {/* Center pulse (optional) */}
                        {pulseCenter && (
                            <div className={`absolute inset-3 rounded-full ${colors.accent} animate-pulse`} />
                        )}
                    </div>
                );
        }
    };

    // Progress ring component
    const ProgressRing = ({ progress: progressValue, size: ringSize }) => {
        const radius = ringSize === 'xl' ? 28 : ringSize === 'lg' ? 20 : ringSize === 'md' ? 14 : 10;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (progressValue / 100) * circumference;

        return (
            <div className={`${sizeClasses[ringSize]} relative`}>
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 64 64">
                    {/* Background circle */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className={colors.secondary}
                    />
                    {/* Progress circle */}
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className={colors.primary}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.35s' }}
                    />
                </svg>
                {/* Progress percentage */}
                <div className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${colors.text}`}>
                    {Math.round(progressValue)}%
                </div>
            </div>
        );
    };

    // Main spinner content
    const spinnerContent = (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            {/* Spinner or progress ring */}
            {progress !== null ? (
                <ProgressRing progress={progress} size={size} />
            ) : (
                <SpinnerVariant variant={variant} size={size} />
            )}

            {/* Text with animated dots */}
            {text && (
                <div className={`mt-4 text-center ${colors.text} ${size === 'xs' || size === 'sm' ? 'text-xs' :
                    size === 'xl' || size === '2xl' ? 'text-lg font-medium' : 'text-sm'
                    }`}>
                    {text}{showDots && dots}
                </div>
            )}
        </div>
    );

    // Fullscreen wrapper
    if (fullscreen) {
        return (
            <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlay ? 'bg-black bg-opacity-50' : 'bg-white'
                }`}>
                {spinnerContent}
            </div>
        );
    }

    return spinnerContent;
};

// Additional custom CSS for animations
const spinnerStyles = `
  @keyframes reverse-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }
  
  @keyframes bug-move {
    0% {
      transform: translateX(-40px) scaleX(1);
    }
    25% {
      transform: translateX(-20px) scaleX(1);
    }
    50% {
      transform: translateX(20px) scaleX(-1);
    }
    75% {
      transform: translateX(40px) scaleX(-1);
    }
    100% {
      transform: translateX(-40px) scaleX(1);
    }
  }
  
  .reverse-spin {
    animation: reverse-spin 1s linear infinite;
  }
  
  .bug-move {
    animation: bug-move linear infinite;
  }
`;

// Inject styles (in a real app, this would go in your CSS file)
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = spinnerStyles;
    document.head.appendChild(styleSheet);
}

export default LoadingSpinner;