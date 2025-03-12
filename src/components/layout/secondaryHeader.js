
"use client"
import React from "react";

const SecondaryHeader = ({ title, actions }) => {
    return (
        <div className="flex justify-between items-center bg-white p-3 shadow-md mb-9 sticky top-0 z-10">
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="flex space-x-2">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors"
                        onClick={action.onClick}
                    >
                        {action.icon && <action.icon size={16} className="mr-2" />} {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SecondaryHeader;