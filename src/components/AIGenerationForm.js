'use client'
import React, { useState, useCallback } from 'react';
import {
    Wand2,
    Settings,
    Save,
    CheckCircle2,
    Edit2,
    Check,
    X,
    Sparkles
} from 'lucide-react';

const AIGenerationForm = ({
    // Input step props
    prompt,
    setPrompt,
    templateConfig,
    setTemplateConfig,
    showAdvancedSettings,
    setShowAdvancedSettings,
    isGenerating,
    onGenerate,
    // Review step props
    step,
    generatedTestCases = [],
    setGeneratedTestCases,
    selectedTestCases = new Set(),
    setSelectedTestCases,
    generationSummary,
    onSaveSelected,
    onBackToEdit
}) => {
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');

    const handleConfigChange = useCallback((field, value) => {
        setTemplateConfig(prev => ({ ...prev, [field]: value }));
    }, [setTemplateConfig]);

    const handleToggleSelect = useCallback((testCaseId) => {
        setSelectedTestCases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testCaseId)) {
                newSet.delete(testCaseId);
            } else {
                newSet.add(testCaseId);
            }
            return newSet;
        });
    }, [setSelectedTestCases]);

    const handleSelectAll = useCallback(() => {
        if (selectedTestCases.size === generatedTestCases.length) {
            setSelectedTestCases(new Set());
        } else {
            setSelectedTestCases(new Set(generatedTestCases.map(tc => tc.id)));
        }
    }, [selectedTestCases.size, generatedTestCases, setSelectedTestCases]);

    const startEdit = (testCaseId, field, currentValue) => {
        setEditingCell(`${testCaseId}-${field}`);
        setEditValue(Array.isArray(currentValue) ? currentValue.join('\n') : currentValue);
    };

    const saveEdit = () => {
        if (!editingCell) return;
        
        const [testCaseId, field] = editingCell.split('-');
        const newValue = field === 'steps' ? editValue.split('\n').filter(s => s.trim()) : editValue;
        
        setGeneratedTestCases(prev =>
            prev.map(tc => tc.id === testCaseId ? { ...tc, [field]: newValue } : tc)
        );
        
        setEditingCell(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const renderInputForm = () => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Generate Test Cases with AI
                    </h2>
                    <p className="text-gray-600">
                        Describe your requirements to automatically generate comprehensive test cases.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requirements / User Story *
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter requirements, user story, or feature description..."
                        className="w-full border border-gray-300 rounded-md px-4 py-3 h-40 resize-y focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm"
                        disabled={isGenerating}
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            {prompt.length} characters
                        </span>
                        <span className="text-xs text-gray-500">
                            Recommended: 200+ characters
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 transition-colors"
                    disabled={isGenerating}
                >
                    <Settings size={16} />
                    {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                </button>

                {showAdvancedSettings && (
                    <div className="border border-gray-200 rounded-md p-6 space-y-4 bg-gray-50">
                        <h3 className="font-medium text-gray-900">Advanced Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                                <select
                                    value={templateConfig.format}
                                    onChange={(e) => handleConfigChange('format', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="Given-When-Then">Given-When-Then</option>
                                    <option value="BDD">BDD</option>
                                    <option value="Standard">Standard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Framework</label>
                                <select
                                    value={templateConfig.framework}
                                    onChange={(e) => handleConfigChange('framework', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="Generic">Generic</option>
                                    <option value="Cypress">Cypress</option>
                                    <option value="Selenium">Selenium</option>
                                    <option value="Playwright">Playwright</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Test Types</label>
                            <input
                                type="text"
                                value={templateConfig.types}
                                onChange={(e) => handleConfigChange('types', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="Functional, Integration, Edge Case, etc."
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={templateConfig.includeTestData}
                                onChange={(e) => handleConfigChange('includeTestData', e.target.checked)}
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">Include Test Data Examples</label>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        onClick={onGenerate}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded hover:from-teal-700 hover:to-teal-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        disabled={isGenerating || !prompt?.trim()}
                    >
                        <Wand2 size={16} />
                        {isGenerating ? 'Generating...' : 'Generate Test Cases'}
                    </button>
                </div>
            </div>
        </div>
    );

    const EditableCell = ({ value, testCaseId, field, isEditing, multiline = false }) => {
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        const cellKey = `${testCaseId}-${field}`;
        
        if (isEditing && editingCell === cellKey) {
            return (
                <div className="flex items-center gap-2">
                    {multiline ? (
                        <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs resize-y"
                            rows={3}
                            autoFocus
                        />
                    ) : (
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                            autoFocus
                        />
                    )}
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                        <Check size={12} />
                    </button>
                    <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                        <X size={12} />
                    </button>
                </div>
            );
        }

        return (
            <div 
                className="group flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => startEdit(testCaseId, field, value)}
            >
                <span className="text-xs text-gray-900 flex-1">{displayValue}</span>
                <Edit2 size={10} className="text-gray-400 opacity-0 group-hover:opacity-100" />
            </div>
        );
    };

    const renderTestCasesByType = () => {
        const groupedTestCases = generatedTestCases.reduce((acc, tc) => {
            const type = tc.type || 'Functional';
            if (!acc[type]) acc[type] = [];
            acc[type].push(tc);
            return acc;
        }, {});

        return Object.entries(groupedTestCases).map(([type, testCases]) => (
            <div key={type} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {type} Tests ({testCases.length})
                </h3>
                
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={testCases.every(tc => selectedTestCases.has(tc.id))}
                                            onChange={() => {
                                                const allSelected = testCases.every(tc => selectedTestCases.has(tc.id));
                                                const newSet = new Set(selectedTestCases);
                                                testCases.forEach(tc => {
                                                    if (allSelected) {
                                                        newSet.delete(tc.id);
                                                    } else {
                                                        newSet.add(tc.id);
                                                    }
                                                });
                                                setSelectedTestCases(newSet);
                                            }}
                                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Test Case Description
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Preconditions
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Steps
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expected Result
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {testCases.map((testCase, index) => (
                                    <tr 
                                        key={testCase.id} 
                                        className={`hover:bg-gray-50 ${selectedTestCases.has(testCase.id) ? 'bg-teal-50' : ''}`}
                                    >
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedTestCases.has(testCase.id)}
                                                onChange={() => handleToggleSelect(testCase.id)}
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                                            TC-{String(index + 1).padStart(3, '0')}
                                        </td>
                                        <td className="px-3 py-4 text-xs text-gray-900 max-w-xs">
                                            <div className="font-medium mb-1">
                                                <EditableCell 
                                                    value={testCase.title} 
                                                    testCaseId={testCase.id} 
                                                    field="title" 
                                                    isEditing={true}
                                                />
                                            </div>
                                            <EditableCell 
                                                value={testCase.description} 
                                                testCaseId={testCase.id} 
                                                field="description" 
                                                isEditing={true}
                                                multiline={true}
                                            />
                                        </td>
                                        <td className="px-3 py-4 text-xs text-gray-900 max-w-xs">
                                            <EditableCell 
                                                value={testCase.preconditions} 
                                                testCaseId={testCase.id} 
                                                field="preconditions" 
                                                isEditing={true}
                                                multiline={true}
                                            />
                                        </td>
                                        <td className="px-3 py-4 text-xs text-gray-900 max-w-xs">
                                            <EditableCell 
                                                value={testCase.steps} 
                                                testCaseId={testCase.id} 
                                                field="steps" 
                                                isEditing={true}
                                                multiline={true}
                                            />
                                        </td>
                                        <td className="px-3 py-4 text-xs text-gray-900 max-w-xs">
                                            <EditableCell 
                                                value={testCase.expectedResult} 
                                                testCaseId={testCase.id} 
                                                field="expectedResult" 
                                                isEditing={true}
                                                multiline={true}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ));
    };

    const renderReviewStep = () => (
        <div className="space-y-6">
            {generationSummary && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="relative">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                        </div>
                        AI Analysis
                    </h3>
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 border border-teal-200">
                        <p className="text-gray-700 leading-relaxed">
                            {generationSummary?.automationRecommendations || 
                             generationSummary?.riskAssessment || 
                             generationSummary?.aiResponse ||
                             `I analyzed your requirements and generated ${generatedTestCases.length} comprehensive test cases. The test suite covers various scenarios including functional testing, edge cases, and validation flows to ensure thorough coverage of your application's requirements. Each test case has been designed with clear steps, expected results, and appropriate priority levels.`}
                        </p>
                        {generationSummary?.coverageAreas && generationSummary.coverageAreas.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-teal-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">Coverage Areas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {generationSummary.coverageAreas.map((area, index) => (
                                        <span key={index} className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Generated Test Cases ({generatedTestCases.length})
                            </h3>
                            <span className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-full font-medium">
                                {selectedTestCases.size} selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSelectAll}
                                className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
                            >
                                {selectedTestCases.size === generatedTestCases.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <div className="h-4 w-px bg-gray-300" />
                            <button
                                onClick={onBackToEdit}
                                className="px-3 py-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                            >
                                Back to Edit
                            </button>
                            <button
                                onClick={onSaveSelected}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md hover:from-green-700 hover:to-green-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                disabled={selectedTestCases.size === 0}
                            >
                                <Save size={16} />
                                Save Selected ({selectedTestCases.size})
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {renderTestCasesByType()}
                    
                    {generatedTestCases.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-500">No test cases generated yet.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Main render logic
    if (step === 'review') {
        return renderReviewStep();
    }

    return renderInputForm();
};

export default AIGenerationForm;