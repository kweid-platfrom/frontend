
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
            
            try {
                const userId = firestoreService.getCurrentUserId();
                if (!userId) {
                    console.warn('Cannot generate path: no authenticated user');
                    return '';
                }

                let path;
                if (validAccountType === 'individual') {
                    path = `individualAccounts/${userId}/testSuites/${activeSuiteId}/${collectionName}`;
                } else if (validAccountType === 'organization') {
                    if (!validOrgId) {
                        console.warn('Cannot generate path: organization account missing orgId', {
                            validAccountType,
                            activeSuiteId,
                            validOrgId,
                        });
                        return '';
                    }
                    path = `organizations/${validOrgId}/testSuites/${activeSuiteId}/${collectionName}`;
                } else {
                    // For suite-level collections (most common case based on FirestoreService)
                    path = `testSuites/${activeSuiteId}/${collectionName}`;
                }
                
                console.log('Generated collection path:', path);
                return path;
            } catch (error) {
                console.error('Error generating collection path:', error);
                handleError(error, 'getCollectionPath');
                return '';
            }
        },
        [validAccountType, activeSuiteId, validOrgId, handleError]
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
                const errorMsg = `No valid path for ${name} subscription`;
                handleError(new Error(errorMsg), `${name} subscription`);
                return false;
            }
            
            if (typeof setter !== 'function') {
                console.error(`Setter for ${name} is not a function:`, setter);
                const errorMsg = `Setter for ${name} is not a function`;
                handleError(new Error(errorMsg), `${name} subscription`);
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
                        
                        // Process documents to handle Firestore timestamps consistently with FirestoreService
                        const processedData = documents.map((doc) => ({
                            id: doc.id,
                            ...doc,
                            // Handle Firestore timestamps - check if they have toDate method
                            created_at: doc.created_at?.toDate ? doc.created_at.toDate() : 
                                       (doc.created_at instanceof Date ? doc.created_at : new Date()),
                            updated_at: doc.updated_at?.toDate ? doc.updated_at.toDate() : 
                                       (doc.updated_at instanceof Date ? doc.updated_at : new Date()),
                        }));
                        
                        const finalData = transformData ? transformData(processedData) : processedData;
                        setter(finalData);
                    },
                    (errorResponse) => {
                        if (!isMounted.current) return;
                        console.error(`Error subscribing to ${name}:`, errorResponse);
                        
                        // Handle error response format from FirestoreService
                        const errorMessage = errorResponse?.error?.message || 
                                           errorResponse?.message || 
                                           `Error subscribing to ${name}`;
                        handleError(new Error(errorMessage), `${name} sync`);
                    }
                );

                if (unsubscribe) {
                    console.log(`Subscription active for ${name}`);
                    unsubscribes.current.push(unsubscribe);
                    return true;
                } else {
                    console.error(`Failed to create subscription for ${name}`);
                    return false;
                }
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

        if (!isAuthenticated || !activeSuiteId || !validAccountType) {
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

        // For organization account type, orgId is required
        if (validAccountType === 'organization' && !validOrgId) {
            console.warn('Organization account type requires orgId');
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

            // Check suite access if checkSuiteAccess is available
            if (checkSuiteAccess) {
                const hasAccess = await checkSuiteAccess(activeSuiteId);
                if (!hasAccess) {
                    throw new Error('Access denied for suite');
                }
            }

            // Clean up existing subscriptions before creating new ones
            cleanupSubscriptions();

            // Define collection subscriptions aligned with FirestoreService structure
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
                    constraints: [
                        where('suite_id', '==', activeSuiteId), 
                        orderBy('created_at', 'desc')
                    ],
                    setter: setRelationships,
                    transformData: (data) => {
                        const relationshipsData = {
                            testCaseToBugs: {},
                            bugToRecordings: {},
                            requirementToTestCases: {},
                        };
                        
                        data.forEach((doc) => {
                            try {
                                if (doc.type === 'testCase_bug' && doc.testCaseId) {
                                    relationshipsData.testCaseToBugs[doc.testCaseId] = doc.bugIds || [];
                                } else if (doc.type === 'bug_recording' && doc.bugId) {
                                    relationshipsData.bugToRecordings[doc.bugId] = doc.recordingIds || [];
                                } else if (doc.type === 'requirement_testCase' && doc.requirementId) {
                                    relationshipsData.requirementToTestCases[doc.requirementId] = doc.testCaseIds || [];
                                }
                            } catch (error) {
                                console.warn('Error processing relationship document:', doc, error);
                            }
                        });
                        
                        return relationshipsData;
                    },
                },
            ];

            // Subscribe to each collection
            let successCount = 0;
            collections.forEach((config) => {
                if (subscribeToCollection(config)) {
                    successCount++;
                }
            });

            // Only mark as initialized if at least some subscriptions succeeded
            if (successCount > 0) {
                setIsInitialized(true);
                console.log(`Successfully initialized ${successCount}/${collections.length} subscriptions`);
            } else {
                throw new Error('Failed to initialize any subscriptions');
            }

        } catch (error) {
            console.error('Error initializing subscriptions:', error);
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
        subscribeToCollection,
        setTestCases,
        setBugs,
        setRecordings,
        setRelationships,
        handleError,
        setIsLoading,
        setIsInitialized,
    ]);

    useEffect(() => {
        // Set mounted flag
        isMounted.current = true;

        // Check if we have the minimum required parameters
        if (!isAuthenticated || !activeSuiteId || !validAccountType) {
            console.log('Invalid context, resetting state');
            resetState();
            cleanupSubscriptions();
            return;
        }

        // For organization accounts, orgId is required
        if (validAccountType === 'organization' && !validOrgId) {
            console.log('Organization account requires orgId, resetting state');
            resetState();
            cleanupSubscriptions();
            return;
        }

        // Handle suite ID changes
        if (previousSuiteId.current !== activeSuiteId) {
            console.log('Suite ID changed:', { 
                previous: previousSuiteId.current, 
                current: activeSuiteId 
            });
            resetState();
            cleanupSubscriptions();
            initializeSubscriptions();
            previousSuiteId.current = activeSuiteId;
        } else {
            // Suite ID hasn't changed, but other dependencies might have
            initializeSubscriptions();
        }

        // Cleanup function
        return () => {
            isMounted.current = false;
            cleanupSubscriptions();
        };
    }, [
        isAuthenticated, 
        activeSuiteId, 
        validAccountType, 
        validOrgId, 
        initializeSubscriptions, 
        resetState, 
        cleanupSubscriptions
    ]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupSubscriptions();
        };
    }, [cleanupSubscriptions]);
};