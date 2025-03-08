import React from "react";

const AvatarImage = ({ src, alt = "User Avatar", className = "" }) => {
    return <image src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />;
};

export default AvatarImage;
