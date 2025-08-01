/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState, useCallback } from 'react';
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
    Sparkles
} from 'lucide-react';
import { useApp } from '../../../context/AppProvider';
import AIGenerationForm from '../../../components/AIGenerationForm';

const AIGenerationPage = () => {
    const { actions, state } = useApp();
    const [step, setStep] = useState('input');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTestCases, setGeneratedTestCases] = useState([]);
    const [selectedTestCases, setSelectedTestCases] = useState(new Set());
    const [generationSummary, setGenerationSummary] = useState(null);
    const [isSaving, setIsSaving] = useState(false); // Fixed this line
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

    const handleBack = () => {
        if (typeof window !== 'undefined') {
            window.history.back();
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Prompt is required for test case generation'
            });
            return;
        }

        setIsGenerating(true);
        setStep('generating');

        try {
            const result = await actions.ai.generateTestCasesWithAI(
                prompt,
                'AI Generated Test Cases',
                templateConfig
            );

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
                setGenerationSummary(result.data.summary || {
                    totalTests: testCasesWithIds.length,
                    breakdown: testCasesWithIds.reduce((acc, tc) => {
                        const type = tc.type?.toLowerCase() || 'functional';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {}),
                    aiResponse: `I analyzed your requirements and generated ${testCasesWithIds.length} comprehensive test cases. The test suite covers various scenarios including functional testing, edge cases, and validation flows to ensure thorough coverage of your application's requirements.`
                });
                setSelectedTestCases(new Set(testCasesWithIds.map(tc => tc.id)));
                setStep('review');

                actions.ui.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: `Generated ${testCasesWithIds.length} test cases`
                });
            } else {
                throw new Error(result.error || 'Failed to generate test cases');
            }
        } catch (error) {
            console.error('Generation error:', error);
            actions.ui.showNotification({
                type: 'error',
                title: 'Generation Error',
                message: error.message
            });
            setStep('input');
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, templateConfig, actions]);

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
            let successCount = 0;
            const savedTestCases = [];

            for (const [index, testCase] of testCasesToSave.entries()) {
                try {
                    const cleanTestCase = {
                        ...Object.fromEntries(
                            Object.entries(testCase).filter(([key]) => !key.startsWith('_'))
                        ),
                        id: undefined,
                        suiteId: state.suites.activeSuite.id,
                        source: 'ai_generated',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const result = await actions.testCases.createTestCase(cleanTestCase);

                    if (result.success) {
                        successCount++;
                        setSavedCount(successCount);
                        savedTestCases.push(result.data);
                    }
                } catch (error) {
                    console.error(`Error saving test case ${index + 1}:`, error);
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
    }, [generatedTestCases, state.suites.activeSuite.id, selectedTestCases, actions.ui, actions.testCases]);

    const handleExportDocument = useCallback(() => {
        const docContent = `# AI Generated Test Cases

## AI Analysis Summary
${generationSummary?.automationRecommendations || generationSummary?.riskAssessment || generationSummary?.aiResponse || 'I analyzed your requirements and generated comprehensive test cases covering the key functionality, edge cases, and user scenarios. Each test case includes detailed steps, expected results, and relevant test data to ensure thorough coverage of your application.'}

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
`).join('')}`;

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
    }, [generatedTestCases, generationSummary, actions]);

    const renderHeader = () => (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <div className="h-6 w-px bg-gray-300" />
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Wand2 className="h-8 w-8 text-teal-600" />
                            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">AI Test Case Generation</h1>
                            <p className="text-sm text-gray-600">Generate comprehensive test cases with artificial intelligence</p>
                        </div>
                    </div>
                </div>
                
                {step === 'review' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportDocument}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTipsPanel = () => (
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg border border-teal-200 p-4">
            <button
                onClick={() => setShowTips(!showTips)}
                className="flex items-center justify-between w-full text-left"
            >
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-teal-600" />
                    <h3 className="font-semibold text-gray-900">Tips for Better Results</h3>
                </div>
                {showTips ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showTips && (
                <div className="mt-4 space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <p className="font-medium text-gray-900">✓ Be Specific</p>
                            <p className="text-gray-600 text-xs">Include user flows, business rules, edge cases</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">✓ Add Context</p>
                            <p className="text-gray-600 text-xs">Mention system, platform, user roles</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">✓ Define Success</p>
                            <p className="text-gray-600 text-xs">State what constitutes pass/fail</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">✓ Include Examples</p>
                            <p className="text-gray-600 text-xs">Provide sample data or workflows</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 bg-white rounded border border-teal-200">
                        <p className="text-xs text-gray-700">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                        <div className="animate-pulse">
                            <Wand2 className="h-16 w-16 text-teal-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 animate-bounce">
                            <Sparkles className="h-6 w-6 text-yellow-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Generating Test Cases...</h2>
                    <p className="text-gray-600 mb-8 max-w-md">
                        AI is analyzing your requirements and creating comprehensive test cases.
                    </p>
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                        <span className="text-sm text-gray-500">Please wait...</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSavingStep = () => (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                        <div className="animate-pulse">
                            <Save className="h-16 w-16 text-green-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 animate-bounce">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Saving Test Cases...</h2>
                    <p className="text-gray-600 mb-8 max-w-md">
                        Saving {selectedTestCases.size} test case{selectedTestCases.size === 1 ? '' : 's'} to your test suite.
                    </p>
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                        <span className="text-sm text-gray-500">
                            Saved {savedCount} of {selectedTestCases.size} test cases
                        </span>
                    </div>
                    
                    <div className="w-full max-w-md mt-4">
                        <div className="bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(savedCount / selectedTestCases.size) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
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
                                isGenerating={isGenerating}
                                onGenerate={handleGenerate}
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
                    />
                )}
                {step === 'saving' && renderSavingStep()}
            </div>
        </div>
    );
};

export default AIGenerationPage;