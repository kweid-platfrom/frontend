// components/NotificationBanner.js
'use client';

import React from 'react';
import { useUI } from '../../hooks/useUI';
import { Alert, Button } from '@mui/material';

const NotificationBanner = () => {
    const { notifications, openModal } = useUI();

    return (
        <div className="m-4">
            {notifications.map(({ id, type, message }) => (
                <Alert
                    key={id}
                    severity={type}
                    action={type === 'warning' && (
                        <Button onClick={() => openModal('upgradePrompt')}>
                            Upgrade Now
                        </Button>
                    )}
                    className="mb-2"
                >
                    {message}
                </Alert>
            ))}
        </div>
    );
};

export default NotificationBanner;