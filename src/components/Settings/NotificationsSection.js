import React from 'react';

const NotificationsSection = ({ formData, onChange }) => {
    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <p className="text-gray-600 mb-4">
                Control how you receive notifications from the platform.
            </p>

            <div className="space-y-4">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="email"
                            name="email"
                            type="checkbox"
                            checked={formData.notifications.email}
                            onChange={onChange}
                            className="focus:ring-[#00897b] h-4 w-4 text-[#00897b] border-gray-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="email" className="font-medium text-gray-700">Email Notifications</label>
                        <p className="text-gray-500">Receive email updates about your activity, bug reports, and team mentions.</p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="push"
                            name="push"
                            type="checkbox"
                            checked={formData.notifications.push}
                            onChange={onChange}
                            className="focus:ring-[#00897b] h-4 w-4 text-[#00897b] border-gray-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="push" className="font-medium text-gray-700">Push Notifications</label>
                        <p className="text-gray-500">Receive push notifications in your browser for important updates.</p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="sms"
                            name="sms"
                            type="checkbox"
                            checked={formData.notifications.sms}
                            onChange={onChange}
                            className="focus:ring-[#00897b] h-4 w-4 text-[#00897b] border-gray-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="sms" className="font-medium text-gray-700">SMS Notifications</label>
                        <p className="text-gray-500">Receive text messages for critical alerts and security updates.</p>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Notification Frequency</h3>
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                        <input
                            id="notification-instant"
                            name="notificationFrequency"
                            type="radio"
                            value="instant"
                            defaultChecked
                            className="focus:ring-[#00897b] h-4 w-4 text-[#00897b] border-gray-300"
                        />
                        <label htmlFor="notification-instant" className="ml-3 text-sm font-medium text-gray-700">
                            Instant - Send notifications immediately
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="notification-daily"
                            name="notificationFrequency"
                            type="radio"
                            value="daily"
                            className="focus:ring-[#00897b] h-4 w-4 text-[#00897b] border-gray-300"
                        />
                        <label htmlFor="notification-daily" className="ml-3 text-sm font-medium text-gray-700">
                            Daily Digest - Summarize notifications once a day
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="notification-weekly"
                            name="notificationFrequency"
                            type="radio"
                            value="weekly"
                            className="focus:ring-[#00897b] h-4 w-4 text-[#00897b] border-gray-300"
                        />
                        <label htmlFor="notification-weekly" className="ml-3 text-sm font-medium text-gray-700">
                            Weekly Summary - Summarize notifications once a week
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsSection;