import React from "react";

const Avatar = ({ children, className = "" }) => {
    return (
        <div className={`relative inline-block rounded-full overflow-hidden ${className}`}>
            {children}
        </div>
    );
};

export default Avatar;
