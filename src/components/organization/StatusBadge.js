import React from 'react';

const StatusBadge = ({ status }) => {
    const isActive = status === 'accepted';
    
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
            {isActive ? 'Active' : 'Pending'}
        </span>
    );
};

export default StatusBadge;
