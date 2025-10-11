import React from 'react';
import { WifiOff, Wifi, Signal } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const NetworkStatusBanner = () => {
  const { isOnline, wasOffline, connectionQuality } = useNetworkStatus();

  // Only show banner when there's an issue or when reconnecting
  const shouldShow = !isOnline || wasOffline || (connectionQuality !== 'good' && connectionQuality !== 'offline');

  if (!shouldShow) {
    return null;
  }

  // Determine banner appearance
  let config;
  
  if (!isOnline) {
    config = {
      icon: WifiOff,
      bg: 'bg-red-600',
      text: 'No internet connection',
    };
  } else if (wasOffline) {
    config = {
      icon: Wifi,
      bg: 'bg-green-600',
      text: 'Back online!',
    };
  } else if (connectionQuality === 'poor') {
    config = {
      icon: Signal,
      bg: 'bg-orange-500',
      text: 'Slow connection detected',
    };
  } else if (connectionQuality === 'moderate') {
    config = {
      icon: Signal,
      bg: 'bg-yellow-500',
      text: 'Connection is slower than usual',
    };
  } else {
    return null;
  }

  const Icon = config.icon;

  return (
    <div 
      className={`${config.bg} text-white px-4 py-2 fixed top-0 left-0 right-0 z-[9999] shadow-lg`}
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-sm font-medium">{config.text}</p>
      </div>
    </div>
  );
};

export default NetworkStatusBanner;