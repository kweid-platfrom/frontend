"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

// Create Alert Context
const AlertContext = createContext();

// Custom Alert Component
const CustomAlert = ({ show, message, type = "success", duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(show);
    const [portalElement, setPortalElement] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setIsVisible(show);
        if (show && duration && !isHovered) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose, isHovered]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            let element = document.getElementById("alert-root");
            if (!element) {
                element = document.createElement("div");
                element.id = "alert-root";
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

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
        setIsHovered(false);
        setTimeout(() => setIsVisible(false), 1000);
    };

    // Styling that matches the settings page alert
    const alertStyles = {
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
        warning: "bg-yellow-100 text-yellow-800",
        info: "bg-blue-100 text-blue-800",
    };

    if (!portalElement || !isVisible) return null;

    return createPortal(
        <div className="fixed inset-0 flex items-start justify-center pt-16 px-4 z-50 pointer-events-none">
            <div 
                className={`max-w-md w-full ${alertStyles[type]} p-4 mb-6 rounded pointer-events-auto`} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex items-center">
                    <div className="flex-grow">{message}</div>
                    <button
                        onClick={handleClose}
                        className="ml-4 text-current hover:opacity-75 focus:outline-none"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>,
        portalElement
    );
};

// Hook to use alert
export const useAlert = () => {
    const [alertState, setAlertState] = useState({
        show: false,
        message: "",
        type: "success",
        duration: 3000,
    });

    const showAlert = (message, type = "success", duration = 3000) => {
        setAlertState({ show: true, message, type, duration });
    };

    const hideAlert = () => {
        setAlertState((prev) => ({ ...prev, show: false }));
    };

    return {
        showAlert,
        hideAlert,
        alertComponent: (
            <CustomAlert
                show={alertState.show}
                message={alertState.message}
                type={alertState.type}
                duration={alertState.duration}
                onClose={hideAlert}
            />
        ),
    };
};

// Alert Provider Component
export const AlertProvider = ({ children }) => {
    const alert = useAlert();

    return (
        <AlertContext.Provider value={alert}>
            {children}
            {alert.alertComponent}
        </AlertContext.Provider>
    );
};

// Hook to access the alert context
export const useAlertContext = () => useContext(AlertContext);

export default CustomAlert;