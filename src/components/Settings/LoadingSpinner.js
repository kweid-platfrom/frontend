import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00897b]"></div>
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default LoadingSpinner;