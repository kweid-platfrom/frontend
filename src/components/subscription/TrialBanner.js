// components/subscription/TrialBanner.js
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Crown, X } from 'lucide-react';

export const TrialBanner = ({ daysRemaining, onDismiss }) => {
    const router = useRouter();
    
    if (daysRemaining <= 0) return null;
    
    return (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Crown className="h-5 w-5 text-yellow-300" />
                        <div>
                            <span className="font-medium">
                                {daysRemaining} days left in your trial
                            </span>
                            <span className="ml-2 text-blue-100">
                                Upgrade now to keep all premium features
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.push('/upgrade')}
                            className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-gray-100 transition-colors"
                        >
                            Upgrade Now
                        </button>
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};