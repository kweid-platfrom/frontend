"use client";  
import React, {  useRef, useEffect } from "react";  

const FilterOverlay = ({ isOpen, onClose, children, anchorRef }) => {  
    const overlayRef = useRef(null);  

    useEffect(() => {  
        const handleClickOutside = (event) => {  
            if (overlayRef.current && !overlayRef.current.contains(event.target) && anchorRef.current && !anchorRef.current.contains(event.target)) {  
                onClose();  
            }  
        };  

        if (isOpen) {  
            document.addEventListener("mousedown", handleClickOutside);  
        }  

        return () => {  
            document.removeEventListener("mousedown", handleClickOutside);  
        };  
    }, [isOpen, onClose, anchorRef]);  

    return (  
        isOpen ? (  
            <div className="absolute right-6 mt-9 bg-white border border-gray-300 shadow-ms rounded-xs text-sm z-50 p-2 w-screen sm:w-72 md:w-80 lg:w-96" ref={overlayRef}>  
                <button  
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"  
                    onClick={onClose}  
                >  
                    X  
                </button>  
                {children}  
            </div>  
        ) : null  
    );  
};  

export default FilterOverlay;