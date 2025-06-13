import React from "react";

export const MetricCard = ({ title, value, change, status = "neutral", icon: Icon, className = "" }) => {
    const getStatusColor = () => {
        switch (status) {
            case "positive":
                return "text-green-600";
            case "negative":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const getChangePrefix = () => {
        if (change && change.toString().charAt(0) !== "-" && change.toString().charAt(0) !== "+") {
            return change > 0 ? "+" : "";
        }
        return "";
    };

    return (
        <div className={`bg-white rounded-xs shadow p-6 ${className}`}>
            <div className="flex justify-between items-start">
                <div className="text-sm text-gray-500 font-medium">{title}</div>
                {Icon && <Icon className="text-gray-400 h-5 w-5" />}
            </div>
            <div className="flex items-baseline mt-2">
                <div className="text-3xl font-bold">{value}</div>
                {change && (
                    <div className={`ml-2 text-sm ${getStatusColor()}`}>
                        {getChangePrefix()}{change}
                    </div>
                )}
            </div>
        </div>
    );
};