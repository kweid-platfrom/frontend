// utils/userDisplayUtils.js
export const getUserDisplayName = (userProfile) => {
    if (userProfile?.firstName && userProfile?.lastName) {
        return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile?.displayName) return userProfile.displayName;
    if (userProfile?.name) return userProfile.name;
    if (userProfile?.email) {
        const emailName = userProfile.email.split('@')[0];
        return emailName
            .replace(/[._]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    return 'User';
};

export const getUserInitials = (userProfile) => {
    const displayName = getUserDisplayName(userProfile);
    if (!displayName || displayName === 'User') return 'U';

    const nameParts = displayName.trim().split(' ');
    return nameParts.length === 1
        ? nameParts[0].charAt(0).toUpperCase()
        : nameParts[0].charAt(0).toUpperCase() +
        nameParts[nameParts.length - 1].charAt(0).toUpperCase();
};

export const getSubscriptionInfo = (userProfile) => {
    const { subscriptionType } = userProfile || {};
    const subscriptionData = {
        free: {
            name: 'Free Plan',
            color: 'bg-gray-100 text-gray-800',
            features: ['1 Project', 'Basic Bug Tracking', 'Community Support']
        },
        individual: {
            name: 'Individual Plan',
            color: 'bg-teal-100 text-teal-800',
            features: ['1 Project', 'Advanced Features', 'Email Support']
        },
        team: {
            name: 'Team Plan',
            color: 'bg-green-100 text-green-800',
            features: ['5 Projects', 'Team Collaboration', 'Priority Support']
        },
        enterprise: {
            name: 'Enterprise Plan',
            color: 'bg-purple-100 text-purple-800',
            features: ['Unlimited Projects', 'Advanced Analytics', '24/7 Support']
        }
    };
    return subscriptionData[subscriptionType] || subscriptionData.free;
};
