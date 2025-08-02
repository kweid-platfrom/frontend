import { useReducer } from 'react';
import { where } from 'firebase/firestore';
import { FirestoreService } from '../../services/firestoreService';
import { toast } from 'sonner';

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
                const result = await FirestoreService.queryDocuments(
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
                dispatch({ type: 'TEAM_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
        addTeamMember: async (suiteId, memberData, subscriptionState, uiActions) => {
            try {
                if (!subscriptionState.planLimits.canInviteTeam) {
                    toast.error('Team invitations are locked. Please upgrade your plan.', { duration: 5000 });
                    uiActions.openModal('upgradePrompt');
                    return { success: false, error: 'Team invitation restricted' };
                }

                const result = await FirestoreService.createDocument(
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
                dispatch({ type: 'TEAM_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
        updateTeamMember: async (suiteId, memberId, updateData) => {
            try {
                const result = await FirestoreService.updateDocument(
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
                dispatch({ type: 'TEAM_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
        removeTeamMember: async (suiteId, memberId) => {
            try {
                const result = await FirestoreService.deleteDocument(
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
                dispatch({ type: 'TEAM_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
    };

    return { state, actions };
};