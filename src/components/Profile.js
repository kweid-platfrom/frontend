'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppProvider';
import {
    UserIcon,
    PencilIcon,
    CameraIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

// Profile Information Component
const ProfileSection = () => {
    const { actions, currentUser, profileData, profileLoading } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        display_name: '',
        email: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profileData) {
            setFormData({
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                display_name: profileData.display_name || '',
                email: profileData.email || currentUser?.email || '',
            });
        }
    }, [profileData, currentUser]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await actions.auth.updateUserProfile(formData);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            first_name: profileData?.first_name || '',
            last_name: profileData?.last_name || '',
            display_name: profileData?.display_name || '',
            email: profileData?.email || currentUser?.email || '',
        });
        setIsEditing(false);
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-primary mr-2" />
                    <h3 className="text-lg font-semibold text-card-foreground">Profile Information</h3>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors"
                    >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                    </button>
                )}
            </div>

            {profileLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                            <div className="h-10 bg-muted rounded"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1">
                                First Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            ) : (
                                <p className="px-3 py-2 bg-muted rounded-md text-card-foreground">
                                    {formData.first_name || 'Not set'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1">
                                Last Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            ) : (
                                <p className="px-3 py-2 bg-muted rounded-md text-card-foreground">
                                    {formData.last_name || 'Not set'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                            Display Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.display_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        ) : (
                            <p className="px-3 py-2 bg-muted rounded-md text-card-foreground">
                                {formData.display_name || 'Not set'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                            Email Address
                        </label>
                        <p className="px-3 py-2 bg-muted rounded-md text-card-foreground">
                            {formData.email || 'Not set'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Email cannot be changed from this interface
                        </p>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Avatar Section Component
const AvatarSection = () => {
    const { currentUser, profileData, actions } = useApp();
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const currentAvatar = profileData?.profile_picture || currentUser?.photoURL;

    // Helper function to resize images using canvas
    const resizeImage = (file, maxWidth, maxHeight, quality) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            actions.ui.showNotification?.({
                id: 'invalid-file-type',
                type: 'error',
                message: 'Please select a valid image file',
                duration: 3000,
            });
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            actions.ui.showNotification?.({
                id: 'file-too-large',
                type: 'error',
                message: 'Image must be smaller than 5MB',
                duration: 3000,
            });
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload image
        uploadAvatar(file);
    };

    const uploadAvatar = async (file) => {
        setUploading(true);
        try {
            // First, resize the image to reduce file size
            const resizedFile = await resizeImage(file, 200, 200, 0.8);
            
            // Create a temporary URL for immediate preview
            const tempUrl = URL.createObjectURL(resizedFile);
            setImagePreview(tempUrl);
            
            // Option 1: Upload to Firebase Storage (recommended)
            try {
                const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                const { storage } = await import('@/config/firebase'); 
                
                // Create unique filename
                const timestamp = Date.now();
                const fileExtension = file.name.split('.').pop();
                const filename = `avatars/${currentUser.uid}_${timestamp}.${fileExtension}`;
                
                // Upload to Firebase Storage
                const storageRef = ref(storage, filename);
                const snapshot = await uploadBytes(storageRef, resizedFile);
                const downloadURL = await getDownloadURL(snapshot.ref);
                
                // Update profile with the storage URL
                const result = await actions.auth.updateUserProfile({
                    profile_picture: downloadURL
                });
                
                if (result?.success !== false) {
                    actions.ui.showNotification?.({
                        id: 'avatar-updated',
                        type: 'success',
                        message: 'Profile photo updated successfully',
                        duration: 3000,
                    });
                    setImagePreview(null);
                    URL.revokeObjectURL(tempUrl);
                } else {
                    throw new Error(result?.error || 'Failed to update avatar');
                }
            } catch (firebaseError) {
                console.warn('Firebase Storage not available, using compressed base64:', firebaseError);
                
                // Option 2: Fallback to highly compressed base64
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = async () => {
                    // Set small canvas size for compression
                    canvas.width = 150;
                    canvas.height = 150;
                    
                    // Draw and compress image
                    ctx.drawImage(img, 0, 0, 150, 150);
                    
                    // Convert to highly compressed base64 (JPEG at 60% quality)
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    
                    try {
                        const result = await actions.auth.updateUserProfile({
                            profile_picture: compressedBase64
                        });
                        
                        if (result?.success !== false) {
                            actions.ui.showNotification?.({
                                id: 'avatar-updated',
                                type: 'success',
                                message: 'Profile photo updated successfully',
                                duration: 3000,
                            });
                            setImagePreview(null);
                            URL.revokeObjectURL(tempUrl);
                        } else {
                            throw new Error(result?.error || 'Failed to update avatar');
                        }
                    } catch (error) {
                        throw error;
                    } finally {
                        setUploading(false);
                    }
                };
                
                img.onerror = () => {
                    setUploading(false);
                    throw new Error('Failed to process image');
                };
                
                img.src = tempUrl;
                return; // Exit here for async image processing
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            actions.ui.showNotification?.({
                id: 'avatar-upload-error',
                type: 'error',
                message: 'Failed to update profile photo',
                description: error.message,
                duration: 5000,
            });
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    const removeAvatar = async () => {
        try {
            setUploading(true);
            
            const result = await actions.auth.updateUserProfile({
                profile_picture: null
            });
            
            if (result?.success !== false) {
                actions.ui.showNotification?.({
                    id: 'avatar-removed',
                    type: 'success',
                    message: 'Profile photo removed successfully',
                    duration: 3000,
                });
                setImagePreview(null);
            } else {
                throw new Error(result?.error || 'Failed to remove avatar');
            }
        } catch (error) {
            console.error('Avatar removal error:', error);
            actions.ui.showNotification?.({
                id: 'avatar-remove-error',
                type: 'error',
                message: 'Failed to remove profile photo',
                description: error.message,
                duration: 5000,
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center mb-6">
                <CameraIcon className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-card-foreground">Profile Photo</h3>
            </div>

            <div className="flex items-center space-x-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {imagePreview || currentAvatar ? (
                            <Image
                                src={imagePreview || currentAvatar}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                    {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50"
                        >
                            <CameraIcon className="h-4 w-4 mr-2" />
                            {currentAvatar ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {currentAvatar && (
                            <button
                                onClick={removeAvatar}
                                disabled={uploading}
                                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                Remove Photo
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG or GIF. Max size 5MB.
                    </p>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
            />
        </div>
    );
};

// Account Information Component
const AccountSection = () => {
    const { state, currentUser, profileData } = useApp();
    const accountType = state.auth.accountType;
    const organizationInfo = accountType === 'organization' ? {
        name: profileData?.organizationName || currentUser?.organizationName || 'Organization',
        role: profileData?.role || currentUser?.role || 'member'
    } : null;

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center mb-6">
                <BuildingOffice2Icon className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-card-foreground">Account Information</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                        Account Type
                    </label>
                    <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-muted text-muted-foreground">
                            {accountType === 'organization' ? 'Team Account' : 'Individual Account'}
                        </span>
                    </div>
                </div>

                {organizationInfo && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1">
                                Organization
                            </label>
                            <p className="px-3 py-2 bg-muted rounded-md text-card-foreground">
                                {organizationInfo.name}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1">
                                Role
                            </label>
                            <p className="px-3 py-2 bg-muted rounded-md text-card-foreground capitalize">
                                {organizationInfo.role}
                            </p>
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                        User ID
                    </label>
                    <p className="px-3 py-2 bg-muted rounded-md text-card-foreground font-mono text-xs">
                        {currentUser?.uid || 'Not available'}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                        Account Created
                    </label>
                    <p className="px-3 py-2 bg-muted rounded-md text-card-foreground">
                        {profileData?.created_at ? 
                            new Date(profileData.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : 
                            'Not available'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

// Main Profile Component that exports all sections
const Profile = () => {
    
    return (
        <>
            <AvatarSection />
            <ProfileSection />
            <AccountSection />
        </>
    );
};

export default Profile;