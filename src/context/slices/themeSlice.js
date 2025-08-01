// slices/themeSlice.js
'use client';

import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'assura-theme';
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

const getSystemTheme = () => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
};

const getStoredTheme = () => {
    if (typeof window === 'undefined') return THEMES.SYSTEM;
    try {
        return localStorage.getItem(THEME_KEY) || THEMES.SYSTEM;
    } catch {
        return THEMES.SYSTEM;
    }
};

const applyTheme = (theme) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const body = document.body;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Determine actual theme to apply
    const actualTheme = theme === THEMES.SYSTEM ? getSystemTheme() : theme;
    
    // Apply theme classes
    root.classList.add(actualTheme);
    body.classList.add(actualTheme);
    
    // Update data attribute for CSS custom properties
    root.setAttribute('data-theme', actualTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', actualTheme === THEMES.DARK ? '#1f2937' : '#f9fafb');
    } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = actualTheme === THEMES.DARK ? '#1f2937' : '#f9fafb';
        document.getElementsByTagName('head')[0].appendChild(meta);
    }
};

export const useTheme = () => {
    const [selectedTheme, setSelectedTheme] = useState(THEMES.SYSTEM);
    const [actualTheme, setActualTheme] = useState(THEMES.LIGHT);
    const [isLoading, setIsLoading] = useState(true);
    const [systemTheme, setSystemTheme] = useState(THEMES.LIGHT);

    // Initialize theme on mount
    useEffect(() => {
        const storedTheme = getStoredTheme();
        const currentSystemTheme = getSystemTheme();
        
        setSelectedTheme(storedTheme);
        setSystemTheme(currentSystemTheme);
        
        const resolvedTheme = storedTheme === THEMES.SYSTEM ? currentSystemTheme : storedTheme;
        setActualTheme(resolvedTheme);
        
        // Apply theme immediately to prevent flash
        applyTheme(storedTheme);
        
        setIsLoading(false);
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e) => {
            const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
            setSystemTheme(newSystemTheme);
            
            // If current theme is system, update actual theme
            if (selectedTheme === THEMES.SYSTEM) {
                setActualTheme(newSystemTheme);
                applyTheme(THEMES.SYSTEM);
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, [selectedTheme]);

    // Apply theme when it changes
    useEffect(() => {
        if (!isLoading) {
            applyTheme(selectedTheme);
        }
    }, [selectedTheme, isLoading]);

    const setTheme = useCallback((theme) => {
        if (!Object.values(THEMES).includes(theme)) {
            console.warn(`Invalid theme: ${theme}. Valid themes are:`, Object.values(THEMES));
            return;
        }

        setSelectedTheme(theme);
        
        // Update actual theme
        const resolvedTheme = theme === THEMES.SYSTEM ? systemTheme : theme;
        setActualTheme(resolvedTheme);
        
        // Store in localStorage
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.warn('Failed to store theme preference:', error);
        }
    }, [systemTheme]);

    const toggleTheme = useCallback(() => {
        const themeOrder = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM];
        const currentIndex = themeOrder.indexOf(selectedTheme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        setTheme(themeOrder[nextIndex]);
    }, [selectedTheme, setTheme]);

    const isDark = actualTheme === THEMES.DARK;
    const isLight = actualTheme === THEMES.LIGHT;
    const isSystem = selectedTheme === THEMES.SYSTEM;

    const state = {
        selectedTheme,
        actualTheme,
        systemTheme,
        isDark,
        isLight,
        isSystem,
        isLoading,
        themes: THEMES,
    };

    const actions = {
        setTheme,
        toggleTheme,
        setLight: () => setTheme(THEMES.LIGHT),
        setDark: () => setTheme(THEMES.DARK),
        setSystem: () => setTheme(THEMES.SYSTEM),
    };

    return { state, actions };
};