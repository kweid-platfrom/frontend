import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppProvider';
import { toast } from 'sonner';

export const useSuiteFlow = () => {
    const { state, actions } = useApp();
    const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
    
    const needsTestSuite = () => {
        return state.auth.isAuthenticated &&
            state.auth.currentUser?.emailVerified === true &&
            state.auth.profileLoaded &&
            (!state.suites.testSuites || state.suites.testSuites.length === 0) &&
            !state.suites.loading;
    };

    const shouldShowDashboard = () => {
        return state.auth.isAuthenticated &&
            state.auth.currentUser?.emailVerified === true &&
            state.suites.testSuites &&
            state.suites.testSuites.length > 0 &&
            state.suites.activeSuite;
    };

    const handleSuiteCreated = useCallback(async (suiteData) => {
        console.log('Suite created successfully:', suiteData);
        toast.success('Test suite created successfully!', { duration: 5000 });
        
        try {
            // Immediately save the new suite as the selected one BEFORE any reloads
            const userId = state.auth.currentUser?.uid;
            if (userId && suiteData?.id) {
                localStorage.setItem(`selectedSuite_${userId}`, suiteData.id);
                console.log('Pre-saved new suite to localStorage:', suiteData.id);
            }
            
            // Add the new suite immediately to the state (at the beginning of the list)
            const currentSuites = state.suites.testSuites || [];
            const updatedSuites = [suiteData, ...currentSuites];
            
            // Update the state with the new suite list
            actions.suites.loadSuitesSuccess(updatedSuites);
            
            // Activate the new suite immediately
            if (suiteData?.id) {
                console.log('Activating newly created suite:', suiteData.name);
                actions.suites.activateSuite(suiteData);
            }
            
            if (actions.suites.markSuiteCreated) {
                actions.suites.markSuiteCreated();
            }
            
            // Force a brief delay to ensure state updates are processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            setShowCreateSuiteModal(false);
            return { success: true, data: suiteData };
        } catch (error) {
            console.error('Error after suite creation:', error);
            toast.error('Suite created but failed to load. Please refresh the page.');
            setShowCreateSuiteModal(false);
            return { success: false, error };
        }
    }, [actions.suites, state.auth.currentUser?.uid, state.suites.testSuites]);

    const ensureActiveSuite = useCallback(() => {
        const userId = state.auth.currentUser?.uid;
        const hasAnySuites = state.suites.testSuites?.length > 0;
        const hasActiveSuite = !!state.suites.activeSuite;

        if (!userId || !hasAnySuites || hasActiveSuite) return;

        const storedSuiteId = localStorage.getItem(`selectedSuite_${userId}`);
        let suiteToActivate = null;
        
        if (storedSuiteId) {
            suiteToActivate = state.suites.testSuites.find(suite => suite.id === storedSuiteId);
            console.log('Restoring suite from localStorage:', storedSuiteId, suiteToActivate ? 'FOUND' : 'NOT FOUND');
        }

        if (!suiteToActivate) {
            suiteToActivate = state.suites.testSuites[0];
            console.log('Using first suite as fallback:', suiteToActivate?.name);
        }

        if (suiteToActivate) {
            actions.suites.activateSuite(suiteToActivate);
            localStorage.setItem(`selectedSuite_${userId}`, suiteToActivate.id);
        }
    }, [state.suites.testSuites, state.suites.activeSuite, actions.suites, state.auth.currentUser?.uid]);

    useEffect(() => {
        const userId = state.auth.currentUser?.uid;
        const activeSuiteId = state.suites.activeSuite?.id;
        
        if (userId && activeSuiteId) {
            localStorage.setItem(`selectedSuite_${userId}`, activeSuiteId);
            console.log('SAVED suite to localStorage:', activeSuiteId);
        }
    }, [state.suites.activeSuite?.id, state.auth.currentUser?.uid]);

    return {
        needsTestSuite: needsTestSuite(),
        shouldShowDashboard: shouldShowDashboard(),
        showCreateSuiteModal,
        setShowCreateSuiteModal,
        handleSuiteCreated,
        ensureActiveSuite,
        testSuites: state.suites.testSuites,
        activeSuite: state.suites.activeSuite,
        suitesLoading: state.suites.loading
    };
};