// hooks/useUserDisplay.js

import { useMemo } from 'react';
import { useAuth } from '../context/AppProvider';

export const useUserDisplay = () => {
    const { 
        currentUser, 
        displayInfo, 
        activeOrganization, 
        organizations, 
        isOrganizationOwner, 
        accountType,
        userProfile 
    } = useAuth();

    const displayData = useMemo(() => {
        if (!currentUser) {
            return {
                name: null,
                email: null,
                profilePicture: null,
                initials: null,
                displayName: 'Guest',
                organizationName: null,
                accountType: null,
                isOrganizationAccount: false,
                isOrganizationOwner: false,
                headerTitle: 'Welcome',
                contextualName: 'User'
            };
        }

        const userName = displayInfo?.name || 
                        currentUser?.displayName || 
                        currentUser?.email?.split('@')[0] || 
                        'User';
        
        const userEmail = displayInfo?.email || currentUser?.email || '';
        
        const profilePicture = displayInfo?.profilePicture || 
                              userProfile?.profile_picture || 
                              null;

        // Generate initials from name
        const getInitials = (name) => {
            if (!name) return 'U';
            return name
                .split(' ')
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);
        };

        const initials = getInitials(userName);
        
        const isOrganizationAccount = accountType === 'organization' || 
                                    (activeOrganization && organizations.length > 0);
        
        const organizationName = activeOrganization?.name || 
                               displayInfo?.organizationName || 
                               null;

        // Determine what to display in headers and different contexts
        let headerTitle = userName;
        let contextualName = userName;

        if (isOrganizationAccount && organizationName) {
            headerTitle = organizationName;
            contextualName = `${userName} (${organizationName})`;
        }

        return {
            name: userName,
            email: userEmail,
            profilePicture,
            initials,
            displayName: userName,
            organizationName,
            accountType: accountType || 'individual',
            isOrganizationAccount,
            isOrganizationOwner: isOrganizationOwner || false,
            headerTitle,
            contextualName,
            // Additional computed properties
            hasProfilePicture: !!profilePicture,
            shortName: userName.split(' ')[0], // First name only
            fullContext: isOrganizationAccount 
                ? `${userName} • ${organizationName}${isOrganizationOwner ? ' (Owner)' : ''}`
                : userName
        };
    }, [
        currentUser, 
        displayInfo, 
        activeOrganization, 
        organizations, 
        isOrganizationOwner, 
        accountType,
        userProfile
    ]);

    return displayData;
};

// Hook for organization-specific display data
export const useOrganizationDisplay = () => {
    const { 
        activeOrganization, 
        organizations, 
        isOrganizationOwner, 
        organizationMemberships 
    } = useAuth();

    const organizationData = useMemo(() => {
        if (!activeOrganization) {
            return {
                hasOrganization: false,
                organizationName: null,
                isOwner: false,
                memberCount: 0,
                userRole: null,
                organizationsCount: organizations?.length || 0,
                canSwitchOrganizations: (organizations?.length || 0) > 1
            };
        }

        const membership = organizationMemberships?.find(
            m => m.org_id === activeOrganization.id
        );

        return {
            hasOrganization: true,
            organizationName: activeOrganization.name,
            organizationDescription: activeOrganization.description,
            isOwner: isOrganizationOwner || activeOrganization.ownerId === activeOrganization.currentUserId,
            memberCount: activeOrganization.memberCount || 0,
            userRole: membership?.role || 'Member',
            organizationsCount: organizations?.length || 0,
            canSwitchOrganizations: (organizations?.length || 0) > 1,
            organizationSettings: activeOrganization.settings || {},
            joinedAt: membership?.joined_at || null
        };
    }, [
        activeOrganization, 
        organizations, 
        isOrganizationOwner, 
        organizationMemberships
    ]);

    return organizationData;
};

// Hook for contextual display based on current page/component
export const useContextualDisplay = (context = 'default') => {
    const userDisplay = useUserDisplay();
    const organizationDisplay = useOrganizationDisplay();

    const contextualData = useMemo(() => {
        switch (context) {
            case 'header':
                return {
                    title: userDisplay.headerTitle,
                    subtitle: userDisplay.isOrganizationAccount 
                        ? `${userDisplay.name}${organizationDisplay.isOwner ? ' (Owner)' : ''}` 
                        : userDisplay.email,
                    showOrganizationBadge: userDisplay.isOrganizationAccount,
                    organizationName: userDisplay.organizationName
                };
            
            case 'profile':
                return {
                    title: userDisplay.name,
                    subtitle: userDisplay.email,
                    description: userDisplay.fullContext,
                    accountType: userDisplay.accountType,
                    showOrganizationDetails: userDisplay.isOrganizationAccount
                };
            
            case 'navigation':
                return {
                    title: userDisplay.shortName,
                    subtitle: userDisplay.isOrganizationAccount 
                        ? userDisplay.organizationName 
                        : null,
                    compact: true
                };
            
            case 'card':
                return {
                    title: userDisplay.name,
                    subtitle: userDisplay.isOrganizationAccount 
                        ? userDisplay.organizationName 
                        : userDisplay.email,
                    role: organizationDisplay.hasOrganization 
                        ? organizationDisplay.userRole 
                        : null
                };
            
            default:
                return {
                    title: userDisplay.contextualName,
                    subtitle: userDisplay.email,
                    isOrganization: userDisplay.isOrganizationAccount
                };
        }
    }, [userDisplay, organizationDisplay, context]);

    return {
        ...contextualData,
        userDisplay,
        organizationDisplay
    };
};