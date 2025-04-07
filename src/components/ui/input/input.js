import React from "react";

const Input = ({ type = "text", placeholder, value, onChange, name, className, ...rest }) => {
    return (
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00897B] ${className}`}
            {...rest}
        />
    );
};

export default Input;
