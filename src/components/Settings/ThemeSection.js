// components/settings/ThemeSection.jsx
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthProvider';
import { toast } from 'react-hot-toast';

export default function ThemeSection({ userData }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [primaryColor, setPrimaryColor] = useState(userData?.theme?.primaryColor || '#3B82F6');
    const [mode, setMode] = useState(userData?.theme?.mode || 'system');

    const colorOptions = [
        { label: 'Blue', value: '#3B82F6' },
        { label: 'Indigo', value: '#6366F1' },
        { label: 'Purple', value: '#8B5CF6' },
        { label: 'Rose', value: '#F43F5E' },
        { label: 'Emerald', value: '#10B981' },
        { label: 'Amber', value: '#F59E0B' },
    ];

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                'theme.primaryColor': primaryColor,
                'theme.mode': mode,
                updatedAt: new Date()
            });

            toast.success('Theme settings updated successfully');
        } catch (error) {
            console.error('Error updating theme settings:', error);
            toast.error('Failed to update theme settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Theme Settings</h2>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">Color Scheme</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {colorOptions.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => setPrimaryColor(color.value)}
                                className={`h-14 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${primaryColor === color.value
                                        ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400'
                                        : 'hover:opacity-80'
                                    }`}
                                style={{ backgroundColor: color.value }}
                            >
                                <span className="text-white text-xs font-medium">{color.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-3">Theme Mode</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                            onClick={() => setMode('light')}
                            className={`p-4 rounded-lg border transition-all ${mode === 'light'
                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-yellow-400" />
                                <span className="font-medium">Light</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('dark')}
                            className={`p-4 rounded-lg border transition-all ${mode === 'dark'
                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-gray-400" />
                                <span className="font-medium">Dark</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('system')}
                            className={`p-4 rounded-lg border transition-all ${mode === 'system'
                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-gray-900 dark:from-yellow-300 dark:to-gray-400" />
                                <span className="font-medium">System</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}