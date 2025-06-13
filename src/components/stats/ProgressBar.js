// components/stats/ProgressBar.js
export const ProgressBar = ({ value, max = 100, color = 'blue', showPercentage = true, label }) => {
    const percentage = Math.round((value / max) * 100);

    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500'
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{label}</span>
                    {showPercentage && <span>{percentage}%</span>}
                </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color]}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};