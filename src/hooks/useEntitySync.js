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
    handleError
) => {
    const { checkSuiteAccess } = useSubscription();
    const isMounted = useRef(true);
    const unsubscribes = useRef([]);
    const previousSuiteId = useRef(null);
    const accessCheckCache = useRef({});
    const initializationInProgress = useRef(false);

    // Add validation for orgId and accountType
    const validOrgId = typeof orgId === 'function' ? orgId() : orgId;
    const validAccountType = typeof accountType === 'function' ? accountType() : accountType;

    console.log('🔧 Parameter validation:', {
        orgIdType: typeof orgId,
        orgIdValue: validOrgId,
        accountTypeType: typeof accountType,
        accountTypeValue: validAccountType
    });

    const getCollectionPath = useCallback((collectionName) => {
        if (validAccountType === 'individual') {
            return `individualAccounts/${firestoreService.getCurrentUserId()}/testSuites/${activeSuiteId}/${collectionName}`;
        }
        return `organizations/${validOrgId}/testSuites/${activeSuiteId}/${collectionName}`;
    }, [validAccountType, activeSuiteId, validOrgId]);

    const resetState = useCallback(() => {
        console.log('Resetting state for all entities');
        
        if (typeof setTestCases === 'function') {
            setTestCases([]);
        }
        if (typeof setBugs === 'function') {
            setBugs([]);
        }
        if (typeof setRecordings === 'function') {
            setRecordings([]);
        }
        if (typeof setRelationships === 'function') {
            setRelationships({ 
                testCaseToBugs: {}, 
                bugToRecordings: {}, 
                requirementToTestCases: {} 
            });
        }
    }, [setTestCases, setBugs, setRecordings, setRelationships]);

    const cleanupSubscriptions = useCallback(() => {
        console.log('Cleaning up subscriptions');
        unsubscribes.current.forEach((unsub) => {
            try {
                if (unsub && typeof unsub === 'function') {
                    unsub();
                }
            } catch (error) {
                console.warn('Error during subscription cleanup:', error);
            }
        });
        unsubscribes.current = [];
        initializationInProgress.current = false;
    }, []);

    const subscribeToCollection = useCallback((collectionConfig) => {
        const { name, path, constraints, setter, transformData } = collectionConfig;
        
        if (typeof setter !== 'function') {
            console.error(`Setter for ${name} is not a function:`, setter);
            return false;
        }
        
        try {
            console.log(`Subscribing to ${path}`);
            
            const unsubscribe = firestoreService.subscribeToCollection(
                path,
                constraints,
                (snapshot) => {
                    if (!isMounted.current) return;
                    
                    const data = snapshot.docs.map((doc) => {
                        const docData = doc.data();
                        const baseData = {
                            id: doc.id,
                            ...docData,
                            created_at: docData.created_at?.toDate ? docData.created_at.toDate() : new Date(),
                            updated_at: docData.updated_at?.toDate ? docData.updated_at.toDate() : new Date(),
                        };
                        
                        return transformData ? transformData(baseData) : baseData;
                    });
                    
                    console.log(`Received ${data.length} ${name}`);
                    setter(data);
                },
                (error) => {
                    if (!isMounted.current) return;
                    console.error(`Error subscribing to ${name}:`, error);
                    if (typeof handleError === 'function') {
                        handleError(error, `${name} sync`);
                    }
                }
            );

            if (unsubscribe) {
                unsubscribes.current.push(unsubscribe);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error setting up subscription for ${name}:`, error);
            if (typeof handleError === 'function') {
                handleError(error, `${name} subscription setup`);
            }
            return false;
        }
    }, [handleError]);

    const subscribeToRelationships = useCallback(() => {
        const relationshipsPath = getCollectionPath('relationships');
        
        return subscribeToCollection({
            name: 'relationships',
            path: relationshipsPath,
            constraints: [where('suiteId', '==', activeSuiteId), orderBy('created_at', 'desc')],
            setter: (data) => {
                const newRelationships = {
                    testCaseToBugs: {},
                    bugToRecordings: {},
                    requirementToTestCases: {},
                };
                
                data.forEach((doc) => {
                    const { sourceType, sourceId, targetType, targetId } = doc;
                    if (sourceType && sourceId && targetType && targetId) {
                        const key = `${sourceType}To${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`;
                        if (!newRelationships[key]) newRelationships[key] = {};
                        if (!newRelationships[key][sourceId]) newRelationships[key][sourceId] = [];
                        newRelationships[key][sourceId].push(targetId);
                    }
                });
                
                console.log('Received relationships data:', newRelationships);
                if (typeof setRelationships === 'function') {
                    setRelationships(newRelationships);
                }
            },
            transformData: (data) => data
        });
    }, [getCollectionPath, activeSuiteId, setRelationships, subscribeToCollection]);

    const initializeSubscriptions = useCallback(async () => {
        if (initializationInProgress.current) {
            console.log('Initialization already in progress, skipping');
            return;
        }

        initializationInProgress.current = true;

        try {
            const userId = firestoreService.getCurrentUserId();
            if (!userId) {
                console.error('No user ID available');
                if (typeof handleError === 'function') {
                    handleError(new Error('No user ID available.'), 'user authentication');
                }
                return;
            }

            console.log('🔍 Access Check Details:', {
                userId,
                activeSuiteId,
                accountType: validAccountType,
                orgId: validOrgId,
                isAuthenticated
            });

            // Check access with enhanced debugging
            const cacheKey = `${userId}_${activeSuiteId}`;
            let hasSuiteAccess = accessCheckCache.current[cacheKey];
            
            if (hasSuiteAccess === undefined) {
                console.log(`🔐 Checking access for suite ${activeSuiteId} (user: ${userId})`);
                
                try {
                    hasSuiteAccess = await checkSuiteAccess(userId, activeSuiteId);
                    console.log(`🔐 Access check result: ${hasSuiteAccess}`);
                    
                    // Only cache successful access checks for a short time
                    if (hasSuiteAccess) {
                        accessCheckCache.current[cacheKey] = hasSuiteAccess;
                        // Clear cache after 5 minutes
                        setTimeout(() => {
                            delete accessCheckCache.current[cacheKey];
                        }, 5 * 60 * 1000);
                    } else {
                        // Don't cache failed access checks to allow retry
                        console.log('❌ Not caching failed access check to allow retry');
                    }
                } catch (accessError) {
                    console.error('🔐 Error during access check:', accessError);
                    hasSuiteAccess = false;
                }
            } else {
                console.log(`🔐 Using cached access result: ${hasSuiteAccess}`);
            }

            if (!hasSuiteAccess) {
                console.error(`❌ Access denied to suite ${activeSuiteId}`, {
                    userId,
                    accountType: validAccountType,
                    orgId: validOrgId,
                    isAuthenticated,
                    checkSuiteAccessFunction: typeof checkSuiteAccess
                });
                
                // Don't throw error immediately - let parent component handle this
                if (typeof handleError === 'function') {
                    handleError(new Error(`Access denied to suite ${activeSuiteId}. Please check your permissions.`), 'suite access');
                }
                return;
            }

            console.log(`✅ Access granted to suite ${activeSuiteId}`);

            // Define collection configurations
            const collections = [
                { 
                    name: 'testCases', 
                    path: getCollectionPath('testCases'), 
                    constraints: [orderBy('created_at', 'desc')],
                    setter: setTestCases 
                },
                { 
                    name: 'bugs', 
                    path: getCollectionPath('bugs'), 
                    constraints: [orderBy('created_at', 'desc')],
                    setter: setBugs 
                },
                { 
                    name: 'recordings', 
                    path: getCollectionPath('recordings'), 
                    constraints: [orderBy('created_at', 'desc')],
                    setter: setRecordings 
                },
            ];

            // Subscribe to all collections
            const subscriptionPromises = collections.map(collection => 
                subscribeToCollection(collection)
            );

            // Add relationships subscription
            subscriptionPromises.push(subscribeToRelationships());

            const results = await Promise.allSettled(subscriptionPromises);
            const failedSubscriptions = results.filter(result => result.status === 'rejected' || !result.value);
            
            if (failedSubscriptions.length > 0) {
                console.warn(`${failedSubscriptions.length} subscriptions failed to initialize`);
            } else {
                console.log('🎉 All subscriptions initialized successfully');
            }

        } catch (error) {
            if (isMounted.current) {
                console.error('Error in subscription initialization:', error);
                if (typeof handleError === 'function') {
                    handleError(error, 'subscription initialization');
                }
            }
        } finally {
            initializationInProgress.current = false;
        }
    }, [
        activeSuiteId, 
        handleError, 
        checkSuiteAccess, 
        getCollectionPath, 
        setTestCases, 
        setBugs, 
        setRecordings, 
        subscribeToCollection,
        subscribeToRelationships,
        validAccountType,
        validOrgId,
        isAuthenticated
    ]);

    // Add debug effect to track parameter changes
    useEffect(() => {
        console.log('📊 useEntitySync parameters changed:', {
            isAuthenticated,
            activeSuiteId,
            orgId: validOrgId,
            accountType: validAccountType,
            hasSetters: {
                setTestCases: typeof setTestCases === 'function',
                setBugs: typeof setBugs === 'function',
                setRecordings: typeof setRecordings === 'function',
                setRelationships: typeof setRelationships === 'function'
            }
        });
    }, [isAuthenticated, activeSuiteId, validOrgId, validAccountType, setTestCases, setBugs, setRecordings, setRelationships]);

    useEffect(() => {
        if (!isMounted.current) return;

        // Clean up previous subscriptions on suite change
        if (activeSuiteId !== previousSuiteId.current) {
            console.log(`🔄 Suite changed from ${previousSuiteId.current} to ${activeSuiteId}`);
            cleanupSubscriptions();
            resetState();
            previousSuiteId.current = activeSuiteId;
            
            // Clear access cache for new suite
            accessCheckCache.current = {};
        }

        if (!isAuthenticated || !activeSuiteId || !validOrgId) {
            console.warn('⚠️ Missing required parameters for entity sync:', {
                isAuthenticated,
                activeSuiteId,
                orgId: validOrgId
            });
            resetState();
            return;
        }

        // Add small delay to ensure authentication is fully settled
        const timeoutId = setTimeout(() => {
            if (isMounted.current) {
                initializeSubscriptions();
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            cleanupSubscriptions();
        };
    }, [isAuthenticated, activeSuiteId, validOrgId, validAccountType, cleanupSubscriptions, resetState, initializeSubscriptions]);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            cleanupSubscriptions();
        };
    }, [cleanupSubscriptions]);
};