// hooks/useUI.js
import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppProvider';

export const useUI = () => {
    const { state, actions } = useApp();

    // Memoized UI state accessors
    const uiState = useMemo(() => ({
        modals: state.ui?.modals || {},
        toasts: state.ui?.toasts || [],
        featureLocks: state.ui?.featureLocks || {},
        selectedItems: state.ui?.selectedItems || {},
        sidebarOpen: state.ui?.sidebarOpen || true,
    }), [state.ui]);

    // Memoized action callbacks
    const uiActions = useMemo(() => ({
        // Modal actions
        openModal: actions.ui?.openModal || (() => console.warn('openModal action not available')),
        closeModal: actions.ui?.closeModal || (() => console.warn('closeModal action not available')),
        
        // Toast actions
        showToast: actions.ui?.showToast || (() => console.warn('showToast action not available')),
        dismissToast: actions.ui?.dismissToast || (() => console.warn('dismissToast action not available')),
        
        // Selection actions
        updateSelection: actions.ui?.updateSelection || (() => console.warn('updateSelection action not available')),
        clearSelections: actions.ui?.clearSelections || (() => console.warn('clearSelections action not available')),
        
        // Sidebar actions
        setSidebarOpen: actions.ui?.setSidebarOpen || (() => console.warn('setSidebarOpen action not available')),
    }), [actions.ui]);

    // Utility functions
    const isModalOpen = useCallback((modalName) => {
        return uiState.modals[modalName] || false;
    }, [uiState.modals]);

    const hasSelections = useMemo(() => {
        return Object.values(uiState.selectedItems).some(items => 
            Array.isArray(items) && items.length > 0
        );
    }, [uiState.selectedItems]);

    const isFeatureLocked = useCallback((feature) => {
        return uiState.featureLocks[`${feature}Locked`] || false;
    }, [uiState.featureLocks]);

    const toggleModal = useCallback((modalName) => {
        if (isModalOpen(modalName)) {
            uiActions.closeModal(modalName);
        } else {
            uiActions.openModal(modalName);
        }
    }, [isModalOpen, uiActions]);

    const toggleSidebar = useCallback(() => {
        uiActions.setSidebarOpen(!uiState.sidebarOpen);
    }, [uiActions, uiState.sidebarOpen]);

    return {
        // State
        ...uiState,

        // Actions
        ...uiActions,

        // Computed/Utility functions
        isModalOpen,
        hasSelections,
        isFeatureLocked,
        toggleModal,
        toggleSidebar,
    };
};