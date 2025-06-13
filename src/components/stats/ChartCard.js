import React from "react";

export const ChartCard = ({ title, children, className = "" }) => {
    return (
        <div className={`bg-white rounded-lg shadow p-6 mb-6 ${className}`}>
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            <div className="h-64">
                {children}
            </div>
        </div>
    );
};