import React from "react";

const DropdownMenuItem = ({ children, onClick }) => {
    return (
        <button
            className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default DropdownMenuItem;
