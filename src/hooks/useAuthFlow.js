// hooks/useAuthFlow.js
import { useApp } from '../context/AppProvider';

export const useAuthFlow = () => {
    const { state, actions } = useApp();
    
    const needsEmailVerification = () => {
        return state.auth.currentUser?.uid &&
            state.auth.currentUser?.emailVerified === false &&
            state.auth.isInitialized;
    };

    const isFullyAuthenticated = () => {
        return state.auth.isAuthenticated &&
            state.auth.currentUser?.uid &&
            state.auth.currentUser?.emailVerified === true;
    };

    const shouldShowAuthUI = () => {
        return state.auth.isInitialized &&
            !state.auth.isAuthenticated &&
            !state.auth.currentUser?.uid;
    };

    return {
        needsEmailVerification: needsEmailVerification(),
        isFullyAuthenticated: isFullyAuthenticated(),
        shouldShowAuthUI: shouldShowAuthUI(),
        isAuthInitialized: state.auth.isInitialized,
        profileLoaded: state.auth.profileLoaded,
        currentUser: state.auth.currentUser,
        authLoading: state.auth.loading,
        refreshUserProfile: actions.auth.refreshUserProfile
    };
};