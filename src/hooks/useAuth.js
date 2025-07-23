// hooks/useAuth.js
import { useApp } from '../context/AppProvider';

export const useAuth = () => {
    const { state, actions } = useApp();

    return {
        // State
        currentUser: state.auth.currentUser,
        isAuthenticated: state.auth.isAuthenticated,
        accountType: state.auth.accountType,
        loading: state.auth.loading,
        error: state.auth.error,

        // Actions
        logout: actions.logout,
        initializeAuth: actions.initializeAuth
    };
};