"use client";

import React from "react";
import { CheckCircle, Bug } from "lucide-react";

const BugReportSuccess = ({ 
    onClose, 
    bugId = null, 
    title = "Bug Report Submitted!",
    message = "Thank you for helping us improve the application.",
    showBugId = false,
    autoClose = true,
    autoCloseDelay = 3000,
    className = "",
    variant = "default" // "default", "compact", "detailed"
}) => {
    React.useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [autoClose, autoCloseDelay, onClose]);

    const getVariantStyles = () => {
        switch (variant) {
            case "compact":
                return "p-6";
            case "detailed":
                return "p-8";
            default:
                return "p-12";
        }
    };

    const getIconSize = () => {
        switch (variant) {
            case "compact":
                return "w-12 h-12";
            case "detailed":
                return "w-20 h-20";
            default:
                return "w-16 h-16";
        }
    };

    const getIconInnerSize = () => {
        switch (variant) {
            case "compact":
                return "h-6 w-6";
            case "detailed":
                return "h-10 w-10";
            default:
                return "h-8 w-8";
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center text-center ${getVariantStyles()} ${className}`}>
            {/* Success Icon */}
            <div className={`${getIconSize()} bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in-50 duration-300`}>
                <CheckCircle className={`${getIconInnerSize()} text-green-600`} />
            </div>

            {/* Title */}
            <h3 className={`font-semibold text-gray-900 mb-2 ${
                variant === "compact" ? "text-lg" : 
                variant === "detailed" ? "text-2xl" : "text-xl"
            }`}>
                {title}
            </h3>

            {/* Message */}
            <p className={`text-gray-600 mb-6 ${
                variant === "compact" ? "text-sm" : "text-base"
            }`}>
                {message}
            </p>

            {/* Bug ID Display */}
            {showBugId && bugId && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <Bug className="h-4 w-4" />
                        <span>Bug ID:</span>
                        <code className="px-2 py-1 bg-white rounded border text-gray-800 font-mono text-xs">
                            {bugId}
                        </code>
                    </div>
                </div>
            )}

            {/* Detailed variant additional info */}
            {variant === "detailed" && (
                <div className="mb-6 space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Bug reported su</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                </div>
            )}

            {/* Auto-close indicator */}
            {autoClose && (
                <div className="mt-2 text-xs text-gray-400">
                    Closing automatically in {Math.ceil(autoCloseDelay / 1000)} seconds
                </div>
            )}
        </div>
    );
};

export default BugReportSuccess;