// components/FeatureAccessBanner.js
'use client';

import React from 'react';
import { useUI } from '../../hooks/useUI';
import { Alert, Button } from '@mui/material';

const FeatureAccessBanner = ({ message }) => {
    const { openModal } = useUI();

    return (
        <Alert
            severity="info"
            action={<Button onClick={() => openModal('upgradePrompt')}>Upgrade Now</Button>}
            className="m-4"
        >
            {message}
        </Alert>
    );
};

export default FeatureAccessBanner;