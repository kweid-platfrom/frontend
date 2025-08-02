import { useCallback, useState } from 'react';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((notification) => {
        setNotifications((prev) => [
            ...prev,
            {
                id: notification.id || `notif-${Date.now()}`,
                type: notification.type || 'info',
                message: notification.message,
                error: notification.error,
                duration: notification.duration,
            },
        ]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, []);

    return {
        state: { notifications },
        actions: { showNotification, removeNotification },
    };
};