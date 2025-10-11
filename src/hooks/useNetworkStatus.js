import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to monitor network connectivity status
 * Detects online/offline state and provides connection quality information
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const wasOfflineTimeoutRef = useRef(null);
  const initTimeoutRef = useRef(null);

  const checkConnectionQuality = useCallback(async () => {
    if (!navigator.onLine) {
      setConnectionQuality('offline');
      return;
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (duration < 1000) {
        setConnectionQuality('good');
      } else if (duration < 3000) {
        setConnectionQuality('moderate');
      } else {
        setConnectionQuality('poor');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setConnectionQuality('poor');
      } else {
        setConnectionQuality('offline');
      }
    }
  }, []);

  useEffect(() => {
    // Delay initialization to prevent banner flash on page load
    initTimeoutRef.current = setTimeout(() => {
      setIsInitialized(true);
    }, 500);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      checkConnectionQuality();

      // Clear any existing timeout
      if (wasOfflineTimeoutRef.current) {
        clearTimeout(wasOfflineTimeoutRef.current);
      }

      // Reset the wasOffline flag after showing reconnection message
      wasOfflineTimeoutRef.current = setTimeout(() => {
        setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
      setConnectionQuality('offline');
      
      // Clear timeout when going offline
      if (wasOfflineTimeoutRef.current) {
        clearTimeout(wasOfflineTimeoutRef.current);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection quality check (but don't show banner yet)
    checkConnectionQuality();

    // Periodic connection quality checks (every 30 seconds)
    const qualityCheckInterval = setInterval(checkConnectionQuality, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityCheckInterval);
      
      if (wasOfflineTimeoutRef.current) {
        clearTimeout(wasOfflineTimeoutRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [checkConnectionQuality]);

  return {
    isOnline,
    wasOffline,
    connectionQuality,
    checkConnectionQuality,
    isInitialized
  };
};

export default useNetworkStatus;