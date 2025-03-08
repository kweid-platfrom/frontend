// components/CustomAlert.jsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const CustomAlert = ({
    show,
    message,
    type = "success",
    duration = 3000,
    onClose
}) => {
    const [isVisible, setIsVisible] = useState(show);
    const [portalElement, setPortalElement] = useState(null);

    useEffect(() => {
        setIsVisible(show);
        if (show && duration) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    useEffect(() => {
        // Create portal element for the alert
        if (typeof window !== 'undefined') {
            let element = document.getElementById('alert-root');
            if (!element) {
                element = document.createElement('div');
                element.id = 'alert-root';
                document.body.appendChild(element);
            }
            setPortalElement(element);
        }

        return () => {
            if (portalElement && portalElement.parentNode) {
                portalElement.parentNode.removeChild(portalElement);
            }
        };
    }, [portalElement]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    // Set alert background color based on type
    const alertStyles = {
        success: "bg-green-100 border-green-500 text-green-700",
        error: "bg-red-100 border-red-500 text-red-700",
        warning: "bg-yellow-100 border-yellow-500 text-yellow-700",
        info: "bg-blue-100 border-blue-500 text-blue-700"
    };

    // Set icon based on alert type
    const alertIcon = {
        success: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        warning: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    };

    if (!portalElement || !isVisible) return null;

    return createPortal(
        <div className="fixed inset-0 flex items-start justify-center pt-16 px-4 z-50 pointer-events-none">
            <div className={`max-w-md w-full ${alertStyles[type]} border-l-4 rounded shadow-md p-4 flex items-center pointer-events-auto`}>
                <div className="mr-3">
                    {alertIcon[type]}
                </div>
                <div className="flex-grow">{message}</div>
                <button
                    onClick={handleClose}
                    className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>,
        portalElement
    );
};

// Alert Provider for easy usage throughout the app
export const useAlert = () => {
    const [alertState, setAlertState] = useState({
        show: false,
        message: "",
        type: "success",
        duration: 3000
    });

    const showAlert = (message, type = "success", duration = 3000) => {
        setAlertState({
            show: true,
            message,
            type,
            duration
        });
    };

    const hideAlert = () => {
        setAlertState(prev => ({ ...prev, show: false }));
    };

    const alertComponent = (
        <CustomAlert
            show={alertState.show}
            message={alertState.message}
            type={alertState.type}
            duration={alertState.duration}
            onClose={hideAlert}
        />
    );

    return {
        showAlert,
        hideAlert,
        alertComponent
    };
};

export default CustomAlert;