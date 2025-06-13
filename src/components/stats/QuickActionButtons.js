// components/stats/QuickActionButton.js
export const QuickActionButton = ({ icon: Icon, label, onClick, color = 'blue', loading = false, disabled = false }) => {
    const colorClasses = {
        blue: 'bg-blue-50 hover:bg-blue-100 text-blue-900',
        green: 'bg-green-50 hover:bg-green-100 text-green-900',
        purple: 'bg-purple-50 hover:bg-purple-100 text-purple-900',
        yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900',
        red: 'bg-red-50 hover:bg-red-100 text-red-900'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[color]}`}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <Icon className="w-5 h-5" />
            )}
            <span className="font-medium">{label}</span>
        </button>
    );
};