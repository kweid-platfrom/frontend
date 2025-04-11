import React from "react";

const DropdownMenuTrigger = ({ children, onClick }) => {
    return (
        <button onClick={onClick} className="px-4 py-2 text-white bg-[#00897B] rounded">
            {children}
        </button>
    );
};

export default DropdownMenuTrigger;
