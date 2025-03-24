// components/settings/ProfileSection.tsx
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/common/Avatar';

export default function ProfileSection({ userData }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        phone: userData?.phone || '',
        location: userData?.location || '',
        jobRole: userData?.jobRole || '',
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(userData?.avatarUrl || '');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError('');

        try {
            let avatarUrl = userData?.avatarUrl || '';

            // Upload new avatar if selected
            if (avatarFile) {
                const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${avatarFile.name}`);
                await uploadBytes(storageRef, avatarFile);
                avatarUrl = await getDownloadURL(storageRef);
            }

            // Update user document
            await updateDoc(doc(db, 'users', user.uid), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                location: formData.location,
                jobRole: formData.jobRole,
                avatarUrl,
                updatedAt: new Date()
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Profile Information</h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">Profile Photo</label>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar
                                src={avatarPreview}
                                alt={`${formData.firstName} ${formData.lastName}`}
                                size="lg"
                                className="ring-4 ring-gray-100 dark:ring-gray-700"
                            />
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 bg-gray-800 dark:bg-gray-700 text-white p-2 rounded-full shadow-md hover:bg-gray-700 transition"
                                onClick={() => document.getElementById('avatar-upload').click()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 011.664.89l.812 1.22A2 2 0 0110.07 10H14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                        <div>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <button
                                type="button"
                                onClick={() => document.getElementById('avatar-upload').click()}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                            >
                                Change photo
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                JPG or PNG. Max size of 1MB.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={user?.email || ''}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                            disabled
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Email address cannot be changed.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-1">
                            Phone Number
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        />
                    </div>

                    <div>
                        <label htmlFor="location" className="block text-sm font-medium mb-1">
                            Location
                        </label>
                        <input
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            placeholder="City, Country"
                        />
                    </div>

                    <div>
                        <label htmlFor="jobRole" className="block text-sm font-medium mb-1">
                            Job Role
                        </label>
                        <input
                            id="jobRole"
                            name="jobRole"
                            type="text"
                            value={formData.jobRole}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
                        Profile updated successfully!
                    </div>
                )}

                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded-md text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}