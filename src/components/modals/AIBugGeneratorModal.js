import React, { useState, useCallback, useEffect } from 'react';
import { 
  SparklesIcon, 
  ClipboardDocumentIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  CheckCircleIcon, 
  PaperAirplaneIcon, 
  PencilIcon, 
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAI } from '@/context/AIContext';
import { useApp } from '@/context/AppProvider';
import BugReportAttachments from '../create-bug/BugReportAttachments';

const STANDARD_SOFTWARE_MODULES = [
  { id: 'authentication', name: 'Authentication' },
  { id: 'user-management', name: 'User Management' },
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'reporting', name: 'Reporting' },
  { id: 'settings', name: 'Settings' },
  { id: 'file-upload', name: 'File Upload' },
  { id: 'search', name: 'Search' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'api-integration', name: 'API Integration' },
  { id: 'ui-components', name: 'UI Components' },
  { id: 'performance', name: 'Performance' },
  { id: 'security', name: 'Security' },
  { id: 'other', name: 'Other (Specify below)' }
];

const AIBugGeneratorModal = ({ isOpen, onClose, onSubmit, preFillData = null }) => {
  const { state, currentUser, activeSuite } = useApp();
  const {
    isInitialized,
    isGeneratingBugReport,
    isHealthy,
    error: aiError,
    provider,
    currentModel,
    canGenerate,
    generateBugReport,
    clearError: clearAIError
  } = useAI();

  const [prompt, setPrompt] = useState('');
  const [consoleError, setConsoleError] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [aiGenerationMetadata, setAiGenerationMetadata] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // Get sprints and modules from global state
  const sprints = state?.sprints?.sprints || state?.sprints?.list || [];
  const modules = STANDARD_SOFTWARE_MODULES;

  // Load team members
  useEffect(() => {
    if (isOpen && state.auth.accountType === 'organization' && state.team.members) {
      setTeamMembers(state.team.members.map(member => ({
        id: member.id,
        name: member.name || member.email || member.id,
        email: member.email || member.id
      })));
    } else {
      setTeamMembers([]);
    }
  }, [isOpen, state.auth.accountType, state.team.members]);

  // Handle pre-fill data when modal opens
  useEffect(() => {
    if (isOpen && preFillData) {
      if (preFillData.initialPrompt) {
        setPrompt(preFillData.initialPrompt);
      }
      if (preFillData.initialConsoleError) {
        setConsoleError(preFillData.initialConsoleError);
      }
    }
  }, [isOpen, preFillData]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setPrompt('');
    setConsoleError('');
    setGeneratedReport(null);
    setAttachments([]);
    setError('');
    setAiGenerationMetadata(null);
    clearAIError();
    onClose();
  }, [onClose, clearAIError]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const normalizeStepsToReproduce = useCallback((steps) => {
    if (!steps) return '';
    if (typeof steps === 'string') return steps;
    if (Array.isArray(steps)) {
      return steps
        .map((step, index) => {
          const cleanStep = typeof step === 'string' 
            ? step.replace(/^\d+\.\s*/, '').trim()
            : String(step);
          return `${index + 1}. ${cleanStep}`;
        })
        .join('\n');
    }
    return String(steps);
  }, []);

  const createAIMetadata = useCallback((prompt, consoleError, tokensUsed = null, cost = null) => {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const promptSummary = prompt.trim() 
      ? prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
      : consoleError.trim() 
        ? 'Console error analysis: ' + consoleError.substring(0, 80) + '...'
        : 'Bug report generation';

    return {
      generated: true,
      provider: provider || 'gemini',
      model: currentModel || 'gemini-1.5-flash-latest',
      generated_at: new Date().toISOString(),
      tokens_used: tokensUsed || null,
      cost: cost || null,
      operation_id: operationId,
      prompt_summary: promptSummary,
      generation_timestamp: Date.now(),
      input_length: {
        prompt_chars: prompt.length,
        console_error_chars: consoleError.length
      }
    };
  }, [provider, currentModel]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() && !consoleError.trim()) {
      setError('Please provide either a bug description or console error');
      return;
    }

    clearAIError();
    setError('');
    
    try {
      const additionalContext = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        hasPrompt: !!prompt.trim(),
        hasConsoleError: !!consoleError.trim()
      };

      const startTime = Date.now();
      const result = await generateBugReport(prompt, consoleError, additionalContext);
      const endTime = Date.now();

      if (result.success) {
        const estimatedTokens = Math.ceil(
          (prompt.length + consoleError.length + JSON.stringify(result.data).length) / 4
        );
        
        const estimatedCost = provider === 'gemini' 
          ? (estimatedTokens / 1000) * 0.0001
          : null;

        const metadata = createAIMetadata(prompt, consoleError, estimatedTokens, estimatedCost);
        metadata.generation_time_ms = endTime - startTime;

        setAiGenerationMetadata(metadata);
        
        const processedData = {
          ...result.data,
          stepsToReproduce: normalizeStepsToReproduce(result.data.stepsToReproduce),
          actualBehavior: result.data.actualBehavior || '',
          expectedBehavior: result.data.expectedBehavior || '',
          title: result.data.title || '',
          description: result.data.description || '',
          source: 'ai_generated',
          ai_metadata: metadata,
          creationType: 'ai'
        };
        
        // Store evidence separately if needed for display
        if (result.data.evidence) {
          console.log('AI Evidence detected:', result.data.evidence);
        }
        
        setGeneratedReport(processedData);
      } else {
        setError(result.error || 'Failed to generate bug report');
      }
      
    } catch (err) {
      console.error('❌ Bug report generation failed:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  }, [prompt, consoleError, generateBugReport, clearAIError, normalizeStepsToReproduce, createAIMetadata, provider]);

  const handleSubmitGenerated = useCallback(async () => {
    if (!generatedReport) return;

    setIsSubmittingReport(true);
    try {
      // Clean up the report data - ensure all fields are primitives, not objects
      const cleanedReport = {
        ...generatedReport,
        attachments: attachments,
        source: 'ai_generated',
        creationType: 'ai',
        title: (generatedReport.title || '').trim(),
        description: (generatedReport.description || '').trim(),
        actualBehavior: (generatedReport.actualBehavior || '').trim(),
        expectedBehavior: (generatedReport.expectedBehavior || '').trim(),
        stepsToReproduce: (generatedReport.stepsToReproduce || '').trim(),
        workaround: (generatedReport.workaround || '').trim(),
        
        // Add suite and user information if available
        ...(activeSuite?.id && { suiteId: activeSuite.id }),
        ...(currentUser?.uid && { 
          created_by: currentUser.uid,
          reportedBy: currentUser.displayName || currentUser.email || 'Unknown User',
          reportedByEmail: currentUser.email || ''
        }),
        
        ai_metadata: {
          ...generatedReport.ai_metadata,
          submitted_at: new Date().toISOString(),
          submitted_timestamp: Date.now()
        }
      };

      // Remove the evidence field or ensure it's a string - don't pass objects to React
      if (cleanedReport.evidence) {
        if (typeof cleanedReport.evidence === 'object') {
          delete cleanedReport.evidence;
        }
      }
      
      await onSubmit(cleanedReport);
      handleClose();
    } catch (error) {
      console.error('Failed to submit AI-generated report:', error);
      setError(error.message || 'Failed to submit bug report');
    } finally {
      setIsSubmittingReport(false);
    }
  }, [generatedReport, attachments, onSubmit, handleClose, activeSuite, currentUser]);

  const handleEditGenerated = useCallback((field, value) => {
    setGeneratedReport(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      if (updated.ai_metadata) {
        updated.ai_metadata = {
          ...updated.ai_metadata,
          manually_edited: true,
          last_edited_at: new Date().toISOString(),
          edited_fields: [...(updated.ai_metadata.edited_fields || []), field].filter(
            (v, i, a) => a.indexOf(v) === i
          )
        };
      }
      
      return updated;
    });
  }, []);

  const handlePasteConsoleError = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setConsoleError(text);
      clearAIError();
      setError('');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      setError('Failed to read from clipboard. Please paste manually.');
    }
  }, [clearAIError]);

  const handleStartOver = useCallback(() => {
    setGeneratedReport(null);
    setAttachments([]);
    setAiGenerationMetadata(null);
    clearAIError();
    setError('');
  }, [clearAIError]);

  const isDisabled = isGeneratingBugReport || !canGenerate || (!prompt.trim() && !consoleError.trim());
  const hasInput = prompt.trim() || consoleError.trim();
  const displayError = aiError || error;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-card rounded-lg shadow-theme-xl w-[95vw] max-w-5xl min-w-[300px] max-h-[90vh] sm:max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center">
                <SparklesIcon className="h-6 w-6 text-primary mr-2" />
                AI Bug Report Generator
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeSuite ? (
                  <>
                    Suite: <span className="font-medium text-foreground">{activeSuite.name}</span>
                    {state.auth.accountType === 'organization' && (
                      <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                        Organization
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">Generate bug report with AI assistance</span>
                )}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground text-2xl p-1"
              disabled={isSubmittingReport}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Service Status */}
            <div className="flex items-center justify-center space-x-2">
              {!isInitialized ? (
                <>
                  <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-xs text-muted">Initializing AI service...</span>
                </>
              ) : isHealthy ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-success" />
                  <span className="text-xs text-success">
                    AI Ready ({provider} - {currentModel})
                  </span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-destructive">AI Service Not Available</span>
                </>
              )}
            </div>

            {/* Error Display */}
            {displayError && (
              <div className="bg-destructive/5 border border-destructive/20 rounded p-3">
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-destructive mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive flex-1">
                    <p className="font-medium">Error</p>
                    <p>{displayError}</p>
                  </div>
                  <button
                    onClick={() => {
                      clearAIError();
                      setError('');
                    }}
                    className="text-destructive hover:text-destructive ml-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Form */}
            {!generatedReport && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Issue Description
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the issue you're experiencing..."
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-vertical"
                    disabled={isGeneratingBugReport || !isInitialized}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      Console Error (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteConsoleError}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-muted-foreground bg-secondary hover:bg-accent rounded border border-border transition-colors"
                      disabled={isGeneratingBugReport || !isInitialized}
                    >
                      <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                      Paste
                    </button>
                  </div>
                  <textarea
                    value={consoleError}
                    onChange={(e) => setConsoleError(e.target.value)}
                    placeholder="Paste console errors here..."
                    rows={6}
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-vertical font-mono text-sm"
                    disabled={isGeneratingBugReport || !isInitialized}
                  />
                </div>

                {hasInput && isHealthy && (
                  <div className="bg-warning/5 border border-warning/20 rounded p-3">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-warning mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-warning">
                        <p className="font-medium">AI will analyze and generate:</p>
                        <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                          <li>Intelligent bug title and description</li>
                          <li>Detailed reproduction steps</li>
                          <li>Expected vs actual behavior</li>
                          <li>Smart severity classification</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isDisabled}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded transition-colors ${
                      isDisabled
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isGeneratingBugReport ? (
                      <>
                        <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Generated Report */}
            {generatedReport && (
              <div className="space-y-6">
                <div className="bg-success/10 border border-success/30 rounded p-3">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success mr-2" />
                    <p className="text-sm text-success font-medium">Report Generated Successfully</p>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                    <input
                      type="text"
                      value={generatedReport.title || ''}
                      onChange={(e) => handleEditGenerated('title', e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={isSubmittingReport}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <textarea
                      value={generatedReport.description || ''}
                      onChange={(e) => handleEditGenerated('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all"
                      disabled={isSubmittingReport}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Actual Behavior</label>
                      <textarea
                        value={generatedReport.actualBehavior || ''}
                        onChange={(e) => handleEditGenerated('actualBehavior', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all"
                        disabled={isSubmittingReport}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Expected Behavior</label>
                      <textarea
                        value={generatedReport.expectedBehavior || ''}
                        onChange={(e) => handleEditGenerated('expectedBehavior', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all"
                        disabled={isSubmittingReport}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Steps to Reproduce</label>
                    <textarea
                      value={generatedReport.stepsToReproduce || ''}
                      onChange={(e) => handleEditGenerated('stepsToReproduce', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all"
                      disabled={isSubmittingReport}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Severity</label>
                      <select
                        value={generatedReport.severity || ''}
                        onChange={(e) => handleEditGenerated('severity', e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isSubmittingReport}
                      >
                        <option value="">Select Severity</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                      <select
                        value={generatedReport.category || ''}
                        onChange={(e) => handleEditGenerated('category', e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isSubmittingReport}
                      >
                        <option value="">Select Category</option>
                        <option value="UI/UX">UI/UX</option>
                        <option value="Functional">Functional</option>
                        <option value="Performance">Performance</option>
                        <option value="Security">Security</option>
                        <option value="Backend">Backend</option>
                        <option value="Integration">Integration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Module</label>
                      <select
                        value={generatedReport.module_id || ''}
                        onChange={(e) => handleEditGenerated('module_id', e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isSubmittingReport}
                      >
                        <option value="">Select Module</option>
                        {modules.map(module => (
                          <option key={module.id} value={module.id}>{module.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {sprints && sprints.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Sprint (Optional)</label>
                      <select
                        value={generatedReport.sprint_id || ''}
                        onChange={(e) => handleEditGenerated('sprint_id', e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isSubmittingReport}
                      >
                        <option value="">No Sprint</option>
                        {sprints.map(sprint => (
                          <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {teamMembers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Assign To</label>
                      <select
                        value={generatedReport.assignedTo || ''}
                        onChange={(e) => handleEditGenerated('assignedTo', e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isSubmittingReport}
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <BugReportAttachments
                    attachments={attachments}
                    setAttachments={setAttachments}
                    recordings={[]}
                    isLoadingRecordings={false}
                    setError={setError}
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded hover:bg-accent"
                    disabled={isSubmittingReport}
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Start Over
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitGenerated}
                    disabled={isSubmittingReport || !generatedReport.title || !generatedReport.severity}
                    className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded transition-colors ${
                      isSubmittingReport || !generatedReport.title || !generatedReport.severity
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isSubmittingReport ? (
                      <>
                        <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Submit Bug Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBugGeneratorModal;