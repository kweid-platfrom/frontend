// components/stats/StatusBadge.js
export const StatusBadge = ({ status, count, animated = true }) => {
    const statusConfig = {
        running: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' },
        passed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
        failed: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
        blocked: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-400' },
        critical: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
            <div className={`w-2 h-2 rounded-full ${config.dot} mr-2 ${animated ? 'animate-pulse' : ''}`}></div>
            {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
        </div>
    );
};