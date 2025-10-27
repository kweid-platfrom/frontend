import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AIBugGeneratorModal from '../components/modals/AIBugGeneratorModal';

const AIBugGeneratorContext = createContext(null);

export const useAIBugGenerator = () => {
  const context = useContext(AIBugGeneratorContext);
  if (!context) {
    throw new Error('useAIBugGenerator must be used within AIBugGeneratorProvider');
  }
  return context;
};

export const AIBugGeneratorProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [onSubmitCallback, setOnSubmitCallback] = useState(null);
  const [preFillData, setPreFillData] = useState(null);

  /**
   * Opens the AI Bug Generator modal
   * @param {Function} onSubmit - Callback to handle bug creation
   * @param {Object} options - Optional pre-fill data
   * @param {string} options.initialPrompt - Pre-filled prompt/description
   * @param {string} options.initialConsoleError - Pre-filled console error
   */
  const openGenerator = useCallback((onSubmit, options = {}) => {
    setOnSubmitCallback(() => onSubmit);
    setPreFillData(options);
    setIsOpen(true);
  }, []);

  const closeGenerator = useCallback(() => {
    setIsOpen(false);
    setOnSubmitCallback(null);
    setPreFillData(null);
  }, []);

  const handleSubmit = useCallback(async (bugData) => {
    if (onSubmitCallback) {
      await onSubmitCallback(bugData);
    }
    closeGenerator();
  }, [onSubmitCallback, closeGenerator]);

  return (
    <AIBugGeneratorContext.Provider value={{ openGenerator, closeGenerator, isOpen }}>
      {children}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <AIBugGeneratorModal
          isOpen={isOpen}
          onClose={closeGenerator}
          onSubmit={handleSubmit}
          preFillData={preFillData}
        />,
        document.body
      )}
    </AIBugGeneratorContext.Provider>
  );
};

export default AIBugGeneratorContext;