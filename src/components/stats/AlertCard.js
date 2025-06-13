// components/stats/AlertCard.js
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export const AlertCard = ({ type = 'info', title, message, onDismiss, timestamp }) => {
    const alertConfig = {
        info: {
            bg: 'bg-blue-50 border-blue-200',
            text: 'text-blue-800',
            icon: Info,
            iconColor: 'text-blue-600'
        },
        success: {
            bg: 'bg-green-50 border-green-200',
            text: 'text-green-800',
            icon: CheckCircle,
            iconColor: 'text-green-600'
        },
        warning: {
            bg: 'bg-yellow-50 border-yellow-200',
            text: 'text-yellow-800',
            icon: AlertTriangle,
            iconColor: 'text-yellow-600'
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            text: 'text-red-800',
            icon: XCircle,
            iconColor: 'text-red-600'
        }
    };

    const config = alertConfig[type];
    const Icon = config.icon;

    return (
        <div className={`p-4 rounded-lg border ${config.bg} ${config.text}`}>
            <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
                <div className="flex-1">
                    <h4 className="font-medium">{title}</h4>
                    <p className="text-sm mt-1 opacity-90">{message}</p>
                    {timestamp && (
                        <p className="text-xs mt-2 opacity-70">{timestamp}</p>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};