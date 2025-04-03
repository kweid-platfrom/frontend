"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

// Create Alert Context
const AlertContext = createContext();

// Custom Alert Component
const CustomAlert = ({ show, message, type = "success", duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [portalElement, setPortalElement] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef(null);
    
    // Mount the component
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
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);
    
    // Handle show/hide
    useEffect(() => {
        if (show) {
            setIsVisible(true);
            if (duration && !isHovered) {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
                timerRef.current = setTimeout(() => {
                    setIsVisible(false);
                    if (onClose) onClose();
                }, duration);
            }
        } else {
            setIsVisible(false);
        }
        
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [show, duration, isHovered, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };
    
    const handleMouseLeave = () => {
        setIsHovered(false);
        if (isVisible) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, 1000);
        }
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
    const alertShownRef = useRef(false);

    // Function to show alert
    const showAlert = (message, type = "success", duration = 3000) => {
        // Prevent calling setState during update cycle
        if (!alertShownRef.current || alertState.message !== message) {
            alertShownRef.current = true;
            setAlertState({ show: true, message, type, duration });
        }
    };

    // Function to hide alert
    const hideAlert = () => {
        alertShownRef.current = false;
        setAlertState((prev) => ({ ...prev, show: false }));
    };

    // Create alert component only once
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