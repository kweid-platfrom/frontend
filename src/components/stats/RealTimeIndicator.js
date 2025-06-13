// components/stats/RealTimeIndicator.js
export const RealTimeIndicator = ({ lastUpdate, isConnected = true }) => (
  <div className="flex items-center space-x-2 text-sm text-gray-500">
    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
    <span>
      {isConnected ? 'Live' : 'Disconnected'} • Updated {lastUpdate}
    </span>
  </div>
);