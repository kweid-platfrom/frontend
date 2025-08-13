import { useReducer } from 'react';
import { where } from 'firebase/firestore';
import { BaseFirestoreService } from '../../services/firestoreService';
import { toast } from 'sonner';

// Create a service instance
const firestoreService = new BaseFirestoreService();

const initialState = {
    teamMembers: [],
    loading: false,
    error: null,
};

const teamReducer = (state, action) => {
    switch (action.type) {
        case 'TEAM_LOADING':
            return { ...state, loading: true, error: null };
        case 'TEAM_LOADED':
            return { ...state, teamMembers: action.payload, loading: false, error: null };
        case 'TEAM_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const useTeam = () => {
    const [state, dispatch] = useReducer(teamReducer, initialState);

    const actions = {
        loadTeamMembers: async (suiteId) => {
            dispatch({ type: 'TEAM_LOADING' });
            try {
                // Check if queryDocuments method exists
                if (typeof firestoreService.queryDocuments !== 'function') {
                    throw new Error('Team query service is not available');
                }

                const result = await firestoreService.queryDocuments(
                    `testSuites/${suiteId}/members`,
                    [where('status', '==', 'active')]
                );
                if (result.success) {
                    dispatch({ type: 'TEAM_LOADED', payload: result.data });
                } else {
                    dispatch({ type: 'TEAM_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                const errorMessage = error.message || 'An unexpected error occurred while loading team members';
                dispatch({ type: 'TEAM_ERROR', payload: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
            }
        },
        addTeamMember: async (suiteId, memberData, subscriptionState, uiActions) => {
            try {
                if (!subscriptionState.planLimits.canInviteTeam) {
                    toast.error('Team invitations are locked. Please upgrade your plan.', { duration: 5000 });
                    uiActions.openModal('upgradePrompt');
                    return { success: false, error: 'Team invitation restricted' };
                }

                // Check if createDocument method exists
                if (typeof firestoreService.createDocument !== 'function') {
                    throw new Error('Team member creation service is not available');
                }

                const result = await firestoreService.createDocument(
                    `testSuites/${suiteId}/members`,
                    {
                        ...memberData,
                        status: 'active',
                        created_at: new Date().toISOString(),
                    }
                );
                if (result.success) {
                    dispatch({
                        type: 'TEAM_LOADED',
                        payload: [...state.teamMembers, result.data],
                    });
                    toast.success('Team member added successfully', { duration: 5000 });
                    return result;
                } else {
                    dispatch({ type: 'TEAM_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                const errorMessage = error.message || 'An unexpected error occurred while adding team member';
                dispatch({ type: 'TEAM_ERROR', payload: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
                return { success: false, error: errorMessage };
            }
        },
        updateTeamMember: async (suiteId, memberId, updateData) => {
            try {
                // Check if updateDocument method exists
                if (typeof firestoreService.updateDocument !== 'function') {
                    throw new Error('Team member update service is not available');
                }

                const result = await firestoreService.updateDocument(
                    `testSuites/${suiteId}/members`,
                    memberId,
                    updateData
                );
                if (result.success) {
                    dispatch({
                        type: 'TEAM_LOADED',
                        payload: state.teamMembers.map((member) =>
                            member.id === memberId ? { ...member, ...result.data } : member
                        ),
                    });
                    toast.success('Team member updated successfully', { duration: 5000 });
                    return result;
                } else {
                    dispatch({ type: 'TEAM_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                const errorMessage = error.message || 'An unexpected error occurred while updating team member';
                dispatch({ type: 'TEAM_ERROR', payload: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
                return { success: false, error: errorMessage };
            }
        },
        removeTeamMember: async (suiteId, memberId) => {
            try {
                // Check if deleteDocument method exists
                if (typeof firestoreService.deleteDocument !== 'function') {
                    throw new Error('Team member deletion service is not available');
                }

                const result = await firestoreService.deleteDocument(
                    `testSuites/${suiteId}/members`,
                    memberId
                );
                if (result.success) {
                    dispatch({
                        type: 'TEAM_LOADED',
                        payload: state.teamMembers.filter((member) => member.id !== memberId),
                    });
                    toast.success('Team member removed successfully', { duration: 5000 });
                    return result;
                } else {
                    dispatch({ type: 'TEAM_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                const errorMessage = error.message || 'An unexpected error occurred while removing team member';
                dispatch({ type: 'TEAM_ERROR', payload: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
                return { success: false, error: errorMessage };
            }
        },
    };

    return { state, actions };
};