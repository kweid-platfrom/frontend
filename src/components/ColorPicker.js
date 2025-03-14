import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ColorPicker = ({ currentColor, onColorChange }) => {
    const colors = [
        "#3B82F6", // Blue
        "#EF4444", // Red
        "#10B981", // Green
        "#F59E0B", // Yellow
        "#8B5CF6", // Purple
        "#EC4899", // Pink
        "#6B7280", // Gray
    ];

    return (
        <div className="flex gap-2 items-center p-2 bg-white rounded shadow-md">
            {colors.map((color) => (
                <div
                    key={color}
                    className="w-6 h-6 rounded-full cursor-pointer border border-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => onColorChange(color)}
                />
            ))}
        </div>
    );
};

export default ColorPicker;