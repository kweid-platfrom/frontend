// hooks/useUI.js
import { useApp } from '../context/AppProvider';

export const useUI = () => {
    const { state, actions } = useApp();

    return {
        // State
        modals: state.ui.modals,
        toasts: state.ui.toasts,
        featureLocks: state.ui.featureLocks,
        selectedItems: state.ui.selectedItems,

        // Actions
        openModal: actions.openModal,
        closeModal: actions.closeModal,
        showToast: actions.showToast,
        updateSelection: actions.updateSelection,
        clearSelections: actions.clearSelections,

        // Computed
        isModalOpen: (modalName) => state.ui.modals[modalName] || false,
        hasSelections: Object.values(state.ui.selectedItems).some(items => items.length > 0),
        isFeatureLocked: (feature) => state.ui.featureLocks[`${feature}Locked`] || false
    };
};