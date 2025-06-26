// hooks/useUserProfile.js
import { useState } from 'react';
import { useSuite } from '../context/SuiteContext';

export const useUserProfile = () => {
    const { userProfile, updateUserProfile } = useSuite();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        timezone: '',
        bio: ''
    });

    const startEditing = () => {
        setEditForm({
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || '',
            displayName: userProfile?.displayName || '',
            email: userProfile?.email || '',
            phone: userProfile?.phone || '',
            company: userProfile?.company || '',
            jobTitle: userProfile?.jobTitle || '',
            timezone: userProfile?.timezone || 'UTC',
            bio: userProfile?.bio || ''
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const saveProfile = async () => {
        setIsSaving(true);
        try {
            await updateUserProfile(editForm);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return {
        userProfile,
        isEditing,
        isSaving,
        editForm,
        setEditForm,
        startEditing,
        cancelEditing,
        saveProfile
    };
};
// This custom hook manages the user profile state and actions.