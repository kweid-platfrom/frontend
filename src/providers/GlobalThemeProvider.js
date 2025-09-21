'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const GlobalThemeContext = createContext();

export const GlobalThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const [systemTheme, setSystemTheme] = useState('light');
    const [isInitialized, setIsInitialized] = useState(false);

    // Function to apply theme to document
    const applyThemeToDocument = useCallback((effectiveTheme) => {
        const htmlElement = document.documentElement;
        
        if (effectiveTheme === 'dark') {
            htmlElement.classList.add('dark');
            htmlElement.setAttribute('data-theme', 'dark');
        } else {
            htmlElement.classList.remove('dark');
            htmlElement.setAttribute('data-theme', 'light');
        }
    }, []);

    // Initialize theme on mount
    useEffect(() => {
        const initializeTheme = () => {
            // Get saved theme or default to 'light'
            const savedTheme = localStorage.getItem('theme') || 'light';
            
            // Get system preference
            const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            
            // Set states
            setTheme(savedTheme);
            setSystemTheme(systemPreference);
            
            // Apply theme immediately
            const effectiveTheme = savedTheme === 'system' ? systemPreference : savedTheme;
            applyThemeToDocument(effectiveTheme);
            
            setIsInitialized(true);
        };

        initializeTheme();
    }, [applyThemeToDocument]); // Add applyThemeToDocument to dependency array

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            setSystemTheme(newSystemTheme);
            
            // If current theme is 'system', apply the new system theme
            if (theme === 'system') {
                applyThemeToDocument(newSystemTheme);
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, [theme, applyThemeToDocument]); // Add applyThemeToDocument to dependency array

    // Apply theme when theme state changes
    useEffect(() => {
        if (!isInitialized) return;
        
        const effectiveTheme = theme === 'system' ? systemTheme : theme;
        applyThemeToDocument(effectiveTheme);
        localStorage.setItem('theme', theme);
    }, [theme, systemTheme, isInitialized, applyThemeToDocument]); // Add applyThemeToDocument to dependency array

    // Theme setters
    const updateTheme = useCallback((newTheme) => {
        setTheme(newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        const themeOrder = ['light', 'dark', 'system'];
        const currentIndex = themeOrder.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        updateTheme(themeOrder[nextIndex]);
    }, [theme, updateTheme]);

    // Calculate effective theme
    const effectiveTheme = theme === 'system' ? systemTheme : theme;

    const value = {
        theme,
        systemTheme,
        effectiveTheme,
        isInitialized,
        setTheme: updateTheme,
        toggleTheme,
    };

    return (
        <GlobalThemeContext.Provider value={value}>
            {children}
        </GlobalThemeContext.Provider>
    );
};

export const useGlobalTheme = () => {
    const context = useContext(GlobalThemeContext);
    if (!context) {
        throw new Error('useGlobalTheme must be used within a GlobalThemeProvider');
    }
    return context;
};