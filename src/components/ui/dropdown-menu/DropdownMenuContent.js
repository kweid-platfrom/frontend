import React from "react";

const DropdownMenuContent = ({ children }) => {
    return (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg">
            {children}
        </div>
    );
};

export default DropdownMenuContent;
