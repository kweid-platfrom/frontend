// components/layout/TrialBanner.js
'use client'
import { useProject } from '../../context/SuiteContext';
import {
    ClockIcon,
    ExclamationTriangleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const TrialBanner = ({ isCollapsed, trialStatus, onUpgradeClick }) => {
    const { subscriptionStatus } = useProject();

    const handleUpgrade = () => {
        if (onUpgradeClick) {
            // Use the prop function passed from parent (Sidebar)
            onUpgradeClick();
        } else {
            // Fallback: dispatch a custom event that parent components can listen to
            window.dispatchEvent(new CustomEvent('navigateToUpgrade', {
                detail: { targetPage: 'upgrade' }
            }));
        }
    };

    // Use trialStatus prop if provided, otherwise fall back to subscriptionStatus
    const currentStatus = trialStatus || subscriptionStatus;

    // Only show banner if trial is active and we have valid trial data
    if (!currentStatus?.isTrialActive || currentStatus?.trialDaysRemaining === undefined) {
        return null;
    }

    // Get trial days remaining from the current status
    const trialDaysRemaining = Math.max(0, currentStatus.trialDaysRemaining);
    const isUrgent = trialDaysRemaining <= 3;
    const isModerate = trialDaysRemaining <= 7 && trialDaysRemaining > 3;

    // Don't show banner if trial has more than 7 days remaining (keep it less intrusive)
    if (trialDaysRemaining > 7) {
        return null;
    }

    const getBannerStyles = () => {
        if (isUrgent) {
            return 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200';
        }
        if (isModerate) {
            return 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200';
        }
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200';
    };

    const getTextStyles = () => {
        if (isUrgent) {
            return {
                title: 'text-red-800',
                subtitle: 'text-red-600'
            };
        }
        if (isModerate) {
            return {
                title: 'text-amber-800',
                subtitle: 'text-amber-600'
            };
        }
        return {
            title: 'text-blue-800',
            subtitle: 'text-blue-600'
        };
    };

    const getButtonStyles = () => {
        if (isUrgent) {
            return 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200';
        }
        if (isModerate) {
            return 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200';
        }
        return 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200';
    };

    const getIcon = () => {
        if (isUrgent) {
            return <ExclamationTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />;
        }
        if (isModerate) {
            return <ClockIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />;
        }
        return <SparklesIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />;
    };

    const textStyles = getTextStyles();

    return (
        <div className={`relative group mx-4 mb-4 p-3 rounded-xl transition-all duration-300 hover:shadow-md ${
            getBannerStyles()
        } ${isCollapsed ? 'lg:mx-2 lg:p-2' : 'mx-4 p-3'}`}>
            
            {/* Main content */}
            <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
                <div className={`flex items-center min-w-0 ${isCollapsed ? 'lg:justify-center' : ''}`}>
                    {getIcon()}
                    <div className={`ml-2 min-w-0 transition-all duration-300 ${
                        isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
                    }`}>
                        <p className={`text-xs font-semibold ${textStyles.title}`}>
                            {isUrgent 
                                ? `Trial expires ${trialDaysRemaining === 0 ? 'today' : `in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''}`}!`
                                : `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining`
                            }
                        </p>
                        <p className={`text-xs ${textStyles.subtitle}`}>
                            {isUrgent 
                                ? 'Upgrade now to keep full access'
                                : 'Upgrade to continue with premium features'
                            }
                        </p>
                    </div>
                </div>

                {/* Upgrade button */}
                <button
                    onClick={handleUpgrade}
                    className={`ml-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 transform ${
                        getButtonStyles()
                    } ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none lg:scale-0' : 'w-auto opacity-100 scale-100'}`}
                >
                    {isUrgent ? 'Upgrade Now' : 'Upgrade'}
                </button>
            </div>

            {/* Collapsed state tooltip */}
            {isCollapsed && (
                <div className="hidden group-hover:block absolute left-full top-0 ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none">
                    <div className="font-medium">
                        Trial: {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left
                    </div>
                    <div className="text-xs opacity-75">
                        {isUrgent ? 'Urgent: Upgrade now!' : 'Click to upgrade'}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                </div>
            )}

            {/* Subtle animation for urgent states */}
            {isUrgent && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400/10 to-red-600/10 animate-pulse pointer-events-none"></div>
            )}
        </div>
    );
};

export default TrialBanner;