import React from 'react';

const UserPermissionsToggle = ({ userId, permissions, onPermissionChange, disabled }) => {
    const formatPermissionLabel = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    return (
        <div className="space-y-1">
            {Object.entries(permissions).map(([key, value]) => (
                <div key={key} className="flex items-center">
                    <input
                        type="checkbox"
                        id={`${userId}-${key}`}
                        checked={value}
                        onChange={(e) => onPermissionChange(userId, key, e.target.checked)}
                        disabled={disabled}
                        className="h-4 w-4 text-[#00897b] focus:ring-[#00897b] border-gray-300 rounded"
                    />
                    <label htmlFor={`${userId}-${key}`} className="ml-2 block text-sm text-gray-700">
                        {formatPermissionLabel(key)}
                    </label>
                </div>
            ))}
        </div>
    );
};

export default UserPermissionsToggle;