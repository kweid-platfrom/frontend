// hooks/useAuth.js (Complete Enhanced version)
import { useApp } from '../context/AppProvider';

export const useAuth = () => {
    const { state, actions } = useApp();

    return {
        // State
        currentUser: state.auth.currentUser,
        userProfile: state.auth.userProfile, // Complete user profile from Firestore
        isAuthenticated: state.auth.isAuthenticated,
        accountType: state.auth.accountType,
        loading: state.auth.loading,
        error: state.auth.error,
        profileLoaded: state.auth.profileLoaded,
        pendingRegistration: state.auth.pendingRegistration,
        isInitialized: state.auth.isInitialized,

        // Convenient profile getters
        userName: state.auth.currentUser?.name || state.auth.currentUser?.displayName || 'User',
        userEmail: state.auth.currentUser?.email,
        userFirstName: state.auth.currentUser?.firstName,
        userLastName: state.auth.currentUser?.lastName,
        organizationName: state.auth.currentUser?.organizationName || state.auth.userProfile?.organizationName,
        organizationId: state.auth.currentUser?.organizationId || state.auth.userProfile?.organizationId,
        userRole: state.auth.currentUser?.role || state.auth.userProfile?.role,
        isOrganizationUser: state.auth.accountType === 'organization',
        isIndividualUser: state.auth.accountType === 'individual',

        // Actions
        logout: actions.auth.logout,
        initializeAuth: actions.auth.initializeAuth,
        refreshUserProfile: actions.auth.refreshUserProfile,
        signOut: actions.auth.signOut,
        clearAuthState: actions.auth.clearAuthState,
        restoreAuth: actions.auth.restoreAuth,
        completeEmailVerification: actions.auth.completeEmailVerification,
    };
};