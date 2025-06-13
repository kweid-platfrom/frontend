import { TrendingUp, TrendingDown } from 'lucide-react';

export const MetricCard = ({ title, value, change, changeType, icon: Icon, color = 'blue', subtitle }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {change && (
                    <div className={`flex items-center space-x-1 text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {changeType === 'positive' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-medium">{change}</span>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                <p className="text-gray-600 text-sm mt-1">{title}</p>
                {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};