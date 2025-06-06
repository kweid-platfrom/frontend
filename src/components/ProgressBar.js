// components/ProgressBar.jsx
import React from "react";

export const ProgressBar = ({ currentStep, totalSteps }) => {
    const percentage = Math.round((currentStep / totalSteps) * 100);

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm text-slate-500">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};