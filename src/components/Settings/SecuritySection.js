import React from 'react';

const SecuritySection = ({ formData, onChange }) => {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Security Settings</h2>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">Change Password</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="current" className="block text-sm font-medium text-gray-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                id="current"
                                name="current"
                                value={formData.password.current}
                                onChange={onChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897b] focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="new" className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="new"
                                name="new"
                                value={formData.password.new}
                                onChange={onChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897b] focus:border-transparent"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Password must be at least 8 characters and include a number and special character
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirm"
                                name="confirm"
                                value={formData.password.confirm}
                                onChange={onChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897b] focus:border-transparent"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-3">Two-Factor Authentication</h3>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="enable2FA"
                            name="enable2FA"
                            className="h-4 w-4 text-[#00897b] focus:ring-[#00897b] border-gray-300 rounded"
                        />
                        <label htmlFor="enable2FA" className="ml-2 block text-sm text-gray-700">
                            Enable two-factor authentication
                        </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Secure your account with an additional layer of protection using an authenticator app
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-3">Session Management</h3>
                    <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00897b]"
                    >
                        Sign out from all other devices
                    </button>
                    <p className="mt-1 text-sm text-gray-500">
                        This will terminate all active sessions except your current one
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-3">Account Deletion</h3>
                    <button
                        type="button"
                        className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Delete my account
                    </button>
                    <p className="mt-1 text-sm text-gray-500">
                        This action is permanent and cannot be undone
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SecuritySection;