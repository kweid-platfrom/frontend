// hooks/useRelationships.js
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppProvider';
import bugTrackingService from '@/services/bugTrackingService';

export const useRelationships = (suiteId) => {
    const { addNotification, activeSuite, user } = useApp();
    const [relationships, setRelationships] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!suiteId || !activeSuite || !user) {
            setRelationships({});
            setError('Suite ID, active suite, or user is required');
            addNotification({
                id: `relationships-no-suite-${Date.now()}`,
                type: 'error',
                title: 'Relationships Error',
                message: 'Suite ID, active suite, or user is required',
                persistent: true,
            });
            return;
        }

        setLoading(true);

        // Subscribe to bugs for real-time updates
        const unsubscribe = bugTrackingService.subscribeToBugs(
            activeSuite,
            user,
            (bugs) => {
                const relationsMap = {};
                bugs.forEach(bug => {
                    relationsMap[bug.id] = bug.linkedTestCases || [];
                });
                setRelationships(relationsMap);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error('useRelationships error:', {
                    suiteId,
                    errorCode: err.code,
                    errorMessage: err.message,
                });
                setError(err.message || 'Failed to fetch relationships');
                setLoading(false);
                addNotification({
                    id: `relationships-error-${Date.now()}`,
                    type: 'error',
                    title: 'Relationships Error',
                    message: err.message || 'Failed to fetch relationships',
                    persistent: true,
                });
            }
        );

        // Initial fetch
        const fetchBugs = async () => {
            try {
                const bugs = await bugTrackingService.fetchBugs(activeSuite, user);
                const relationsMap = {};
                bugs.forEach(bug => {
                    relationsMap[bug.id] = bug.linkedTestCases || [];
                });
                setRelationships(relationsMap);
                setError(null);
            } catch (err) {
                setError(err.message || 'Failed to fetch relationships');
                addNotification({
                    id: `relationships-initial-error-${Date.now()}`,
                    type: 'error',
                    title: 'Relationships Error',
                    message: err.message || 'Failed to fetch relationships',
                    persistent: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchBugs();

        return () => unsubscribe && unsubscribe();
    }, [suiteId, activeSuite, user, addNotification]);

    return { relationships, loading, error };
};