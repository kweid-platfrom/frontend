/* eslint-disable react-hooks/exhaustive-deps */
// contexts/EntityProvider.js
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useEntitySync } from '@/hooks/useEntitySync';
import firestoreService from '../services/firestoreService';
import { arrayUnion, arrayRemove } from 'firebase/firestore';

const EntityContext = createContext();

export const EntityProvider = ({ children, isAuthenticated, activeSuiteId, orgId, accountType }) => {
    const [testCases, setTestCases] = useState([]);
    const [bugs, setBugs] = useState([]);
    const [recordings, setRecordings] = useState([]);
    const [relationships, setRelationships] = useState({
        testCaseToBugs: {},
        bugToRecordings: {},
        requirementToTestCases: {},
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        setError(error.message || 'An error occurred');
    }, []);

    // Normalize props to handle undefined values gracefully
    const normalizedProps = {
        isAuthenticated: Boolean(isAuthenticated),
        activeSuiteId: activeSuiteId || null,
        orgId: orgId || null,
        accountType: accountType || null,
    };

    console.log('EntityProvider Initialized with:', normalizedProps);

    // Check if context is valid for operations
    const isContextValid = normalizedProps.isAuthenticated &&
        normalizedProps.activeSuiteId &&
        normalizedProps.orgId &&
        normalizedProps.accountType;

    // Reset state when context becomes invalid
    useEffect(() => {
        if (!isContextValid) {
            console.log('EntityProvider: Context invalid, resetting state');
            setTestCases([]);
            setBugs([]);
            setRecordings([]);
            setRelationships({
                testCaseToBugs: {},
                bugToRecordings: {},
                requirementToTestCases: {},
            });
            setError(null);
            setIsInitialized(false);
            setIsLoading(false);
        }
    }, [isContextValid]);

    // Always call useEntitySync - let it handle the conditional logic internally
    useEntitySync(
        normalizedProps.isAuthenticated,
        normalizedProps.activeSuiteId,
        normalizedProps.orgId,
        normalizedProps.accountType,
        setTestCases,
        setBugs,
        setRecordings,
        setRelationships,
        handleError,
        setIsLoading,
        setIsInitialized
    );

    const getCollectionPath = useCallback(
        (collectionName) => {
            if (!normalizedProps.accountType || !normalizedProps.activeSuiteId || !normalizedProps.orgId) {
                console.warn('Invalid context for path:', normalizedProps);
                return '';
            }

            try {
                const userId = firestoreService.getCurrentUserId();
                if (!userId && normalizedProps.accountType === 'individual') {
                    console.warn('No user ID available for individual account path');
                    return '';
                }

                const path = normalizedProps.accountType === 'individual'
                    ? `individualAccounts/${userId}/testSuites/${normalizedProps.activeSuiteId}/${collectionName}`
                    : `organizations/${normalizedProps.orgId}/testSuites/${normalizedProps.activeSuiteId}/${collectionName}`;

                console.log('Generated collection path:', path);
                return path;
            } catch (error) {
                console.error('Error generating collection path:', error);
                return '';
            }
        },
        [normalizedProps]
    );

    const validateContext = useCallback((operation) => {
        if (!normalizedProps.isAuthenticated) {
            const error = `Cannot ${operation}: User not authenticated`;
            console.warn(error);
            handleError(new Error(error), operation);
            return false;
        }

        if (!normalizedProps.activeSuiteId) {
            const error = `Cannot ${operation}: No active suite ID`;
            console.warn(error);
            handleError(new Error(error), operation);
            return false;
        }

        if (!normalizedProps.orgId && normalizedProps.accountType === 'organization') {
            const error = `Cannot ${operation}: Missing organization ID for organization account`;
            console.warn(error);
            handleError(new Error(error), operation);
            return false;
        }

        return true;
    }, [normalizedProps, handleError]);

    const createTestCase = useCallback(
        async (testCaseData) => {
            if (!validateContext('create test case')) return;

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('testCases');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                console.log('Creating test case at path:', path, 'with data:', testCaseData);
                const result = await firestoreService.createDocument(path, {
                    ...testCaseData,
                    suiteId: normalizedProps.activeSuiteId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to create test case');
                }

                console.log('Test case created successfully:', result.data);
                return result.data;
            } catch (error) {
                handleError(error, 'createTestCase');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, normalizedProps.activeSuiteId, handleError]
    );

    const updateTestCase = useCallback(
        async (testCaseId, updates) => {
            if (!validateContext('update test case')) return;
            if (!testCaseId) {
                handleError(new Error('Test case ID is required'), 'updateTestCase');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('testCases');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                const updateData = {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };

                console.log('Updating test case at:', `${path}/${testCaseId}`, 'with updates:', updateData);
                const result = await firestoreService.updateDocument(`${path}/${testCaseId}`, updateData);

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to update test case');
                }

                console.log('Test case updated successfully');
                return result.data;
            } catch (error) {
                handleError(error, 'updateTestCase');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, handleError]
    );

    const deleteTestCase = useCallback(
        async (testCaseId) => {
            if (!validateContext('delete test case')) return;
            if (!testCaseId) {
                handleError(new Error('Test case ID is required'), 'deleteTestCase');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('testCases');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                console.log('Deleting test case at:', `${path}/${testCaseId}`);
                const result = await firestoreService.deleteDocument(`${path}/${testCaseId}`);

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to delete test case');
                }

                console.log('Test case deleted successfully');
                return true;
            } catch (error) {
                handleError(error, 'deleteTestCase');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, handleError]
    );

    const createBug = useCallback(
        async (bugData) => {
            if (!validateContext('create bug')) return;

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('bugs');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                console.log('Creating bug at path:', path, 'with data:', bugData);
                const result = await firestoreService.createDocument(path, {
                    ...bugData,
                    suiteId: normalizedProps.activeSuiteId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to create bug');
                }

                console.log('Bug created successfully:', result.data);
                return result.data;
            } catch (error) {
                handleError(error, 'createBug');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, normalizedProps.activeSuiteId, handleError]
    );

    const updateBug = useCallback(
        async (bugId, updates) => {
            if (!validateContext('update bug')) return;
            if (!bugId) {
                handleError(new Error('Bug ID is required'), 'updateBug');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('bugs');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                const updateData = {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };

                console.log('Updating bug at:', `${path}/${bugId}`, 'with updates:', updateData);
                const result = await firestoreService.updateDocument(`${path}/${bugId}`, updateData);

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to update bug');
                }

                console.log('Bug updated successfully');
                return result.data;
            } catch (error) {
                handleError(error, 'updateBug');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, handleError]
    );

    const deleteBug = useCallback(
        async (bugId) => {
            if (!validateContext('delete bug')) return;
            if (!bugId) {
                handleError(new Error('Bug ID is required'), 'deleteBug');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('bugs');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                console.log('Deleting bug at:', `${path}/${bugId}`);
                const result = await firestoreService.deleteDocument(`${path}/${bugId}`);

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to delete bug');
                }

                console.log('Bug deleted successfully');
                return true;
            } catch (error) {
                handleError(error, 'deleteBug');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, handleError]
    );

    const linkBugToTestCase = useCallback(
        async (testCaseId, bugId) => {
            if (!validateContext('link bug to test case')) return;
            if (!testCaseId || !bugId) {
                handleError(new Error('Both test case ID and bug ID are required'), 'linkBugToTestCase');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('relationships');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                const relationshipId = `${testCaseId}_bug_${bugId}`;
                console.log('Linking bug to test case at:', `${path}/${relationshipId}`);

                const result = await firestoreService.setDocument(`${path}/${relationshipId}`, {
                    type: 'testCase_bug',
                    testCaseId,
                    bugIds: arrayUnion(bugId),
                    suiteId: normalizedProps.activeSuiteId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }, { merge: true });

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to link bug to test case');
                }

                console.log('Bug linked to test case successfully');
                return result.data;
            } catch (error) {
                handleError(error, 'linkBugToTestCase');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, normalizedProps.activeSuiteId, handleError]
    );

    const unlinkBugFromTestCase = useCallback(
        async (testCaseId, bugId) => {
            if (!validateContext('unlink bug from test case')) return;
            if (!testCaseId || !bugId) {
                handleError(new Error('Both test case ID and bug ID are required'), 'unlinkBugFromTestCase');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const path = getCollectionPath('relationships');
                if (!path) {
                    throw new Error('Unable to generate collection path');
                }

                const relationshipId = `${testCaseId}_bug_${bugId}`;
                console.log('Unlinking bug from test case at:', `${path}/${relationshipId}`);

                const result = await firestoreService.updateDocument(`${path}/${relationshipId}`, {
                    bugIds: arrayRemove(bugId),
                    updatedAt: new Date().toISOString(),
                });

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to unlink bug from test case');
                }

                console.log('Bug unlinked from test case successfully');
                return result.data;
            } catch (error) {
                handleError(error, 'unlinkBugFromTestCase');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [validateContext, getCollectionPath, handleError]
    );

    const refreshAllData = useCallback(async () => {
        if (!isContextValid) {
            console.warn('Cannot refresh data: invalid context');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setIsInitialized(false);
            console.log('Triggering data refresh');

            // Clear current data to force re-fetch
            setTestCases([]);
            setBugs([]);
            setRecordings([]);
            setRelationships({
                testCaseToBugs: {},
                bugToRecordings: {},
                requirementToTestCases: {},
            });

            // The useEntitySync hook will handle the actual refresh
        } catch (error) {
            handleError(error, 'refreshAllData');
        } finally {
            // Don't set loading to false here - let useEntitySync handle it
        }
    }, [isContextValid, handleError]);

    // Clear error when context becomes valid again
    useEffect(() => {
        if (isContextValid && error) {
            setError(null);
        }
    }, [isContextValid, error]);

    console.log('EntityProvider State:', {
        isContextValid,
        testCasesCount: testCases.length,
        bugsCount: bugs.length,
        recordingsCount: recordings.length,
        relationshipsKeys: Object.keys(relationships),
        isLoading,
        error,
        isInitialized,
    });

    const value = {
        testCases,
        bugs,
        recordings,
        relationships,
        isLoading,
        error,
        isInitialized,
        isContextValid,
        createTestCase,
        updateTestCase,
        deleteTestCase,
        createBug,
        updateBug,
        deleteBug,
        linkBugToTestCase,
        unlinkBugFromTestCase,
        refreshAllData,
    };

    return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
};

export const useEntityData = () => {
    const context = useContext(EntityContext);
    if (!context) {
        throw new Error('useEntityData must be used within an EntityProvider');
    }
    return context;
};