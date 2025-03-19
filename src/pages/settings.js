"use client"
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Settings/Sidebar';
import ProfileSection from '@/components/ProfileSection';
import NotificationsSection from '@/components/Settings/NotificationsSection';
import ThemeSection from '@/components/Settings/ThemeSection';
import SecuritySection from '@/components/Settings/SecuritySection';
import OrganizationSection from '../components/Settings/OrganizationSection';
import LoadingSpinner from '@/components/Settings/LoadingSpinner';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthProvider'; 

const SettingsPage = () => {
    const organizationContext = useOrganization() || {};
    const { 
        organizationUsers = [], 
        handleUserPermissionChange = () => {}, 
        isLoading: orgLoading = false 
    } = organizationContext;
    
    const authContext = useAuth() || {};
    const { user: authUser } = authContext;
    
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
    const [activeSection, setActiveSection] = useState('profile');

    useEffect(() => {
        console.log('Auth User:', authUser); // Debugging
    
        const fetchUserData = async () => {
            try {
                if (!authUser) return; // Prevents unnecessary API calls
                
                const response = await fetch('/api/user');
                if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);
                
                const userData = await response.json();
                console.log('Fetched User Data:', userData); // Debugging
    
                if (!userData || !userData.name) throw new Error('User data structure is incorrect');
                
                setUser(userData);
                setFormData(prevData => ({
                    ...prevData,
                    name: userData.name || '',
                    email: userData.email || '',
                    bio: userData.bio || '',
                    companyName: userData.companyName || '',
                    role: userData.role || '',
                }));
            } catch (error) {
                console.error('Error fetching user data:', error);
                setMessage({ type: 'error', text: 'Failed to load user data. Please refresh the page.' });
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserData();
    }, [authUser]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUser(prev => ({
                ...prev,
                ...formData
            }));
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const handleAvatarUpload = (e) => {
        console.log("Avatar upload triggered", e.target.files[0]);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <p className="text-red-500">Failed to load user data. Please refresh the page.</p>
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
                    <Sidebar 
                        user={user} 
                        activeSection={activeSection}
                        onSectionChange={handleSectionChange}
                        onAvatarUpload={handleAvatarUpload}
                    />
                    <div className="md:w-3/4 p-6">
                        <form onSubmit={handleSubmit}>
                            {activeSection === 'profile' && <ProfileSection formData={formData} onChange={handleChange} />}
                            {activeSection === 'notifications' && <NotificationsSection formData={formData} onChange={handleNotificationChange} />}
                            {activeSection === 'theme' && <ThemeSection theme={formData.theme} onThemeChange={handleThemeChange} />}
                            {activeSection === 'security' && <SecuritySection formData={formData} onChange={handlePasswordChange} />}
                            {activeSection === 'organization' && (
                                orgLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    <OrganizationSection 
                                        formData={formData}
                                        onChange={handleChange}
                                        users={organizationUsers}
                                        onPermissionChange={handleUserPermissionChange}
                                        currentUserId={user?.id || '1'}
                                    />
                                )
                            )}
                            <div className="border-t pt-6 mt-6">
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center px-4 py-2 bg-[#00897b] text-white font-medium rounded hover:bg-[#00796B] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50">
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
