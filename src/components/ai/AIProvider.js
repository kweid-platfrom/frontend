// components/ai/AIProvider.jsx - Wrapper for AI-specific context
import React, { createContext, useContext } from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import { useAIModal } from '../../hooks/useAIModal';

const AIComponentContext = createContext();

export const AIProvider = ({ children, config = {} }) => {
  const insights = useAIInsights(config.insights);
  const analysis = useAIAnalysis();
  const modal = useAIModal();

  const value = {
    insights,
    analysis,
    modal,
    config
  };

  return (
    <AIComponentContext.Provider value={value}>
      {children}
    </AIComponentContext.Provider>
  );
};

export const useAIComponents = () => {
  const context = useContext(AIComponentContext);
  if (!context) {
    throw new Error('useAIComponents must be used within AIProvider');
  }
  return context;
};