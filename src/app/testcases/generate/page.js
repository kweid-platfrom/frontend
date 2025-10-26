/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState, useCallback, useEffect } from 'react';
import {
    Wand2,
    ArrowLeft,
    Save,
    Download,
    Loader2,
    CheckCircle2,
    Lightbulb,
    ChevronDown,
    ChevronUp,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { useApp } from '../../../context/AppProvider';
import { useAI } from '../../../context/AIContext';
import AIGenerationForm from '../../../components/AIGenerationForm';
// No need for metadata helpers - AIContext handles it

const AIGenerationPage = () => {
    const { actions, state } = useApp();
    const { 
        generateTestCases,
        isGeneratingTestCases,
        isInitialized,
        isHealthy,
        canGenerate,
        error: aiError,
        clearError,
        currentModel
    } = useAI();

    const [step, setStep] = useState('input');
    const [prompt, setPrompt] = useState('');
    const [generatedTestCases, setGeneratedTestCases] = useState([]);
    const [selectedTestCases, setSelectedTestCases] = useState(new Set());
    const [generationSummary, setGenerationSummary] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
    const [showTips, setShowTips] = useState(false);

    const [templateConfig, setTemplateConfig] = useState({
        format: 'Given-When-Then',
        priorities: 'Critical, High, Medium, Low',
        types: 'Functional, Integration, Edge Case, Negative, Performance',
        includeTestData: true,
        framework: 'Generic',
        coverage: 'Standard',
        temperature: 0.6,
        maxTokens: 3000
    });
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    // Clear AI errors on mount and unmount
    useEffect(() => {
        clearError();
        return () => clearError();
    }, [clearError]);

    // Check AI service status on mount
    useEffect(() => {
        if (!isInitialized) {
            actions.ui.showNotification({
                type: 'warning',
                title: 'AI Service Initializing',
                message: 'Please wait while AI service initializes...'
            });
        } else if (!isHealthy) {
            actions.ui.showNotification({
                type: 'error',
                title: 'AI Service Unavailable',
                message: 'Please check your API configuration'
            });
        }
    }, [isInitialized, isHealthy, actions.ui]);

    const handleBack = () => {
        if (typeof window !== 'undefined') {
            window.history.back();
        }
    };

    const handleGenerate = useCallback(async () => {
        // Validation
        if (!prompt.trim()) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Prompt is required for test case generation'
            });
            return;
        }

        // Check AI service availability
        if (!canGenerate) {
            actions.ui.showNotification({
                type: 'error',
                title: 'AI Service Unavailable',
                message: 'Please check your Gemini API key configuration'
            });
            return;
        }

        // Check active suite
        if (!state.suites.activeSuite?.id) {
            actions.ui.showNotification({
                type: 'error',
                title: 'No Active Suite',
                message: 'Please select a test suite first'
            });
            return;
        }

        setStep('generating');

        try {
            // Use AI context's generateTestCases method
            const result = await generateTestCases(prompt, templateConfig);

            if (result.success && result.data?.testCases?.length > 0) {
                const testCasesWithIds = result.data.testCases.map((tc, index) => ({
                    ...tc,
                    id: tc.id || `generated_${Date.now()}_${index}`,
                    title: tc.title || `Test Case ${index + 1}`,
                    description: tc.description || '',
                    priority: tc.priority || 'Medium',
                    type: tc.type || 'Functional',
                    category: tc.category || 'General',
                    estimatedTime: tc.estimatedTime || '5-10 min',
                    automationPotential: tc.automationPotential || 'Medium',
                    riskLevel: tc.riskLevel || 'Medium',
                    steps: Array.isArray(tc.steps) ? tc.steps : [],
                    expectedResult: tc.expectedResult || '',
                    preconditions: tc.preconditions || '',
                    testData: tc.testData || '',
                    tags: Array.isArray(tc.tags) ? tc.tags : []
                }));

                setGeneratedTestCases(testCasesWithIds);
                
                // Create summary with operation tracking
                setGenerationSummary({
                    ...(result.data.summary || {}),
                    totalTests: testCasesWithIds.length,
                    breakdown: testCasesWithIds.reduce((acc, tc) => {
                        const type = tc.type?.toLowerCase() || 'functional';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {}),
                    aiResponse: result.data.summary?.aiResponse || 
                        `I analyzed your requirements and generated ${testCasesWithIds.length} comprehensive test cases. The test suite covers various scenarios including functional testing, edge cases, and validation flows to ensure thorough coverage of your application's requirements.`,
                    model: currentModel,
                    tokensUsed: result.tokensUsed || 0,
                    cost: result.cost || 0,
                });
                
                // Select all by default
                setSelectedTestCases(new Set(testCasesWithIds.map(tc => tc.id)));
                setStep('review');

                actions.ui.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: `Generated ${testCasesWithIds.length} test cases using ${currentModel}`
                });
            } else {
                throw new Error(result.error || result.userMessage || 'Failed to generate test cases');
            }
        } catch (error) {
            console.error('Generation error:', error);
            actions.ui.showNotification({
                type: 'error',
                title: 'Generation Error',
                message: error.message || 'Failed to generate test cases'
            });
            setStep('input');
        }
    }, [prompt, templateConfig, canGenerate, generateTestCases, currentModel, state.suites.activeSuite, actions]);

    const handleSaveSelected = useCallback(async () => {
        const testCasesToSave = generatedTestCases.filter(tc => selectedTestCases.has(tc.id));

        if (testCasesToSave.length === 0) {
            actions.ui.showNotification({
                type: 'warning',
                title: 'No Selection',
                message: 'Please select at least one test case to save'
            });
            return;
        }

        if (!state.suites.activeSuite?.id) {
            actions.ui.showNotification({
                type: 'error',
                title: 'No Active Suite',
                message: 'Please select or create a test suite first'
            });
            return;
        }

        setIsSaving(true);
        setStep('saving');
        setSavedCount(0);

        try {
            const suiteId = state.suites.activeSuite.id;
            const userId = state.auth?.user?.uid;
            let successCount = 0;
            const savedTestCaseIds = [];

            // Calculate per-test-case metrics
            const tokensPerTestCase = (generationSummary?.tokensUsed || 0) / testCasesToSave.length;
            const costPerTestCase = (generationSummary?.cost || 0) / testCasesToSave.length;

            for (const [index, testCase] of testCasesToSave.entries()) {
                try {
                    // Create AI metadata for this test case
                    const aiMetadata = {
                        generated: true,
                        assisted: false,
                        provider: currentModel?.split('-')[0] || 'gemini',
                        model: currentModel || 'gemini-1.5-flash-latest',
                        generated_at: new Date().toISOString(),
                        tokens_used: Math.round(tokensPerTestCase),
                        cost: parseFloat(costPerTestCase.toFixed(6)),
                        prompt_summary: prompt.substring(0, 200),
                        generation_timestamp: Date.now(),
                        modified_after_generation: false,
                    };

                    const cleanTestCase = {
                        ...Object.fromEntries(
                            Object.entries(testCase).filter(([key]) => !key.startsWith('_'))
                        ),
                        id: undefined,
                        suiteId: suiteId,
                        source: 'ai_generated',
                        ai_metadata: aiMetadata,
                        created_by: userId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const result = await actions.testCases.createTestCase(cleanTestCase);

                    if (result.success) {
                        successCount++;
                        setSavedCount(successCount);
                        savedTestCaseIds.push(result.data.id);
                    }
                } catch (error) {
                    console.error(`Error saving test case ${index + 1}:`, error);
                }
            }

            // Update Firestore usage log with saved asset IDs
            if (successCount > 0 && savedTestCaseIds.length > 0) {
                try {
                    const { doc, setDoc, Timestamp } = await import('firebase/firestore');
                    const { db } = await import('../../../config/firebase');
                    const { createAIUsageLog } = await import('../../../utils/aiMetadataHelper');
                    
                    // Create complete usage log with asset IDs
                    const usageLog = createAIUsageLog({
                        operationId: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        operationType: 'test_case_generation',
                        assetType: 'testCases',
                        assetIds: savedTestCaseIds,
                        provider: currentModel?.split('-')[0] || 'gemini',
                        model: currentModel,
                        tokensUsed: generationSummary?.tokensUsed || 0,
                        cost: generationSummary?.cost || 0,
                        success: true,
                        promptSummary: prompt.substring(0, 200),
                        promptLength: prompt.length,
                        userId: userId,
                        suiteId: suiteId,
                    });

                    const logRef = doc(db, `testSuites/${suiteId}/ai_usage_logs`, usageLog.id);
                    await setDoc(logRef, {
                        ...usageLog,
                        created_at: Timestamp.now()
                    });

                    console.log('✅ AI usage logged to Firestore with asset IDs:', savedTestCaseIds);
                } catch (logError) {
                    console.error('Failed to log AI usage:', logError);
                    // Don't fail the save operation
                }
            }

            if (successCount > 0) {
                actions.ui.showNotification({
                    type: 'success',
                    title: 'Test Cases Saved',
                    message: `Successfully saved ${successCount} test case${successCount === 1 ? '' : 's'}`
                });
                handleBack();
            }
        } catch (error) {
            console.error('Save operation failed:', error);
            actions.ui.showNotification({
                type: 'error',
                title: 'Save Error',
                message: error.message || 'Failed to save test cases'
            });
            setStep('review');
        } finally {
            setIsSaving(false);
        }
    }, [generatedTestCases, state.suites.activeSuite, state.auth, selectedTestCases, actions]);

    const handleExportDocument = useCallback(() => {
        const docContent = `# AI Generated Test Cases

## AI Analysis Summary
${generationSummary?.automationRecommendations || generationSummary?.riskAssessment || generationSummary?.aiResponse || 'I analyzed your requirements and generated comprehensive test cases covering the key functionality, edge cases, and user scenarios. Each test case includes detailed steps, expected results, and relevant test data to ensure thorough coverage of your application.'}

${generationSummary?.model ? `**Model Used**: ${generationSummary.model}` : ''}
${generationSummary?.tokensUsed ? `**Tokens Used**: ${generationSummary.tokensUsed.toLocaleString()}` : ''}
${generationSummary?.cost ? `**Estimated Cost**: ${generationSummary.cost.toFixed(6)}` : ''}

## Test Cases

${generatedTestCases.map((tc, index) => `
### ${index + 1}. ${tc.title}
- **ID**: ${tc.id}
- **Priority**: ${tc.priority}
- **Type**: ${tc.type}
- **Category**: ${tc.category}
- **Estimated Time**: ${tc.estimatedTime}

**Description**: ${tc.description}

**Preconditions**: ${tc.preconditions}

**Test Steps**:
${tc.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Expected Result**: ${tc.expectedResult}

**Test Data**: ${tc.testData}

**Tags**: ${tc.tags.join(', ')}

---
`).join('')}

---
*Generated with AI on ${new Date().toISOString()}*
*Suite: ${state.suites.activeSuite?.name || 'N/A'}*`;

        const blob = new Blob([docContent], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-generated-test-cases-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        actions.ui.showNotification({
            type: 'success',
            title: 'Export Complete',
            message: 'Test cases document downloaded successfully'
        });
    }, [generatedTestCases, generationSummary, state.suites.activeSuite, actions]);

    const renderHeader = () => (
        <div className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Wand2 className="h-8 w-8 text-teal-600" />
                            <Sparkles className="h-4 w-4 text-warning absolute -top-1 -right-1" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Generate Test Cases with AI</h1>
                            <p className="text-sm text-muted-foreground">
                                Generate comprehensive test cases with artificial intelligence
                                {currentModel && <span className="ml-2 text-teal-600">• {currentModel}</span>}
                                {state.suites.activeSuite && <span className="ml-2">• {state.suites.activeSuite.name}</span>}
                            </p>
                        </div>
                    </div>
                </div>
                
                {step === 'review' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportDocument}
                            className="flex items-center gap-2 px-4 py-2 text-muted-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                )}
            </div>
            
            {/* AI Service Status Warning */}
            {(!isInitialized || !isHealthy || !canGenerate) && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                    <div className="text-sm">
                        <span className="font-medium text-foreground">AI Service Status: </span>
                        <span className="text-muted-foreground">
                            {!isInitialized ? 'Initializing...' : !isHealthy ? 'Service unavailable' : 'API key not configured'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTipsPanel = () => (
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200 p-4">
            <button
                onClick={() => setShowTips(!showTips)}
                className="flex items-center justify-between w-full text-left"
            >
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-teal-600" />
                    <h3 className="font-semibold text-foreground">Tips for Better Results</h3>
                </div>
                {showTips ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showTips && (
                <div className="mt-4 space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <p className="font-medium text-foreground">✓ Be Specific</p>
                            <p className="text-muted-foreground text-xs">Include user flows, business rules, edge cases</p>
                        </div>
                        <div>
                            <p className="font-medium text-foreground">✓ Add Context</p>
                            <p className="text-muted-foreground text-xs">Mention system, platform, user roles</p>
                        </div>
                        <div>
                            <p className="font-medium text-foreground">✓ Define Success</p>
                            <p className="text-muted-foreground text-xs">State what constitutes pass/fail</p>
                        </div>
                        <div>
                            <p className="font-medium text-foreground">✓ Include Examples</p>
                            <p className="text-muted-foreground text-xs">Provide sample data or workflows</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 bg-card rounded border border-teal-200">
                        <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> &quot;Test user login with email/password, error handling for invalid credentials, 
                            password reset, account lockout after 3 attempts&quot;
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderGeneratingStep = () => (
        <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-theme-sm border border-border p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                        <div className="animate-pulse">
                            <Wand2 className="h-16 w-16 text-teal-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 animate-bounce">
                            <Sparkles className="h-6 w-6 text-warning" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Generating Test Cases...</h2>
                    <p className="text-muted-foreground mb-2 max-w-md">
                        AI is analyzing your requirements and creating comprehensive test cases.
                    </p>
                    {currentModel && (
                        <p className="text-sm text-teal-600 mb-8">
                            Using {currentModel}
                        </p>
                    )}
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                        <span className="text-sm text-muted-foreground">Please wait...</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSavingStep = () => (
        <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-theme-sm border border-border p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                        <div className="animate-pulse">
                            <Save className="h-16 w-16 text-success" />
                        </div>
                        <div className="absolute -top-2 -right-2 animate-bounce">
                            <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Saving Test Cases...</h2>
                    <p className="text-muted-foreground mb-4 max-w-md">
                        Saving {selectedTestCases.size} test case{selectedTestCases.size === 1 ? '' : 's'} to your test suite.
                    </p>
                    <p className="text-sm text-teal-600 mb-8">
                        AI tracking handled automatically
                    </p>
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-success" />
                        <span className="text-sm text-muted-foreground">
                            Saved {savedCount} of {selectedTestCases.size} test cases
                        </span>
                    </div>
                    
                    <div className="w-full max-w-md mt-4">
                        <div className="bg-muted rounded-full h-2">
                            <div 
                                className="bg-success h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(savedCount / selectedTestCases.size) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            {renderHeader()}
            
            <div className="max-w-7xl mx-auto px-6 py-8">
                {step === 'input' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3">
                            <AIGenerationForm
                                prompt={prompt}
                                setPrompt={setPrompt}
                                templateConfig={templateConfig}
                                setTemplateConfig={setTemplateConfig}
                                showAdvancedSettings={showAdvancedSettings}
                                setShowAdvancedSettings={setShowAdvancedSettings}
                                isGenerating={isGeneratingTestCases}
                                onGenerate={handleGenerate}
                                canGenerate={canGenerate}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            {renderTipsPanel()}
                        </div>
                    </div>
                )}
                {step === 'generating' && renderGeneratingStep()}
                {step === 'review' && (
                    <AIGenerationForm
                        step="review"
                        generatedTestCases={generatedTestCases}
                        setGeneratedTestCases={setGeneratedTestCases}
                        selectedTestCases={selectedTestCases}
                        setSelectedTestCases={setSelectedTestCases}
                        generationSummary={generationSummary}
                        onSaveSelected={handleSaveSelected}
                        onBackToEdit={() => setStep('input')}
                        aiProvider={currentModel?.split('-')[0] || 'gemini'}
                        aiModel={currentModel}
                        tokensUsed={generationSummary?.tokensUsed || 0}
                        cost={generationSummary?.cost || 0}
                    />
                )}
                {step === 'saving' && renderSavingStep()}
            </div>
        </div>
    );
};

export default AIGenerationPage;