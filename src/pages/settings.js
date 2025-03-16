/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
    Save,
    Moon,
    Sun,
    Bell,
    Mail,
    MessageSquare,
    Shield,
    User,
    UploadCloud
} from 'lucide-react';
import Image from 'next/image';

const SettingsPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        notifications: {
            email: true,
            push: true,
            sms: false
        },
        theme: 'light'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Simulate fetching user data
        const fetchUser = async () => {
            try {
                // This would be replaced with an actual API call
                const response = await new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            id: 'user123',
                            name: 'Jane Doe',
                            email: 'jane.doe@example.com',
                            bio: 'Product manager with 5+ years of experience',
                            avatarUrl: '/api/placeholder/150/150',
                            notifications: {
                                email: true,
                                push: true,
                                sms: false
                            },
                            theme: 'light'
                        });
                    }, 1000);
                });

                setUser(response);
                setFormData({
                    name: response.name,
                    email: response.email,
                    bio: response.bio,
                    notifications: response.notifications,
                    theme: response.theme
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNotificationChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [name]: checked
            }
        }));
    };

    const handleThemeChange = (theme) => {
        setFormData(prev => ({
            ...prev,
            theme
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update user state with form data
            setUser(prev => ({
                ...prev,
                ...formData
            }));

            setMessage({ type: 'success', text: 'Settings updated successfully!' });

            // Clear message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (_error) {
            setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAvatarUpload = (e) => {
        // This would normally handle file upload
        console.log("Avatar upload triggered", e.target.files[0]);
        // For demo purposes just log the file
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00897B]"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

            {message && (
                <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="md:flex">
                    {/* Sidebar */}
                    <div className="md:w-1/4 bg-gray-50 p-6 border-r">
                        <div className="relative w-32 h-32">
                            <Image
                                src={user.avatarUrl}
                                alt="Profile"
                                fill
                                className="rounded-full object-cover border-4 border-white shadow"
                                sizes="(max-width: 768px) 100vw, 128px"
                            />
                            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-[#00897B] text-white p-2 rounded-full cursor-pointer shadow-md z-10">
                                <UploadCloud size={16} />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </label>
                        </div>
                        <nav>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#profile" className="flex items-center p-2 rounded hover:bg-gray-200 text-[#00897B] font-medium">
                                        <User size={18} className="mr-2" />
                                        Profile
                                    </a>
                                </li>
                                <li>
                                    <a href="#notifications" className="flex items-center p-2 rounded hover:bg-gray-200">
                                        <Bell size={18} className="mr-2" />
                                        Notifications
                                    </a>
                                </li>
                                <li>
                                    <a href="#security" className="flex items-center p-2 rounded hover:bg-gray-200">
                                        <Shield size={18} className="mr-2" />
                                        Security
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* Main content */}
                    <div className="md:w-3/4 p-6">
                        <form onSubmit={handleSubmit}>
                            <section id="profile" className="mb-8">
                                <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 bg-blue-50 rounded focus:outline-none focus:ring-[#00897B]"
                                            required disabled
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 bg-blue-50 rounded focus:outline-none  focus:ring-[#00897B]"
                                            required disabled
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                            Bio
                                        </label>
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows="4"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-[#00897B]"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section id="notifications" className="mb-8">
                                <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="email-notifications"
                                            name="email"
                                            checked={formData.notifications.email}
                                            onChange={handleNotificationChange}
                                            className="h-4 w-4 text-[#00897B] focus:ring-[#00897B] border-gray-300 rounded"
                                        />
                                        <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-700">
                                            <div className="flex items-center">
                                                <Mail size={16} className="mr-2" />
                                                Email Notifications
                                            </div>
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="push-notifications"
                                            name="push"
                                            checked={formData.notifications.push}
                                            onChange={handleNotificationChange}
                                            className="h-4 w-4 text-[#00897B] focus:ring-[#00897B] border-[#00897B] rounded"
                                        />
                                        <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-700">
                                            <div className="flex items-center">
                                                <Bell size={16} className="mr-2" />
                                                Push Notifications
                                            </div>
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="sms-notifications"
                                            name="sms"
                                            checked={formData.notifications.sms}
                                            onChange={handleNotificationChange}
                                            className="h-4 w-4 text-[#00897B] focus:ring-[#00897B] border-gray-300 rounded"
                                        />
                                        <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-700">
                                            <div className="flex items-center">
                                                <MessageSquare size={16} className="mr-2" />
                                                SMS Notifications
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <section id="theme" className="mb-8">
                                <h3 className="text-lg font-medium mb-4">Theme</h3>
                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => handleThemeChange('light')}
                                        className={`p-4 border rounded-md flex flex-col items-center ${formData.theme === 'light'
                                                ? 'border-[#00897B] bg-blue-50'
                                                : 'border-gray-300'
                                            }`}
                                    >
                                        <Sun size={24} className="mb-2" />
                                        <span>Light</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleThemeChange('dark')}
                                        className={`p-4 border rounded-md flex flex-col items-center ${formData.theme === 'dark'
                                                ? 'border-[#00897B] bg-blue-50'
                                                : 'border-gray-300'
                                            }`}
                                    >
                                        <Moon size={24} className="mb-2" />
                                        <span>Dark</span>
                                    </button>
                                </div>
                            </section>

                            <div className="border-t pt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center px-4 py-2 bg-[#00897B] text-white font-medium rounded hover:bg-[#00897B] focus:outline-none  focus:ring-[#00897B] focus:ring-offset-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    ) : (
                                        <Save size={18} className="mr-2" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;