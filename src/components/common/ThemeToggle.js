// components/common/ThemeToggle.jsx
'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useGlobalTheme } from '../../providers/GlobalThemeProvider';

const ThemeToggle = ({ 
    className = '', 
    showLabel = false, 
    variant = 'button',
    size = 'default' 
}) => {
    const { theme, effectiveTheme, setTheme, toggleTheme, isInitialized } = useGlobalTheme();

    // Don't render until theme is initialized to prevent hydration issues
    if (!isInitialized) {
        return (
            <div className={`${size === 'small' ? 'w-8 h-8' : 'w-10 h-10'} ${className}`}>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg w-full h-full" />
            </div>
        );
    }

    const getThemeIcon = (selectedTheme) => {
        const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';
        
        switch (selectedTheme) {
            case 'light':
                return <Sun className={iconSize} />;
            case 'dark':
                return <Moon className={iconSize} />;
            case 'system':
                return <Monitor className={iconSize} />;
            default:
                return <Sun className={iconSize} />;
        }
    };

    const getThemeLabel = (selectedTheme) => {
        switch (selectedTheme) {
            case 'light':
                return 'Light';
            case 'dark':
                return 'Dark';
            case 'system':
                return 'System';
            default:
                return 'Light';
        }
    };

    // Dropdown variant
    if (variant === 'dropdown') {
        return (
            <div className={`relative ${className}`}>
                <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="appearance-none bg-background border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-foreground"
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        );
    }

    // Segmented variant
    if (variant === 'segmented') {
        return (
            <div className={`flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 ${className}`}>
                {['light', 'dark', 'system'].map((themeOption) => (
                    <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            theme === themeOption
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={`Switch to ${getThemeLabel(themeOption)} theme`}
                    >
                        {getThemeIcon(themeOption)}
                        {showLabel && <span className="ml-2">{getThemeLabel(themeOption)}</span>}
                    </button>
                ))}
            </div>
        );
    }

    // Menu variant
    if (variant === 'menu') {
        return (
            <div className={`flex items-center justify-between px-4 py-3 ${className}`}>
                <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-lg">
                    {[
                        { value: 'light', icon: getThemeIcon('light') },
                        { value: 'dark', icon: getThemeIcon('dark') },
                        { value: 'system', icon: getThemeIcon('system') },
                    ].map(({ value, icon }) => (
                        <button
                            key={value}
                            onClick={() => setTheme(value)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                                theme === value 
                                    ? 'bg-teal-600 text-white' 
                                    : 'text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-foreground'
                            }`}
                            title={`Switch to ${value} theme`}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Default button variant
    return (
        <button
            onClick={toggleTheme}
            className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-foreground ${
                size === 'small' ? 'h-8 px-2 text-xs' : 'h-10 px-3 text-sm'
            } ${className}`}
            title={`Current theme: ${getThemeLabel(theme)} (${effectiveTheme}). Click to cycle themes.`}
        >
            {getThemeIcon(theme)}
            {showLabel && (
                <span className={size === 'small' ? 'ml-1' : 'ml-2'}>
                    {getThemeLabel(theme)}
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;