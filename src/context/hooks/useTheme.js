import { useCallback } from 'react';

export const useTheme = (themeSlice, uiSlice) => {
    const setTheme = useCallback(
        (newTheme) => {
            try {
                themeSlice.actions.setTheme(newTheme);
                if (uiSlice.actions.showNotification) {
                    const themeNames = { light: 'Light', dark: 'Dark', system: 'System' };
                    uiSlice.actions.showNotification({
                        id: 'theme-changed',
                        type: 'success',
                        message: `Theme changed to ${themeNames[newTheme] || newTheme}`,
                        duration: 2000,
                    });
                }
            } catch (error) {
                console.error('Failed to set theme:', error);
                uiSlice.actions.showNotification?.({
                    id: 'theme-change-error',
                    type: 'error',
                    message: 'Failed to change theme',
                    description: error.message,
                    duration: 3000,
                });
            }
        },
        [themeSlice.actions, uiSlice.actions]
    );

    const toggleTheme = useCallback(() => {
        try {
            themeSlice.actions.toggleTheme();
        } catch (error) {
            console.error('Failed to toggle theme:', error);
            uiSlice.actions.showNotification?.({
                id: 'theme-toggle-error',
                type: 'error',
                message: 'Failed to toggle theme',
                description: error.message,
                duration: 3000,
            });
        }
    }, [themeSlice.actions, uiSlice.actions]);

    return { setTheme, toggleTheme };
};