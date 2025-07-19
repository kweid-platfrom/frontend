import { useCallback } from 'react';
import firestoreService from '../services/firestoreService';

export const useEntityManagement = (
    testCases,
    bugs,
    recordings,
    setTestCases,
    setBugs,
    setRecordings,
    setRelationships,
    canCreateResource,
    addNotification,
    handleError
) => {
    const addTestCase = useCallback(
        async (testCaseData, suiteId) => {
            if (!suiteId || typeof suiteId !== 'string') {
                addNotification({
                    type: 'error',
                    title: 'Invalid Suite',
                    message: 'A valid suite ID is required to create a test case.',
                    persistent: true,
                });
                return null;
            }
            if (!canCreateResource('testCases', testCases.length)) {
                addNotification({
                    type: 'error',
                    title: 'Limit Reached',
                    message: 'Cannot create more test cases due to subscription limits.',
                    persistent: true,
                });
                return null;
            }
            const data = { name: testCaseData.name, description: testCaseData.description || '' };
            const result = await firestoreService.createSuiteAsset(suiteId, 'testCases', data);
            if (!result.success) {
                handleError(result.error, 'test case creation');
                return null;
            }
            setTestCases((prev) => [...prev, result.data]);
            addNotification({
                type: 'success',
                title: 'Test Case Created',
                message: `Test case ${result.data.name} created successfully.`,
            });
            return result.docId;
        },
        [canCreateResource, testCases.length, setTestCases, addNotification, handleError]
    );

    const addBug = useCallback(
        async (bugData, suiteId) => {
            if (!suiteId || typeof suiteId !== 'string') {
                addNotification({
                    type: 'error',
                    title: 'Invalid Suite',
                    message: 'A valid suite ID is required to create a bug.',
                    persistent: true,
                });
                return null;
            }
            if (!canCreateResource('bugs', bugs.length)) {
                addNotification({
                    type: 'error',
                    title: 'Limit Reached',
                    message: 'Cannot create more bugs due to subscription limits.',
                    persistent: true,
                });
                return null;
            }
            const data = { title: bugData.title, description: bugData.description || '' };
            const result = await firestoreService.createSuiteAsset(suiteId, 'bugs', data);
            if (!result.success) {
                handleError(result.error, 'bug creation');
                return null;
            }
            setBugs((prev) => [...prev, result.data]);
            addNotification({
                type: 'success',
                title: 'Bug Created',
                message: `Bug ${result.data.title} created successfully.`,
            });
            return result.docId;
        },
        [canCreateResource, bugs.length, setBugs, addNotification, handleError]
    );

    const addRecording = useCallback(
        async (recordingData, suiteId) => {
            if (!suiteId || typeof suiteId !== 'string') {
                addNotification({
                    type: 'error',
                    title: 'Invalid Suite',
                    message: 'A valid suite ID is required to create a recording.',
                    persistent: true,
                });
                return null;
            }
            if (!canCreateResource('recordings', recordings.length)) {
                addNotification({
                    type: 'error',
                    title: 'Limit Reached',
                    message: 'Cannot create more recordings due to subscription limits.',
                    persistent: true,
                });
                return null;
            }
            const data = { name: recordingData.name, url: recordingData.url || '' };
            const result = await firestoreService.createSuiteAsset(suiteId, 'recordings', data);
            if (!result.success) {
                handleError(result.error, 'recording creation');
                return null;
            }
            setRecordings((prev) => [...prev, result.data]);
            addNotification({
                type: 'success',
                title: 'Recording Created',
                message: `Recording ${result.data.name} created successfully.`,
            });
            return result.docId;
        },
        [canCreateResource, recordings.length, setRecordings, addNotification, handleError]
    );

    const linkEntities = useCallback(
        async (sourceType, sourceId, targetType, targetId, suiteId) => {
            if (!suiteId || typeof suiteId !== 'string') {
                addNotification({
                    type: 'error',
                    title: 'Invalid Suite',
                    message: 'A valid suite ID is required to link entities.',
                    persistent: true,
                });
                return;
            }
            if (!sourceId || !targetId || typeof sourceId !== 'string' || typeof targetId !== 'string') {
                addNotification({
                    type: 'error',
                    title: 'Invalid Entity IDs',
                    message: 'Valid source and target IDs are required.',
                    persistent: true,
                });
                return;
            }
            const relationshipKey = `${sourceType}To${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`;
            const relationshipData = { sourceType, sourceId, targetType, targetId, suiteId };
            const result = await firestoreService.createDocument('relationships', relationshipData);
            if (!result.success) {
                handleError(result.error, 'entity linking');
                return;
            }
            setRelationships((prev) => ({
                ...prev,
                [relationshipKey]: {
                    ...prev[relationshipKey],
                    [sourceId]: [...(prev[relationshipKey][sourceId] || []), targetId],
                },
            }));
            addNotification({
                type: 'success',
                title: 'Entities Linked',
                message: `${sourceType} linked to ${targetType} successfully.`,
            });
        },
        [addNotification, handleError, setRelationships]
    );

    const unlinkEntities = useCallback(
        async (sourceType, sourceId, targetType, targetId, suiteId) => {
            if (!suiteId || typeof suiteId !== 'string') {
                addNotification({
                    type: 'error',
                    title: 'Invalid Suite',
                    message: 'A valid suite ID is required to unlink entities.',
                    persistent: true,
                });
                return;
            }
            if (!sourceId || !targetId || typeof sourceId !== 'string' || typeof targetId !== 'string') {
                addNotification({
                    type: 'error',
                    title: 'Invalid Entity IDs',
                    message: 'Valid source and target IDs are required.',
                    persistent: true,
                });
                return;
            }
            const relationshipKey = `${sourceType}To${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`;
            const result = await firestoreService.deleteDocument('relationships', `${sourceType}_${sourceId}_${targetType}_${targetId}_${suiteId}`);
            if (!result.success) {
                handleError(result.error, 'entity unlinking');
                return;
            }
            setRelationships((prev) => ({
                ...prev,
                [relationshipKey]: {
                    ...prev[relationshipKey],
                    [sourceId]: (prev[relationshipKey][sourceId] || []).filter((id) => id !== targetId),
                },
            }));
            addNotification({
                type: 'success',
                title: 'Entities Unlinked',
                message: `${sourceType} unlinked from ${targetType} successfully.`,
            });
        },
        [addNotification, handleError, setRelationships]
    );

    return { addTestCase, addBug, addRecording, linkEntities, unlinkEntities };
};