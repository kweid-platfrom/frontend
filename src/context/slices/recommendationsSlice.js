// src/slices/recommendationsSlice.js
import { useState, useCallback } from 'react';

export const useRecommendations = () => {
    const [state, setState] = useState({
        recommendations: [],
        loading: false,
        error: null,
        filters: {
            search: '',
            status: 'all',
            priority: 'all',
            category: 'all',
            impact: 'all',
            effort: 'all'
        },
        sortConfig: {
            key: 'created_at',
            direction: 'desc'
        },
        viewMode: 'cards',
        isModalOpen: false,
        selectedRecommendation: null
    });

    const actions = {
        // Loading states
        loadRecommendationsStart: useCallback(() => {
            setState(prev => ({
                ...prev,
                loading: true,
                error: null
            }));
        }, []),

        loadRecommendationsSuccess: useCallback((recommendations) => {
            setState(prev => ({
                ...prev,
                loading: false,
                recommendations: recommendations || [],
                error: null
            }));
        }, []),

        loadRecommendationsFailed: useCallback((error) => {
            setState(prev => ({
                ...prev,
                loading: false,
                error
            }));
        }, []),

        // CRUD operations
        addRecommendation: useCallback((recommendation) => {
            setState(prev => ({
                ...prev,
                recommendations: [recommendation, ...prev.recommendations]
            }));
        }, []),

        updateRecommendation: useCallback((updatedRecommendation) => {
            setState(prev => ({
                ...prev,
                recommendations: prev.recommendations.map(r => 
                    r.id === updatedRecommendation.id 
                        ? { ...r, ...updatedRecommendation }
                        : r
                )
            }));
        }, []),

        removeRecommendation: useCallback((recommendationId) => {
            setState(prev => ({
                ...prev,
                recommendations: prev.recommendations.filter(r => r.id !== recommendationId)
            }));
        }, []),

        // Voting
        updateRecommendationVotes: useCallback(({ recommendationId, upvotes, downvotes, userVotes }) => {
            setState(prev => ({
                ...prev,
                recommendations: prev.recommendations.map(r => 
                    r.id === recommendationId 
                        ? { ...r, upvotes, downvotes, userVotes }
                        : r
                )
            }));
        }, []),

        // Filters and UI
        setFilters: useCallback((newFilters) => {
            setState(prev => ({
                ...prev,
                filters: { ...prev.filters, ...newFilters }
            }));
        }, []),

        setSortConfig: useCallback((sortConfig) => {
            setState(prev => ({
                ...prev,
                sortConfig
            }));
        }, []),

        setViewMode: useCallback((viewMode) => {
            setState(prev => ({
                ...prev,
                viewMode
            }));
        }, []),

        resetFilters: useCallback(() => {
            setState(prev => ({
                ...prev,
                filters: {
                    search: '',
                    status: 'all',
                    priority: 'all',
                    category: 'all',
                    impact: 'all',
                    effort: 'all'
                }
            }));
        }, []),

        // Modal management
        openModal: useCallback((recommendation) => {
            setState(prev => ({
                ...prev,
                isModalOpen: true,
                selectedRecommendation: recommendation
            }));
        }, []),

        closeModal: useCallback(() => {
            setState(prev => ({
                ...prev,
                isModalOpen: false,
                selectedRecommendation: null
            }));
        }, []),

        // Clear state
        clearRecommendations: useCallback(() => {
            setState({
                recommendations: [],
                loading: false,
                error: null,
                filters: {
                    search: '',
                    status: 'all',
                    priority: 'all',
                    category: 'all',
                    impact: 'all',
                    effort: 'all'
                },
                sortConfig: {
                    key: 'created_at',
                    direction: 'desc'
                },
                viewMode: 'cards',
                isModalOpen: false,
                selectedRecommendation: null
            });
        }, [])
    };

    return { state, actions };
};