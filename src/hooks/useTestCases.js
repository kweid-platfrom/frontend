// hooks/useTestCases.js
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppProvider';
import testCaseService from '@/services/testCaseService';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const useTestCases = (suiteId) => {
    const { addNotification } = useApp();
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!suiteId) {
            setTestCases([]);
            setError('Suite ID is required');
            addNotification({
                id: `test-cases-no-suite-${Date.now()}`,
                type: 'error',
                title: 'Test Cases Error',
                message: 'Suite ID is required',
                persistent: true,
            });
            return;
        }

        setLoading(true);

        // Real-time subscription
        const collectionPath = `testSuites/${suiteId}/testCases`;
        const unsubscribe = onSnapshot(
            collection(db, collectionPath),
            (snapshot) => {
                const testCasesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate(),
                    updated_at: doc.data().updated_at?.toDate(),
                    lastExecuted: doc.data().lastExecuted?.toDate(),
                }));
                setTestCases(testCasesData);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error('useTestCases error:', {
                    suiteId,
                    errorCode: err.code,
                    errorMessage: err.message,
                });
                setError(err.message || 'Failed to fetch test cases');
                setLoading(false);
                addNotification({
                    id: `test-cases-error-${Date.now()}`,
                    type: 'error',
                    title: 'Test Cases Error',
                    message: err.message || 'Failed to fetch test cases',
                    persistent: true,
                });
            }
        );

        // Initial fetch
        const fetchTestCases = async () => {
            try {
                const result = await testCaseService.getTestCases(suiteId);
                if (result.success) {
                    setTestCases(result.data.map(tc => ({
                        ...tc,
                        created_at: tc.created_at?.toDate(),
                        updated_at: tc.updated_at?.toDate(),
                        lastExecuted: tc.lastExecuted?.toDate(),
                    })));
                    setError(null);
                } else {
                    setError(result.error.message);
                    addNotification({
                        id: `test-cases-initial-error-${Date.now()}`,
                        type: 'error',
                        title: 'Test Cases Error',
                        message: result.error.message,
                        persistent: true,
                    });
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch test cases');
                addNotification({
                    id: `test-cases-initial-error-${Date.now()}`,
                    type: 'error',
                    title: 'Test Cases Error',
                    message: err.message || 'Failed to fetch test cases',
                    persistent: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTestCases();

        return () => unsubscribe();
    }, [suiteId, addNotification]);

    return { testCases, loading, error };
};