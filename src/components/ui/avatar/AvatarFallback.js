import React from "react";

const AvatarFallback = ({ name = "User", className = "" }) => {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <div className={`flex items-center justify-center bg-gray-300 text-white font-bold ${className}`}>
            {initials}
        </div>
    );
};

export default AvatarFallback;
