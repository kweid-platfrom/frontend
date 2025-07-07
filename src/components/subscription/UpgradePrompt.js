// components/subscription/UpgradePrompt.js
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Crown, Check } from 'lucide-react';

const UpgradePrompt = ({ 
    isOpen, 
    onClose,
}) => {
    const router = useRouter();
    
    if (!isOpen) return null;
    
    const features = [
        'Unlimited test suites',
        'Advanced automation',
        'Team collaboration',
        'Priority support',
        'Advanced reports',
        'API access'
    ];
    
    const handleUpgrade = () => {
        onClose();
        router.push('/upgrade');
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Crown className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-xl font-bold text-gray-900">
                                Upgrade to Premium
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-gray-600 mb-4">
                            Unlock all premium features and take your testing to the next level.
                        </p>
                        
                        <div className="space-y-2">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleUpgrade}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradePrompt