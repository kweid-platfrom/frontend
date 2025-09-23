// components/ai/index.js - Export all components
export { default as AISuggestionPanel } from './AISuggestionPanel';
export { default as AIBugAnalysisModal } from './AIBugAnalysisModal';
export { default as AIDefectTrendsModal } from './AIDefectTrendsModal';
export { default as AISeverityAssessmentTooltip } from './AISeverityAssessmentTooltip';
export { default as AIInsightsCard } from './AIInsightsCard';

export { AIProvider, useAIComponents } from './AIProvider';
export { AILoadingSpinner } from './AILoadingSpinner';
export { AIErrorBoundary } from './AIErrorBoundary';
export { AIActionButton } from './AIActionButton';
export { AISeverityBadge } from './AISeverityBadge';

export { useAIInsights } from '../../hooks/useAIInsights';
export { useAIAnalysis } from '../../hooks/useAIAnalysis';
export { useAIModal } from '../../hooks/useAIModal';
export { aiHelpers } from '../../utils/aiHelpers';