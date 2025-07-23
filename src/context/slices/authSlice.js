import { useReducer } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    currentUser: null,
    isAuthenticated: false,
    accountType: null,
    loading: true,
    error: null,
    isInitialized: false,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'AUTH_LOADING':
            return { ...state, loading: true, error: null };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                currentUser: action.payload.user,
                accountType: action.payload.accountType,
                isAuthenticated: true,
                loading: false,
                error: null,
                isInitialized: true,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                currentUser: null,
                isAuthenticated: false,
                accountType: null,
                loading: false,
                error: action.payload,
                isInitialized: true,
            };
        case 'AUTH_LOGOUT':
            return {
                ...initialState,
                loading: false,
                isInitialized: true,
            };
        default:
            return state;
    }
};

export const useAuth = () => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const actions = {
        initializeAuth: async () => {
            if (state.isInitialized) return; // Prevent re-initialization
            dispatch({ type: 'AUTH_LOADING' });
            try {
                const user = await new Promise((resolve, reject) => {
                    const unsubscribe = onAuthStateChanged(
                        auth,
                        (user) => {
                            unsubscribe(); // Cleanup immediately
                            resolve(user);
                        },
                        (error) => {
                            unsubscribe();
                            reject(error);
                        }
                    );
                });

                if (user) {
                    const profileResult = await firestoreService.getUserProfile(user.uid);
                    if (profileResult.success) {
                        dispatch({
                            type: 'AUTH_SUCCESS',
                            payload: {
                                user: { uid: user.uid, email: user.email, displayName: user.displayName },
                                accountType: profileResult.data.accountType || 'individual',
                            },
                        });
                    } else {
                        const createProfileResult = await firestoreService.createOrUpdateUserProfile({
                            accountType: 'individual',
                            email: user.email,
                        });
                        if (createProfileResult.success) {
                            dispatch({
                                type: 'AUTH_SUCCESS',
                                payload: {
                                    user: { uid: user.uid, email: user.email, displayName: user.displayName },
                                    accountType: createProfileResult.data.accountType,
                                },
                            });
                        } else {
                            throw new Error('Failed to create user profile: ' + createProfileResult.error.message);
                        }
                    }
                } else {
                    dispatch({ type: 'AUTH_LOGOUT' });
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Authentication failed' });
                toast.error(error.message || 'Authentication failed', { duration: 5000 });
            }
        },

        logout: async () => {
            try {
                await auth.signOut();
                dispatch({ type: 'AUTH_LOGOUT' });
                firestoreService.cleanup();
            } catch (error) {
                dispatch({ type: 'AUTH_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
    };

    return { state, actions };
};