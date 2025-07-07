// components/layout/AppBreadcrumbs.js
'use client';

import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const AppBreadcrumbs = ({ breadcrumbs = [], canGoBack = false, onGoBack }) => {
    if (breadcrumbs.length === 0) return null;
    
    return (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center space-x-2">
                {canGoBack && (
                    <button
                        onClick={onGoBack}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                )}
                
                <nav className="flex items-center space-x-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                            <span className={`
                                ${index === breadcrumbs.length - 1 
                                    ? 'text-gray-900 font-medium' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }
                            `}>
                                {crumb}
                            </span>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default AppBreadcrumbs;