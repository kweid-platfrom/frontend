// components/userProfile/tabs/NotificationsTab.js
'use client'
import { useState } from 'react';
import {
    BellIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    StarIcon
} from '@heroicons/react/24/outline';

const NotificationsTab = () => {
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        projectUpdates: true,
        bugAlerts: true,
        weeklyReports: false,
        marketingEmails: false
    });

    const notificationConfig = {
        emailNotifications: {
            title: 'Email Notifications',
            description: 'Receive notifications via email',
            icon: EnvelopeIcon
        },
        pushNotifications: {
            title: 'Push Notifications',
            description: 'Receive push notifications in browser',
            icon: BellIcon
        },
        projectUpdates: {
            title: 'Project Updates',
            description: 'Get notified about project changes',
            icon: ExclamationTriangleIcon
        },
        bugAlerts: {
            title: 'Bug Alerts',
            description: 'Receive alerts for new bugs',
            icon: ExclamationTriangleIcon
        },
        weeklyReports: {
            title: 'Weekly Reports',
            description: 'Get weekly summary reports',
            icon: CalendarIcon
        },
        marketingEmails: {
            title: 'Marketing Emails',
            description: 'Receive product updates and tips',
            icon: StarIcon
        }
    };

    const handleNotificationChange = (key, value) => {
        setNotifications(prev => ({ ...prev, [key]: value }));
    };

    const saveNotificationPreferences = () => {
        console.log('Saving notification preferences:', notifications);
        // Here you would typically call an API to save the preferences
    };

    const NotificationToggle = ({ configKey, isEnabled }) => {
        const config = notificationConfig[configKey];
        const IconComponent = config.icon;

        return (
            <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                        <IconComponent className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{config.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleNotificationChange(configKey, e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Notification Preferences</h2>
            <p className="text-sm text-gray-600 mb-6">Manage how you receive notifications</p>

            <div className="space-y-6">
                {Object.entries(notifications).map(([key, value]) => (
                    <NotificationToggle
                        key={key}
                        configKey={key}
                        isEnabled={value}
                    />
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <button 
                    onClick={saveNotificationPreferences}
                    className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Save Notification Preferences
                </button>
            </div>
        </div>
    );
};

export default NotificationsTab;