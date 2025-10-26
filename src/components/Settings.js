'use client'
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppProvider';
import ThemeToggle from '@/components/common/ThemeToggle';
import {
    CogIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon,
    KeyIcon,
    SparklesIcon,
    BoltIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';
import PaletteIcon from '@mui/icons-material/Palette';
import aiServiceInstance from '@/services/aiService';

// Password Update Component (unchanged)
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

// Theme Settings Component (unchanged)
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

// AI Settings Component - FIXED VERSION
const AISettingsSection = () => {
    const { actions } = useApp();
    const [showApiKey, setShowApiKey] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [currentModelInfo, setCurrentModelInfo] = useState(null);
    const [settings, setSettings] = useState({
        apiKey: '',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);

    // Load current AI configuration
    useEffect(() => {
        const loadAIConfig = async () => {
            try {
                const models = aiServiceInstance.getAvailableModels();
                const modelInfo = aiServiceInstance.getCurrentModelInfo();
                
                setAvailableModels(models);
                setCurrentModelInfo(modelInfo);
                setSettings(prev => ({
                    ...prev,
                    model: modelInfo.model,
                    temperature: aiServiceInstance.temperature
                }));

                // Test connection on load
                const health = await aiServiceInstance.testConnection();
                setConnectionStatus(health);
            } catch (error) {
                console.error('Failed to load AI config:', error);
            }
        };

        loadAIConfig();
    }, []);

    const getModelIcon = (modelId) => {
        if (modelId.includes('flash')) return BoltIcon;
        if (modelId.includes('pro')) return CpuChipIcon;
        return SparklesIcon;
    };

    const handleModelChange = async (modelId) => {
        setSettings(prev => ({ ...prev, model: modelId }));
        
        // Switch model in AI service
        const result = aiServiceInstance.switchModel(modelId);
        if (result.success) {
            const updatedInfo = aiServiceInstance.getCurrentModelInfo();
            setCurrentModelInfo(updatedInfo);
            
            actions.ui.showNotification?.({
                id: 'model-switched',
                type: 'success',
                message: `Switched to ${result.modelInfo.displayName}`,
                duration: 3000,
            });
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const result = await aiServiceInstance.testConnection();
            setConnectionStatus(result);
            
            actions.ui.showNotification?.({
                id: 'ai-test',
                type: result.success ? 'success' : 'error',
                message: result.success ? 'AI connection successful!' : 'AI connection failed',
                description: result.message,
                duration: 4000,
            });
        } catch (error) {
            actions.ui.showNotification?.({
                id: 'ai-test-error',
                type: 'error',
                message: 'Connection test failed',
                description: error.message,
                duration: 4000,
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update temperature
            const result = aiServiceInstance.updateConfig({
                model: settings.model,
                temperature: settings.temperature
            });

            if (result.success) {
                actions.ui.showNotification?.({
                    id: 'ai-settings-saved',
                    type: 'success',
                    message: 'AI settings saved successfully',
                    duration: 3000,
                });

                // Refresh current model info
                const updatedInfo = aiServiceInstance.getCurrentModelInfo();
                setCurrentModelInfo(updatedInfo);
            }
        } catch (error) {
            console.error('Failed to save AI settings:', error);
            actions.ui.showNotification?.({
                id: 'ai-settings-error',
                type: 'error',
                message: 'Failed to save settings',
                description: error.message,
                duration: 4000,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <SparklesIcon className="h-5 w-5 text-primary mr-2" />
                    <h3 className="text-lg font-semibold text-card-foreground">AI Assistant Settings</h3>
                </div>
                <div className="flex items-center space-x-2">
                    {connectionStatus?.success ? (
                        <>
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-600">Connected</span>
                        </>
                    ) : connectionStatus === null ? (
                        <>
                            <CogIcon className="h-5 w-5 text-gray-400 animate-spin" />
                            <span className="text-sm text-muted-foreground">Checking...</span>
                        </>
                    ) : (
                        <>
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm text-yellow-600">Not Connected</span>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* API Key Configuration */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start">
                        <KeyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                API Key Configuration
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                Your Gemini API key is configured in environment variables. 
                                Status: <strong>{currentModelInfo?.apiKeyConfigured ? 'Configured ✓' : 'Not Set ✗'}</strong>
                            </p>
                            {!currentModelInfo?.apiKeyConfigured && (
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Add NEXT_PUBLIC_GEMINI_API_KEY to your .env file and restart the server.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Model Selection */}
                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-3">
                        Select Gemini Model
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableModels.map((model) => {
                            const IconComponent = getModelIcon(model.id);
                            const isActive = model.id === settings.model;
                            
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => handleModelChange(model.id)}
                                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                        isActive
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center">
                                            <IconComponent className={`h-5 w-5 mr-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div>
                                                <p className="font-medium text-sm text-card-foreground">
                                                    {model.name}
                                                </p>
                                                {model.recommended && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {model.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            Cost: <strong className="text-card-foreground">${model.costPer1kTokens}/1K tokens</strong>
                                        </span>
                                        <span className="text-muted-foreground">
                                            Max: <strong className="text-card-foreground">{model.maxTokens}</strong>
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Current Model Info */}
                {currentModelInfo && (
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium text-card-foreground mb-2">Active Model</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-muted-foreground">Model:</span>
                                <p className="font-medium text-card-foreground">{currentModelInfo.displayName}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Status:</span>
                                <p className={`font-medium ${currentModelInfo.isHealthy ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {currentModelInfo.isHealthy ? 'Healthy' : 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Last Check:</span>
                                <p className="font-medium text-card-foreground">
                                    {currentModelInfo.lastHealthCheck 
                                        ? new Date(currentModelInfo.lastHealthCheck).toLocaleTimeString()
                                        : 'Never'}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Max Tokens:</span>
                                <p className="font-medium text-card-foreground">{currentModelInfo.maxTokens}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Temperature Control */}
                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                        Creativity Level (Temperature): <strong>{settings.temperature}</strong>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0.0 - Focused & Deterministic</span>
                        <span>1.0 - Creative & Varied</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {settings.temperature < 0.3 && "Very focused - Best for test cases requiring consistency"}
                        {settings.temperature >= 0.3 && settings.temperature < 0.7 && "Balanced - Good for most QA tasks"}
                        {settings.temperature >= 0.7 && "More creative - Better for brainstorming and exploration"}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                    <button
                        onClick={handleTestConnection}
                        disabled={testing || !currentModelInfo?.apiKeyConfigured}
                        className="flex items-center px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <CogIcon className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !currentModelInfo?.apiKeyConfigured}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Settings Component
const Settings = () => {
    return (
        <div className="space-y-6">
            <PasswordSection />
            <ThemeSection />
            <AISettingsSection />
        </div>
    );
};

export default Settings;