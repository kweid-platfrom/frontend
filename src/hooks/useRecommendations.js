// src/hooks/useRecommendations.js
import { useCallback } from 'react';
import FirestoreService from '../services';
import { handleFirebaseOperation, getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

export const useRecommendations = (
    recommendationsSlice,
    authSlice,
    suitesSlice,
    uiSlice
) => {
    const createRecommendation = useCallback(async (recommendationData) => {
        if (!authSlice.state.currentUser?.uid) {
            uiSlice.actions.showNotification({
                id: 'create-recommendation-no-auth',
                type: 'error',
                message: 'You must be logged in to create recommendations',
                duration: 3000
            });
            return { success: false, error: { message: 'Authentication required' } };
        }

        if (!suitesSlice.state.activeSuite?.id) {
            uiSlice.actions.showNotification({
                id: 'create-recommendation-no-suite',
                type: 'error',
                message: 'No active test suite selected',
                duration: 3000
            });
            return { success: false, error: { message: 'No active suite' } };
        }

        recommendationsSlice.actions.loadRecommendationsStart();

        try {
            const result = await handleFirebaseOperation(
                () => FirestoreService.createRecommendation(
                    suitesSlice.state.activeSuite.id,
                    {
                        ...recommendationData,
                        created_by: authSlice.state.currentUser.uid,
                        upvotes: 0,
                        downvotes: 0,
                        userVotes: {},
                        comments: []
                    }
                ),
                'Create recommendation'
            );

            if (result.success) {
                recommendationsSlice.actions.addRecommendation(result.data);
                uiSlice.actions.showNotification({
                    id: 'create-recommendation-success',
                    type: 'success',
                    message: 'Recommendation created successfully',
                    duration: 3000
                });
            } else {
                recommendationsSlice.actions.loadRecommendationsFailed(result.error);
                uiSlice.actions.showNotification({
                    id: 'create-recommendation-error',
                    type: 'error',
                    message: result.error.message,
                    duration: 5000
                });
            }

            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            recommendationsSlice.actions.loadRecommendationsFailed({ message: errorMessage });
            uiSlice.actions.showNotification({
                id: 'create-recommendation-error',
                type: 'error',
                message: errorMessage,
                duration: 5000
            });
            return { success: false, error: { message: errorMessage } };
        }
    }, [recommendationsSlice, authSlice, suitesSlice, uiSlice]);

    const updateRecommendation = useCallback(async (recommendationData) => {
        if (!authSlice.state.currentUser?.uid) {
            uiSlice.actions.showNotification({
                id: 'update-recommendation-no-auth',
                type: 'error',
                message: 'You must be logged in to update recommendations',
                duration: 3000
            });
            return { success: false, error: { message: 'Authentication required' } };
        }

        if (!suitesSlice.state.activeSuite?.id) {
            uiSlice.actions.showNotification({
                id: 'update-recommendation-no-suite',
                type: 'error',
                message: 'No active test suite selected',
                duration: 3000
            });
            return { success: false, error: { message: 'No active suite' } };
        }

        try {
            const result = await handleFirebaseOperation(
                () => FirestoreService.updateRecommendation(
                    recommendationData.id,
                    {
                        ...recommendationData,
                        updated_by: authSlice.state.currentUser.uid
                    },
                    suitesSlice.state.activeSuite.id
                ),
                'Update recommendation'
            );

            if (result.success) {
                recommendationsSlice.actions.updateRecommendation(result.data);
                uiSlice.actions.showNotification({
                    id: 'update-recommendation-success',
                    type: 'success',
                    message: 'Recommendation updated successfully',
                    duration: 3000
                });
            } else {
                uiSlice.actions.showNotification({
                    id: 'update-recommendation-error',
                    type: 'error',
                    message: result.error.message,
                    duration: 5000
                });
            }

            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            uiSlice.actions.showNotification({
                id: 'update-recommendation-error',
                type: 'error',
                message: errorMessage,
                duration: 5000
            });
            return { success: false, error: { message: errorMessage } };
        }
    }, [recommendationsSlice, authSlice, suitesSlice, uiSlice]);

    const deleteRecommendation = useCallback(async (recommendationId) => {
        if (!authSlice.state.currentUser?.uid) {
            uiSlice.actions.showNotification({
                id: 'delete-recommendation-no-auth',
                type: 'error',
                message: 'You must be logged in to delete recommendations',
                duration: 3000
            });
            return { success: false, error: { message: 'Authentication required' } };
        }

        if (!suitesSlice.state.activeSuite?.id) {
            uiSlice.actions.showNotification({
                id: 'delete-recommendation-no-suite',
                type: 'error',
                message: 'No active test suite selected',
                duration: 3000
            });
            return { success: false, error: { message: 'No active suite' } };
        }

        try {
            const result = await handleFirebaseOperation(
                () => FirestoreService.deleteRecommendation(
                    recommendationId,
                    suitesSlice.state.activeSuite.id
                ),
                'Delete recommendation'
            );

            if (result.success) {
                recommendationsSlice.actions.removeRecommendation(recommendationId);
                uiSlice.actions.showNotification({
                    id: 'delete-recommendation-success',
                    type: 'success',
                    message: 'Recommendation deleted successfully',
                    duration: 3000
                });
            } else {
                uiSlice.actions.showNotification({
                    id: 'delete-recommendation-error',
                    type: 'error',
                    message: result.error.message,
                    duration: 5000
                });
            }

            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            uiSlice.actions.showNotification({
                id: 'delete-recommendation-error',
                type: 'error',
                message: errorMessage,
                duration: 5000
            });
            return { success: false, error: { message: errorMessage } };
        }
    }, [recommendationsSlice, authSlice, suitesSlice, uiSlice]);

    const voteOnRecommendation = useCallback(async (recommendationId, voteType) => {
        if (!authSlice.state.currentUser?.uid) {
            uiSlice.actions.showNotification({
                id: 'vote-recommendation-no-auth',
                type: 'error',
                message: 'You must be logged in to vote',
                duration: 3000
            });
            return { success: false, error: { message: 'Authentication required' } };
        }

        try {
            // Find the current recommendation
            const recommendation = recommendationsSlice.state.recommendations.find(r => r.id === recommendationId);
            if (!recommendation) {
                throw new Error('Recommendation not found');
            }

            const userId = authSlice.state.currentUser.uid;
            const userVotes = recommendation.userVotes || {};
            const currentVote = userVotes[userId];

            let newUpvotes = recommendation.upvotes || 0;
            let newDownvotes = recommendation.downvotes || 0;
            const newUserVotes = { ...userVotes };

            // Handle vote logic
            if (voteType === 'up') {
                if (currentVote === 'up') {
                    // Remove upvote
                    newUpvotes = Math.max(0, newUpvotes - 1);
                    delete newUserVotes[userId];
                } else {
                    // Add upvote (and remove downvote if exists)
                    if (currentVote === 'down') {
                        newDownvotes = Math.max(0, newDownvotes - 1);
                    }
                    newUpvotes += 1;
                    newUserVotes[userId] = 'up';
                }
            } else if (voteType === 'down') {
                if (currentVote === 'down') {
                    // Remove downvote
                    newDownvotes = Math.max(0, newDownvotes - 1);
                    delete newUserVotes[userId];
                } else {
                    // Add downvote (and remove upvote if exists)
                    if (currentVote === 'up') {
                        newUpvotes = Math.max(0, newUpvotes - 1);
                    }
                    newDownvotes += 1;
                    newUserVotes[userId] = 'down';
                }
            }

            // Update the recommendation in Firestore
            const result = await handleFirebaseOperation(
                () => FirestoreService.updateRecommendation(
                    recommendationId,
                    {
                        upvotes: newUpvotes,
                        downvotes: newDownvotes,
                        userVotes: newUserVotes
                    },
                    suitesSlice.state.activeSuite.id
                ),
                'Vote on recommendation'
            );

            if (result.success) {
                recommendationsSlice.actions.updateRecommendationVotes({
                    recommendationId,
                    upvotes: newUpvotes,
                    downvotes: newDownvotes,
                    userVotes: newUserVotes
                });
            } else {
                uiSlice.actions.showNotification({
                    id: 'vote-recommendation-error',
                    type: 'error',
                    message: result.error.message,
                    duration: 3000
                });
            }

            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            uiSlice.actions.showNotification({
                id: 'vote-recommendation-error',
                type: 'error',
                message: errorMessage,
                duration: 3000
            });
            return { success: false, error: { message: errorMessage } };
        }
    }, [recommendationsSlice, authSlice, suitesSlice, uiSlice]);

    // Filter and UI actions - direct delegation to slice
    const setFilters = useCallback((newFilters) => {
        recommendationsSlice.actions.setFilters(newFilters);
    }, [recommendationsSlice]);

    const setSortConfig = useCallback((sortConfig) => {
        recommendationsSlice.actions.setSortConfig(sortConfig);
    }, [recommendationsSlice]);

    const setViewMode = useCallback((viewMode) => {
        recommendationsSlice.actions.setViewMode(viewMode);
    }, [recommendationsSlice]);

    const openModal = useCallback((recommendation) => {
        recommendationsSlice.actions.openModal(recommendation);
    }, [recommendationsSlice]);

    const closeModal = useCallback(() => {
        recommendationsSlice.actions.closeModal();
    }, [recommendationsSlice]);

    const resetFilters = useCallback(() => {
        recommendationsSlice.actions.resetFilters();
    }, [recommendationsSlice]);

    const addComment = useCallback(async (recommendationId, comment) => {
        // Placeholder for comment functionality
        return { success: true };
    }, []);

    const removeComment = useCallback(async (recommendationId, commentId) => {
        // Placeholder for comment functionality
        return { success: true };
    }, []);

    const cleanup = useCallback(() => {
        recommendationsSlice.actions.clearRecommendations();
    }, [recommendationsSlice]);

    return {
        createRecommendation,
        updateRecommendation,
        deleteRecommendation,
        voteOnRecommendation,
        addComment,
        removeComment,
        setFilters,
        setSortConfig,
        setViewMode,
        openModal,
        closeModal,
        resetFilters,
        cleanup
    };
};