"use client"
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function SecuritySection({ userData }) {
    const { user, updatePassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(
        userData?.security?.twoFactorEnabled || false
    );

    const [sessionTimeout, setSessionTimeout] = useState(
        userData?.security?.sessionTimeout || 30
    );

    const [deviceHistory, setDeviceHistory] = useState(
        userData?.security?.deviceHistory || []
    );

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await updatePassword(currentPassword, newPassword);

            // Update the last password change timestamp
            await updateDoc(doc(db, 'users', user.uid), {
                'security.lastPasswordChange': new Date(),
                updatedAt: new Date()
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            toast.success('Password updated successfully');
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleSecuritySettingsUpdate = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                'security.twoFactorEnabled': twoFactorEnabled,
                'security.sessionTimeout': sessionTimeout,
                updatedAt: new Date()
            });

            toast.success('Security settings updated successfully');
        } catch (error) {
            console.error('Error updating security settings:', error);
            toast.error('Failed to update security settings');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveDevice = async (deviceId) => {
        if (!user) return;

        setLoading(true);
        try {
            const updatedDevices = deviceHistory.filter(device => device.id !== deviceId);
            setDeviceHistory(updatedDevices);

            await updateDoc(doc(db, 'users', user.uid), {
                'security.deviceHistory': updatedDevices,
                updatedAt: new Date()
            });

            toast.success('Device removed successfully');
        } catch (error) {
            console.error('Error removing device:', error);
            toast.error('Failed to remove device');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6">Password</h2>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Password
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Add an extra layer of security to your account
                            </p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input
                                type="checkbox"
                                id="toggle"
                                checked={twoFactorEnabled}
                                onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                className="sr-only"
                            />
                            <label
                                htmlFor="toggle"
                                className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${twoFactorEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Session Timeout</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Automatically log out after inactivity
                        </p>
                        <select
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={240}>4 hours</option>
                            <option value={480}>8 hours</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSecuritySettingsUpdate}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6">Device Management</h2>

                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Device</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Location</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Last Active</th>
                                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {deviceHistory.length > 0 ? (
                                deviceHistory.map((device) => (
                                    <tr key={device.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                                            <div className="flex items-center">
                                                <div className="font-medium">{device.deviceName}</div>
                                                <div className="ml-1">
                                                    {device.isCurrent && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400">{device.browser} on {device.os}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {device.location || 'Unknown'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {device.lastActive ? new Date(device.lastActive.seconds * 1000).toLocaleString() : 'Unknown'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                                            <button
                                                onClick={() => handleRemoveDevice(device.id)}
                                                disabled={device.isCurrent || loading}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No devices found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}