// hooks/useAIModal.js
import { useState, useCallback } from 'react';

export const useAIModal = () => {
  const [modals, setModals] = useState({});

  const openModal = useCallback((modalId, config = {}) => {
    setModals(prev => ({
      ...prev,
      [modalId]: {
        isOpen: true,
        ...config
      }
    }));
  }, []);

  const closeModal = useCallback((modalId) => {
    setModals(prev => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        isOpen: false
      }
    }));
  }, []);

  const getModalState = useCallback((modalId) => {
    return modals[modalId] || { isOpen: false };
  }, [modals]);

  const toggleModal = useCallback((modalId, config = {}) => {
    const currentState = getModalState(modalId);
    if (currentState.isOpen) {
      closeModal(modalId);
    } else {
      openModal(modalId, config);
    }
  }, [getModalState, closeModal, openModal]);

  return {
    openModal,
    closeModal,
    getModalState,
    toggleModal,
    modals
  };
};
