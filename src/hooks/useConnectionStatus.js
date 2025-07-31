// hooks/useConnectionStatus.js
import { useState, useEffect } from 'react';

export const useConnectionStatus = () => {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const checkConnection = () => {
            setIsConnected(navigator.onLine);
        };

        checkConnection();
        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);

        return () => {
            window.removeEventListener('online', checkConnection);
            window.removeEventListener('offline', checkConnection);
        };
    }, []);

    return isConnected;
};