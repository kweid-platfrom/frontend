'use client'
import React, { useState } from 'react';
import { useApp } from '@/context/AppProvider';
import ThemeToggle from '@/components/common/ThemeToggle';
import {
    CogIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon,
    KeyIcon
} from '@heroicons/react/24/outline';
import PaletteIcon from '@mui/icons-material/Palette';

// Password Update Component
const PasswordSection = () => {
    const { actions } = useApp();
    const [isChanging, setIsChanging] = useState(false);
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [saving, setSaving] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwords.new !== passwords.confirm) {
            actions.ui.showNotification?.({
                id: 'password-mismatch',
                type: 'error',
                message: 'New passwords do not match',
                duration: 3000,
            });
            return;
        }

        if (passwords.new.length < 6) {
            actions.ui.showNotification?.({
                id: 'password-too-short',
                type: 'error',
                message: 'Password must be at least 6 characters long',
                duration: 3000,
            });
            return;
        }

        setSaving(true);
        try {
            const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
            const { auth } = await import('@/config/firebase');
            
            const user = auth.currentUser;
            if (!user || !user.email) {
                throw new Error('No authenticated user found');
            }

            const credential = EmailAuthProvider.credential(user.email, passwords.current);
            await reauthenticateWithCredential(user, credential);
            
            await updatePassword(user, passwords.new);
            
            actions.ui.showNotification?.({
                id: 'password-updated',
                type: 'success',
                message: 'Password updated successfully',
                duration: 3000,
            });
            setPasswords({ current: '', new: '', confirm: '' });
            setIsChanging(false);
        } catch (error) {
            console.error('Password update error:', error);
            
            let errorMessage = 'Failed to update password';
            let errorDescription = error.message;
            
            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Current password is incorrect';
                    errorDescription = 'Please enter your current password correctly';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
                    errorDescription = 'Please choose a stronger password';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'Please log in again';
                    errorDescription = 'For security, please log out and log back in before changing your password';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many attempts';
                    errorDescription = 'Please wait a few minutes before trying again';
                    break;
                default:
                    if (error.message.includes('auth/wrong-password') || error.message.includes('incorrect')) {
                        errorMessage = 'Current password is incorrect';
                        errorDescription = 'Please verify your current password and try again';
                    }
                    break;
            }
            
            actions.ui.showNotification?.({
                id: 'password-update-error',
                type: 'error',
                message: errorMessage,
                description: errorDescription,
                duration: 5000,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setPasswords({ current: '', new: '', confirm: '' });
        setIsChanging(false);
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <KeyIcon className="h-5 w-5 text-primary mr-2" />
                    <h3 className="text-lg font-semibold text-card-foreground">Password</h3>
                </div>
                {!isChanging && (
                    <button
                        onClick={() => setIsChanging(true)}
                        className="flex items-center px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors"
                    >
                        <KeyIcon className="h-4 w-4 mr-1" />
                        Change Password
                    </button>
                )}
            </div>

            {!isChanging ? (
                <div>
                    <p className="px-3 py-2 bg-muted rounded-md text-card-foreground">
                        ••••••••••••
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Last updated: Never
                    </p>
                </div>
            ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwords.current}
                                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                                className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter current password"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords.current ? (
                                    <EyeSlashIcon className="h-4 w-4" />
                                ) : (
                                    <EyeIcon className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwords.new}
                                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                                className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                required
                                minLength="6"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords.new ? (
                                    <EyeSlashIcon className="h-4 w-4" />
                                ) : (
                                    <EyeIcon className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwords.confirm}
                                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                                className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                required
                                minLength="6"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords.confirm ? (
                                    <EyeSlashIcon className="h-4 w-4" />
                                ) : (
                                    <EyeIcon className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

// Theme Settings Component
const ThemeSection = () => {
    const { state: { theme } } = useApp();

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center mb-6">
                <PaletteIcon className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-card-foreground">Theme Preferences</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-3">
                        Choose your preferred theme
                    </label>
                    <ThemeToggle variant="segmented" showLabel={true} className="w-full" />
                </div>

                <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-card-foreground">Current Theme</p>
                            <p className="text-xs text-muted-foreground">
                                {theme.selectedTheme === 'system' ? 
                                    `System (${theme.systemTheme})` : 
                                    theme.selectedTheme.charAt(0).toUpperCase() + theme.selectedTheme.slice(1)
                                }
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${theme.isDark ? 'bg-gray-800' : 'bg-white'} border-2 border-border`}></div>
                            <span className="text-xs text-muted-foreground">
                                {theme.isDark ? 'Dark mode active' : 'Light mode active'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// AI Settings Component  
const AISettingsSection = () => {
    const { state, actions, aiAvailable } = useApp();
    const [showApiKey, setShowApiKey] = useState(false);
    const [settings, setSettings] = useState({
        provider: state.ai.settings?.provider || 'openai',
        apiKey: '',
        model: state.ai.settings?.model || 'gpt-3.5-turbo',
        temperature: state.ai.settings?.temperature || 0.7,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await actions.ai.updateAISettings(settings);
        } catch (error) {
            console.error('Failed to update AI settings:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <CogIcon className="h-5 w-5 text-primary mr-2" />
                    <h3 className="text-lg font-semibold text-card-foreground">AI Assistant Settings</h3>
                </div>
                <div className="flex items-center">
                    {aiAvailable ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="ml-2 text-sm text-muted-foreground">
                        {aiAvailable ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                        AI Provider
                    </label>
                    <select
                        value={settings.provider}
                        onChange={(e) => setSettings(prev => ({ ...prev, provider: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="gemini">Google Gemini</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                        API Key
                    </label>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={settings.apiKey}
                                onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                placeholder="Enter your API key"
                                autoComplete="off"
                                className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showApiKey ? (
                                    <EyeSlashIcon className="h-4 w-4" />
                                ) : (
                                    <EyeIcon className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                        Model
                    </label>
                    <input
                        type="text"
                        value={settings.model}
                        onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                        Temperature: {settings.temperature}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Focused</span>
                        <span>Creative</span>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save AI Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Settings Component that exports all sections
const Settings = () => {
    return (
        <>
            <PasswordSection />
            <ThemeSection />
            <AISettingsSection />
        </>
    );
};

export default Settings;