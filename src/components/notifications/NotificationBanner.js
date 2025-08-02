'use client';

import React from 'react';
import { useUI } from '../../hooks/useUI';
import { Alert, Button } from '@mui/material';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorHandler';

const NotificationBanner = () => {
    const { state, actions } = useUI();
    const { notifications = [], openModal, removeNotification } = state && actions ? {
        notifications: state.notifications || [],
        openModal: actions.openModal,
        removeNotification: actions.removeNotification
    } : {};

    if (!notifications.length) {
        return null;
    }

    return (
        <div className="m-4">
            {notifications.map(({ id, type, message }) => (
                <Alert
                    key={id}
                    severity={type}
                    action={
                        <>
                            {type === 'warning' && openModal && (
                                <Button onClick={() => openModal('upgradePrompt')}>
                                    Upgrade Now
                                </Button>
                            )}
                            {removeNotification && (
                                <Button onClick={() => removeNotification(id)} color="inherit">
                                    Dismiss
                                </Button>
                            )}
                        </>
                    }
                    className="mb-2"
                    onClose={removeNotification ? () => removeNotification(id) : undefined}
                >
                    {typeof message === 'string' && message.includes('firestore')
                        ? getFirebaseErrorMessage(message)
                        : message}
                </Alert>
            ))}
        </div>
    );
};

export default NotificationBanner;