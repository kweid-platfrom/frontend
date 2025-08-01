// components/common/ThemeToggle.jsx
'use client';

import React from 'react';
import { useApp } from '@/context/AppProvider';

const ThemeToggle = ({ className = '', showLabel = false, variant = 'button' }) => {
    const { state: { theme }, actions: { theme: themeActions } } = useApp();

    const getThemeIcon = (selectedTheme) => {
        switch (selectedTheme) {
            case 'light':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                );
            case 'dark':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                );
            case 'system':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            default:
                return null;
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
                return 'Theme';
        }
    };

    if (variant === 'dropdown') {
        return (
            <div className={`relative ${className}`}>
                <select
                    value={theme.selectedTheme}
                    onChange={(e) => themeActions.setTheme(e.target.value)}
                    className="appearance-none bg-background border border-border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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

    if (variant === 'segmented') {
        return (
            <div className={`flex bg-muted rounded-lg p-1 ${className}`}>
                {['light', 'dark', 'system'].map((themeOption) => (
                    <button
                        key={themeOption}
                        onClick={() => themeActions.setTheme(themeOption)}
                        className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme.selectedTheme === themeOption
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                            }`}
                        title={`Switch to ${getThemeLabel(themeOption)} theme`}
                    >
                        {getThemeIcon(themeOption)}
                        {showLabel && <span className="ml-1">{getThemeLabel(themeOption)}</span>}
                    </button>
                ))}
            </div>
        );
    }

    if (variant === 'menu') {
        return (
            <div className={`flex items-center justify-between px-3 py-2 ${className}`}>
                <p className="text-xs font-medium text-muted-foreground">Theme:</p>
                <div className="flex items-center space-x-1 bg-muted p-1 rounded-md">
                    {[
                        { value: 'light', icon: getThemeIcon('light') },
                        { value: 'dark', icon: getThemeIcon('dark') },
                        { value: 'system', icon: getThemeIcon('system') },
                    ].map(({ value, icon }) => (
                        <button
                            key={value}
                            onClick={() => themeActions.setTheme(value)}
                            className={`p-1.5 rounded-md transition-colors ${
                                theme.selectedTheme === value 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            }`}
                            title={value.charAt(0).toUpperCase() + value.slice(1)}
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
            onClick={themeActions.toggleTheme}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${className}`}
            title={`Current theme: ${getThemeLabel(theme.selectedTheme)}. Click to cycle themes.`}
        >
            {getThemeIcon(theme.selectedTheme)}
            {showLabel && (
                <span className="ml-2">{getThemeLabel(theme.selectedTheme)}</span>
            )}
        </button>
    );
};

export default ThemeToggle;