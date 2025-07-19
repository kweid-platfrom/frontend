import { useEffect, useRef } from 'react';
import { where, orderBy } from 'firebase/firestore';
import firestoreService from '../services/firestoreService';
import { useSubscription } from '../contexts/subscriptionContext';

export const useEntitySync = (
    isAuthenticated,
    activeSuiteId,
    setTestCases,
    setBugs,
    setRecordings,
    setRelationships,
    handleError
) => {
    const { checkSuiteAccess } = useSubscription();
    const isMounted = useRef(true);

    useEffect(() => {
        if (!isMounted.current) return;

        console.log('useEntitySync: Running with inputs', { isAuthenticated, activeSuiteId });

        // Reset state
        setTestCases([]);
        setBugs([]);
        setRecordings([]);
        setRelationships({
            testCaseToBugs: {},
            bugToRecordings: {},
            requirementToTestCases: {},
        });

        if (!isAuthenticated || !activeSuiteId || typeof activeSuiteId !== 'string') {
            console.warn('useEntitySync: Invalid inputs', { isAuthenticated, activeSuiteId });
            firestoreService.unsubscribeAll();
            handleError({ message: `Invalid inputs: isAuthenticated=${isAuthenticated}, activeSuiteId=${activeSuiteId}` }, 'entity sync initialization');
            return;
        }

        let unsubscribes = [];

        const initializeSubscriptions = async () => {
            try {
                const userId = firestoreService.getCurrentUserId();
                if (!userId) {
                    handleError({ message: 'No user ID available' }, 'suite access check');
                    return;
                }

                console.log('useEntitySync: Checking suite access', { userId, activeSuiteId });
                const hasSuiteAccess = await checkSuiteAccess(userId, activeSuiteId);
                console.log('useEntitySync: Suite access result', { hasSuiteAccess });

                if (!hasSuiteAccess) {
                    console.warn('useEntitySync: User does not have access to suite', { userId, activeSuiteId });
                    handleError({ message: 'User does not have access to this suite' }, 'suite access check');
                    return;
                }

                console.log('useEntitySync: Subscribing to suite assets for:', activeSuiteId);

                // Subscribe to collections
                const collections = [
                    { name: 'testCases', setter: setTestCases },
                    { name: 'bugs', setter: setBugs },
                    { name: 'recordings', setter: setRecordings },
                ];

                collections.forEach(({ name, setter }) => {
                    const unsubscribe = firestoreService.subscribeToSuiteAssets(
                        activeSuiteId,
                        name,
                        (data) => {
                            if (isMounted.current) {
                                console.log(`useEntitySync: Updated ${name} for suite ${activeSuiteId}`, data);
                                setter(data || []);
                            }
                        },
                        (error) => {
                            if (isMounted.current) {
                                console.error(`useEntitySync: Error syncing ${name}`, error);
                                handleError(error, `${name} sync`);
                            }
                        }
                    );
                    unsubscribes.push(unsubscribe);
                });

                // Subscribe to relationships
                const unsubscribeRelationships = firestoreService.subscribeToCollection(
                    'relationships',
                    [where('suiteId', '==', activeSuiteId), orderBy('created_at', 'desc')],
                    (data) => {
                        if (!isMounted.current) return;
                        console.log('useEntitySync: Updated relationships for suite', activeSuiteId, data);
                        const newRelationships = {
                            testCaseToBugs: {},
                            bugToRecordings: {},
                            requirementToTestCases: {},
                        };
                        data.forEach(({ sourceType, sourceId, targetType, targetId }) => {
                            const key = `${sourceType}To${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`;
                            newRelationships[key][sourceId] = [
                                ...(newRelationships[key][sourceId] || []),
                                targetId,
                            ];
                        });
                        setRelationships(newRelationships);
                    },
                    (error) => {
                        if (isMounted.current) {
                            console.error('useEntitySync: Error syncing relationships', error);
                            handleError(error, 'relationships sync');
                        }
                    }
                );
                unsubscribes.push(unsubscribeRelationships);
            } catch (error) {
                if (isMounted.current) {
                    console.error('useEntitySync: Error initializing subscriptions', error);
                    handleError(error, 'subscription initialization');
                    setTestCases([]);
                    setBugs([]);
                    setRecordings([]);
                    setRelationships({
                        testCaseToBugs: {},
                        bugToRecordings: {},
                        requirementToTestCases: {},
                    });
                }
            }
        };

        initializeSubscriptions();

        return () => {
            console.log('useEntitySync: Cleaning up subscriptions for suite', activeSuiteId);
            isMounted.current = false;
            unsubscribes.forEach((unsub) => unsub && typeof unsub === 'function' && unsub());
            unsubscribes = [];
            firestoreService.unsubscribeAll();
            setTestCases([]);
            setBugs([]);
            setRecordings([]);
            setRelationships({
                testCaseToBugs: {},
                bugToRecordings: {},
                requirementToTestCases: {},
            });
        };
    }, [isAuthenticated, activeSuiteId, setTestCases, setBugs, setRecordings, setRelationships, handleError, checkSuiteAccess]);

    return null;
};

export default useEntitySync;