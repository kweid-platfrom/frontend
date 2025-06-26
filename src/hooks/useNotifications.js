// hooks/useNotifications.js
import { useState } from 'react';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        projectUpdates: true,
        bugAlerts: true,
        weeklyReports: false,
        marketingEmails: false
    });

    const updateNotification = (key, value) => {
        setNotifications(prev => ({ ...prev, [key]: value }));
    };

    const saveNotifications = () => {
        console.log('Saving notifications:', notifications);
        // API call would go here
    };

    return {
        notifications,
        updateNotification,
        saveNotifications
    };
};