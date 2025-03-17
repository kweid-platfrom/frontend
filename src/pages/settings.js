/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Settings/Sidebar';
import ProfileSection from '@/components/ProfileSection';
import NotificationsSection from '@/components/Settings/NotificationsSection';
import ThemeSection from '@/components/Settings/ThemeSection';
import SecuritySection from '@/components/Settings/SecuritySection';
import OrganizationSection from '@/components/Settings/OrganizationSection';
import LoadingSpinner from '@/components/Settings/LoadingSpinner';

const SettingsPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        companyName: '',
        role: '',
        notifications: {
            email: true,
            push: true,
            sms: false
        },
        theme: 'light',
        password: {
            current: '',
            new: '',
            confirm: ''
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [organizationUsers, setOrganizationUsers] = useState([]);
    const [activeSection, setActiveSection] = useState('profile');

    useEffect(() => {
        // Simulate fetching user data
        const fetchUserData = async () => {
            try {
                // This would be replaced with an actual API call
                const response = await new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            id: 'user123',
                            name: 'Jane Doe',
                            email: 'jane.doe@example.com',
                            bio: 'Product manager with 5+ years of experience',
                            avatarUrl: null, // No avatar initially
                            companyName: 'TechCorp Solutions',
                            role: 'Admin',
                            notifications: {
                                email: true,
                                push: true,
                                sms: false
                            },
                            theme: 'light'
                        });
                    }, 500);
                });

                // Simulate fetching organization users
                const orgUsers = await new Promise(resolve => {
                    setTimeout(() => {
                        resolve([
                            { 
                                id: 'user123', 
                                name: 'Jane Doe', 
                                email: 'jane.doe@example.com', 
                                status: 'accepted', 
                                role: 'Admin',
                                permissions: {
                                    deleteBugs: true,
                                    imports: true,
                                    createBugs: true,
                                    createBugReports: true,
                                    generateReports: true
                                }
                            },
                            { 
                                id: 'user456', 
                                name: 'John Smith', 
                                email: 'john.smith@example.com', 
                                status: 'accepted', 
                                role: 'Developer',
                                permissions: {
                                    deleteBugs: false,
                                    imports: true,
                                    createBugs: true,
                                    createBugReports: true,
                                    generateReports: false
                                }
                            },
                            { 
                                id: 'user789', 
                                name: 'Sarah Johnson', 
                                email: 'sarah.johnson@example.com', 
                                status: 'pending', 
                                role: 'Developer',
                                permissions: {}
                            }
                        ]);
                    }, 700);
                });

                setUser(response);
                setFormData({
                    name: response.name,
                    email: response.email,
                    bio: response.bio,
                    companyName: response.companyName,
                    role: response.role,
                    notifications: response.notifications,
                    theme: response.theme,
                    password: {
                        current: '',
                        new: '',
                        confirm: ''
                    }
                });
                setOrganizationUsers(orgUsers);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            password: {
                ...prev.password,
                [name]: value
            }
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

    const handleUserPermissionChange = (userId, permission, checked) => {
        setOrganizationUsers(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { 
                        ...user, 
                        permissions: { 
                            ...user.permissions, 
                            [permission]: checked 
                        } 
                    } 
                    : user
            )
        );
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

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const handleAvatarUpload = (e) => {
        // This would normally handle file upload
        console.log("Avatar upload triggered", e.target.files[0]);
        // For demo purposes just log the file
    };

    if (loading) {
        return <LoadingSpinner />;
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
                    <Sidebar 
                        user={user} 
                        activeSection={activeSection}
                        onSectionChange={handleSectionChange}
                        onAvatarUpload={handleAvatarUpload}
                    />

                    {/* Main content */}
                    <div className="md:w-3/4 p-6">
                        <form onSubmit={handleSubmit}>
                            {activeSection === 'profile' && (
                                <ProfileSection 
                                    formData={formData} 
                                    onChange={handleChange} 
                                />
                            )}
                            
                            {activeSection === 'notifications' && (
                                <NotificationsSection 
                                    formData={formData} 
                                    onChange={handleNotificationChange} 
                                />
                            )}
                            
                            {activeSection === 'theme' && (
                                <ThemeSection 
                                    theme={formData.theme} 
                                    onThemeChange={handleThemeChange} 
                                />
                            )}
                            
                            {activeSection === 'security' && (
                                <SecuritySection 
                                    formData={formData} 
                                    onChange={handlePasswordChange} 
                                />
                            )}
                            
                            {activeSection === 'organization' && (
                                <OrganizationSection 
                                    formData={formData}
                                    onChange={handleChange}
                                    users={organizationUsers}
                                    onPermissionChange={handleUserPermissionChange}
                                    currentUserId={user.id}
                                />
                            )}

                            <div className="border-t pt-6 mt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center px-4 py-2 bg-[#00897b] text-white font-medium rounded hover:bg-[#00796B] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
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