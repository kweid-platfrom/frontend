"use client";
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthProvider';
import Avatar from '../ui/avatar/Avatar';

export default function ProfileSection({ userData: initialUserData }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(initialUserData || null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        location: "",
        jobRole: "",
    });

    useEffect(() => {
        // Fetch user data from Firestore if not provided
        const fetchUserData = async () => {
            if (!user?.uid) return; // Prevent running if user is not authenticated
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userDataFromFirestore = userSnap.data();
                    setUserData(userDataFromFirestore);
                } else {
                    console.error("No user data found in Firestore.");
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        };

        if (!initialUserData) {
            fetchUserData();
        }
    }, [user, initialUserData]);

    useEffect(() => {
        if (userData) {
            setFormData({
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                phone: userData.phone || "",
                location: userData.location || "",
                jobRole: userData.jobRole || "",
            });
        }
    }, [userData]);

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
            if (file.size > 1 * 1024 * 1024) {
                setError('File size must be less than 1MB');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.uid) {
            setError("User is not authenticated.");
            return;
        }
        
        setLoading(true);
        setSuccess(false);
        setError('');

        try {
            let avatarUrl = userData?.avatarUrl || '';

            if (avatarFile) {
                const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${avatarFile.name}`);
                await uploadBytes(storageRef, avatarFile);
                avatarUrl = await getDownloadURL(storageRef);
            }

            const userUpdateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                location: formData.location,
                jobRole: formData.jobRole,
                ...(avatarUrl && { avatarUrl }),
                updatedAt: new Date()
            };

            await updateDoc(doc(db, 'users', user.uid), userUpdateData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile. Please try again.');
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
                            />
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full shadow-md hover:bg-gray-700"
                                onClick={() => document.getElementById('avatar-upload').click()}
                            >
                                📷
                            </button>
                        </div>
                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        <button type="button" onClick={() => document.getElementById('avatar-upload').click()} className="text-blue-600 hover:underline text-sm">
                            Change photo
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="firstName">First Name</label>
                        <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} required />
                    </div>

                    <div>
                        <label htmlFor="lastName">Last Name</label>
                        <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} required />
                    </div>

                    <div>
                        <label htmlFor="phone">Phone Number</label>
                        <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                    </div>

                    <div>
                        <label htmlFor="location">Location</label>
                        <input id="location" name="location" type="text" value={formData.location} onChange={handleInputChange} placeholder="City, Country" />
                    </div>

                    <div>
                        <label htmlFor="jobRole">Job Role</label>
                        <input id="jobRole" name="jobRole" type="text" value={formData.jobRole} onChange={handleInputChange} />
                    </div>
                </div>

                {error && <div className="mt-4 text-red-600">{error}</div>}
                {success && <div className="mt-4 text-green-600">Profile updated successfully!</div>}

                <div className="mt-6">
                    <button type="submit" disabled={loading} className={`px-4 py-2 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
