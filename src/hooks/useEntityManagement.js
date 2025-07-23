import { useCallback } from 'react';
import { useEntityData } from '../contexts/EntityProvider';

export const useEntityManagement = (
    testCases,
    bugs,
    recordings,
    setRelationships,
    canCreateResource,
    addNotification
) => {
    const { createTestCase, createBug, createRecording, linkBugToTestCase, unlinkBugFromTestCase } = useEntityData();

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
            try {
                const data = { name: testCaseData.name, description: testCaseData.description || '' };
                const result = await createTestCase(data);
                if (!result) return null;
                addNotification({
                    type: 'success',
                    title: 'Test Case Created',
                    message: `Test case ${result.name} created successfully.`,
                });
                return result.id;
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Test Case Creation Failed',
                    message: error.message || 'Failed to create test case.',
                    persistent: true,
                });
                return null;
            }
        },
        [canCreateResource, testCases.length, addNotification, createTestCase]
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
            try {
                const data = { title: bugData.title, description: bugData.description || '' };
                const result = await createBug(data);
                if (!result) return null;
                addNotification({
                    type: 'success',
                    title: 'Bug Created',
                    message: `Bug ${result.title} created successfully.`,
                });
                return result.id;
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Bug Creation Failed',
                    message: error.message || 'Failed to create bug.',
                    persistent: true,
                });
                return null;
            }
        },
        [canCreateResource, bugs.length, addNotification, createBug]
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
            try {
                const data = { name: recordingData.name, url: recordingData.url || '' };
                const result = await createRecording(data);
                if (!result) return null;
                addNotification({
                    type: 'success',
                    title: 'Recording Created',
                    message: `Recording ${result.name} created successfully.`,
                });
                return result.id;
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Recording Creation Failed',
                    message: error.message || 'Failed to create recording.',
                    persistent: true,
                });
                return null;
            }
        },
        [canCreateResource, recordings.length, addNotification, createRecording]
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
            if (sourceType === 'testCase' && targetType === 'bug') {
                try {
                    const result = await linkBugToTestCase(sourceId, targetId);
                    if (!result) return;
                    addNotification({
                        type: 'success',
                        title: 'Entities Linked',
                        message: `${sourceType} linked to ${targetType} successfully.`,
                    });
                } catch (error) {
                    addNotification({
                        type: 'error',
                        title: 'Entity Linking Failed',
                        message: error.message || 'Failed to link entities.',
                        persistent: true,
                    });
                }
            } else {
                addNotification({
                    type: 'error',
                    title: 'Unsupported Operation',
                    message: `Linking ${sourceType} to ${targetType} is not supported.`,
                    persistent: true,
                });
            }
        },
        [addNotification, linkBugToTestCase]
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
            if (sourceType === 'testCase' && targetType === 'bug') {
                try {
                    const result = await unlinkBugFromTestCase(sourceId, targetId);
                    if (!result) return;
                    addNotification({
                        type: 'success',
                        title: 'Entities Unlinked',
                        message: `${sourceType} unlinked from ${targetType} successfully.`,
                    });
                } catch (error) {
                    addNotification({
                        type: 'error',
                        title: 'Entity Unlinking Failed',
                        message: error.message || 'Failed to unlink entities.',
                        persistent: true,
                    });
                }
            } else {
                addNotification({
                    type: 'error',
                    title: 'Unsupported Operation',
                    message: `Unlinking ${sourceType} from ${targetType} is not supported.`,
                    persistent: true,
                });
            }
        },
        [addNotification, unlinkBugFromTestCase]
    );

    return { addTestCase, addBug, addRecording, linkEntities, unlinkEntities };
};