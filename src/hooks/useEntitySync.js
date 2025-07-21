// hooks/useEntitySync.js
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useCallback } from 'react';
import { where, orderBy } from 'firebase/firestore';
import firestoreService from '../services/firestoreService';
import { useSubscription } from '../contexts/subscriptionContext';

export const useEntitySync = (
    isAuthenticated,
    activeSuiteId,
    orgId,
    accountType,
    setTestCases,
    setBugs,
    setRecordings,
    setRelationships,
    handleError,
    setIsLoading,
    setIsInitialized
) => {
    const { checkSuiteAccess } = useSubscription();
    const isMounted = useRef(true);
    const unsubscribes = useRef([]);
    const previousSuiteId = useRef(null);
    const initializationInProgress = useRef(false);

    const validOrgId = typeof orgId === 'function' ? orgId() : orgId;
    const validAccountType = typeof accountType === 'function' ? accountType() : accountType;

    console.log('useEntitySync Params:', {
        isAuthenticated,
        activeSuiteId,
        orgId: validOrgId,
        accountType: validAccountType,
        hasCheckSuiteAccess: !!checkSuiteAccess,
    });

    const getCollectionPath = useCallback(
        (collectionName) => {
            if (!validAccountType || !activeSuiteId) {
                console.warn('Cannot generate path: invalid context', {
                    validAccountType,
                    activeSuiteId,
                    validOrgId,
                });
                return '';
            }

            // For individual accounts, orgId can be null - that's expected
            if (validAccountType === 'organization' && !validOrgId) {
                console.warn('Cannot generate path: organization account missing orgId', {
                    validAccountType,
                    activeSuiteId,
                    validOrgId,
                });
                return '';
            }

            const path =
                validAccountType === 'individual'
                    ? `individualAccounts/${firestoreService.getCurrentUserId()}/testSuites/${activeSuiteId}/${collectionName}`
                    : `organizations/${validOrgId}/testSuites/${activeSuiteId}/${collectionName}`;

            console.log('Generated collection path:', path);
            return path;
        },
        [validAccountType, activeSuiteId, validOrgId]
    );

    const resetState = useCallback(() => {
        console.log('Resetting entity state');
        setTestCases([]);
        setBugs([]);
        setRecordings([]);
        setRelationships({
            testCaseToBugs: {},
            bugToRecordings: {},
            requirementToTestCases: {},
        });
        setIsLoading(false);
        setIsInitialized(false);
    }, [setTestCases, setBugs, setRecordings, setRelationships, setIsLoading, setIsInitialized]);

    const cleanupSubscriptions = useCallback(() => {
        console.log('Cleaning up subscriptions:', unsubscribes.current.length);
        unsubscribes.current.forEach((unsub) => {
            try {
                if (unsub && typeof unsub === 'function') unsub();
            } catch (error) {
                console.warn('Error during subscription cleanup:', error);
            }
        });
        unsubscribes.current = [];
        initializationInProgress.current = false;
    }, []);

    const subscribeToCollection = useCallback(
        (collectionConfig) => {
            const { name, path, constraints, setter, transformData } = collectionConfig;
            if (!path) {
                console.error(`No valid path for ${name} subscription`);
                return false;
            }
            if (typeof setter !== 'function') {
                console.error(`Setter for ${name} is not a function:`, setter);
                return false;
            }

            console.log(`Subscribing to ${name} at path:`, path, 'with constraints:', constraints);

            try {
                const unsubscribe = firestoreService.subscribeToCollection(
                    path,
                    constraints,
                    (documents) => {
                        if (!isMounted.current) return;
                        console.log(`Received ${documents.length} ${name} documents:`, documents);
                        const data = documents.map((doc) => ({
                            id: doc.id,
                            ...doc,
                            created_at: doc.created_at?.toDate ? doc.created_at.toDate() : new Date(),
                            updated_at: doc.updated_at?.toDate ? doc.updated_at.toDate() : new Date(),
                        }));
                        setter(transformData ? transformData(data) : data);
                    },
                    (error) => {
                        if (!isMounted.current) return;
                        console.error(`Error subscribing to ${name}:`, error);
                        handleError(error, `${name} sync`);
                    }
                );

                if (unsubscribe) {
                    console.log(`Subscription active for ${name}`);
                    unsubscribes.current.push(unsubscribe);
                    return true;
                }
                return false;
            } catch (error) {
                console.error(`Error setting up subscription for ${name}:`, error);
                handleError(error, `${name} subscription setup`);
                return false;
            }
        },
        [handleError]
    );

    const initializeSubscriptions = useCallback(async () => {
        if (initializationInProgress.current) {
            console.log('Initialization already in progress, skipping');
            return;
        }

        if (!isAuthenticated || !activeSuiteId || !validAccountType || !validOrgId) {
            console.warn('Skipping subscriptions due to invalid parameters:', {
                isAuthenticated,
                activeSuiteId,
                validAccountType,
                validOrgId,
            });
            resetState();
            cleanupSubscriptions();
            return;
        }

        initializationInProgress.current = true;
        setIsLoading(true);

        try {
            const userId = firestoreService.getCurrentUserId();
            if (!userId) {
                throw new Error('No user ID available');
            }

            const hasAccess = await checkSuiteAccess(activeSuiteId);
            if (!hasAccess) {
                throw new Error('Access denied for suite');
            }

            cleanupSubscriptions();

            const collections = [
                {
                    name: 'testCases',
                    path: getCollectionPath('testCases'),
                    constraints: [orderBy('created_at', 'desc')],
                    setter: setTestCases,
                    transformData: null,
                },
                {
                    name: 'bugs',
                    path: getCollectionPath('bugs'),
                    constraints: [orderBy('created_at', 'desc')],
                    setter: setBugs,
                    transformData: null,
                },
                {
                    name: 'recordings',
                    path: getCollectionPath('recordings'),
                    constraints: [orderBy('created_at', 'desc')],
                    setter: setRecordings,
                    transformData: null,
                },
                {
                    name: 'relationships',
                    path: getCollectionPath('relationships'),
                    constraints: [where('suiteId', '==', activeSuiteId), orderBy('created_at', 'desc')],
                    setter: setRelationships,
                    transformData: (data) => {
                        const relationshipsData = {
                            testCaseToBugs: {},
                            bugToRecordings: {},
                            requirementToTestCases: {},
                        };
                        data.forEach((doc) => {
                            if (doc.type === 'testCase_bug') {
                                relationshipsData.testCaseToBugs[doc.testCaseId] = doc.bugIds || [];
                            } else if (doc.type === 'bug_recording') {
                                relationshipsData.bugToRecordings[doc.bugId] = doc.recordingIds || [];
                            } else if (doc.type === 'requirement_testCase') {
                                relationshipsData.requirementToTestCases[doc.requirementId] = doc.testCaseIds || [];
                            }
                        });
                        return relationshipsData;
                    },
                },
            ];

            collections.forEach((config) => subscribeToCollection(config));
            setIsInitialized(true);
        } catch (error) {
            handleError(error, 'initialize subscriptions');
            resetState();
            cleanupSubscriptions();
        } finally {
            setIsLoading(false);
            initializationInProgress.current = false;
        }
    }, [
        isAuthenticated,
        activeSuiteId,
        validOrgId,
        validAccountType,
        checkSuiteAccess,
        getCollectionPath,
        resetState,
        cleanupSubscriptions,
        setTestCases,
        setBugs,
        setRecordings,
        setRelationships,
        handleError,
        setIsLoading,
        setIsInitialized,
    ]);

    useEffect(() => {
        if (!isAuthenticated || !activeSuiteId || !validAccountType || !validOrgId) {
            console.log('Invalid context, resetting state');
            resetState();
            cleanupSubscriptions();
            return;
        }

        if (previousSuiteId.current !== activeSuiteId) {
            console.log('Suite ID changed:', { previous: previousSuiteId.current, current: activeSuiteId });
            resetState();
            cleanupSubscriptions();
            initializeSubscriptions();
            previousSuiteId.current = activeSuiteId;
        } else {
            initializeSubscriptions();
        }

        return () => {
            isMounted.current = false;
            cleanupSubscriptions();
        };
    }, [isAuthenticated, activeSuiteId, validAccountType, validOrgId, initializeSubscriptions, resetState, cleanupSubscriptions]);
};