// hooks/usePasswordChange.js
import { useState } from 'react';

export const usePasswordChange = () => {
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        console.log('Changing password');
        setShowPasswordForm(false);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const resetPasswordForm = () => {
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setShowPasswordForm(false);
    };

    return {
        passwordForm,
        setPasswordForm,
        showPasswordForm,
        setShowPasswordForm,
        handlePasswordChange,
        resetPasswordForm
    };
};