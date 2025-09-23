import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppProvider';
import { useAISuggestions } from '../../context/AIContext';
import { 
  Target, FileText, Bug, Zap, X, Loader,
  Database, TrendingUp, Calculator, Filter, BarChart3, FileCheck, Shuffle
} from 'lucide-react';

const AppAITooltips = ({ pageType = 'general', monitoredData = null, contextData = {} }) => {
  const { 
    aiAvailable,
    aiHealthy, 
    aiError, 
    aiOperations,
    actions 
  } = useApp();
  
  const { monitorData } = useAISuggestions(pageType);
  
  const [activeTooltips, setActiveTooltips] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const tooltipRefs = useRef({});
  const drawerRef = useRef(null);

  // Monitor data changes for AI suggestions
  useEffect(() => {
    if (monitoredData && monitorData) {
      monitorData(monitoredData);
    }
  }, [monitoredData, monitorData]);

  // Enhanced tooltip generation covering all AI capabilities
  useEffect(() => {
    if (!aiAvailable || !monitoredData || aiError) return;
    
    const generateTooltips = async () => {
      const tooltips = [];
      
      // 1. Test Case Generation & Prioritization
      if (pageType === 'test-management') {
        if (monitoredData.requirements && !monitoredData.testCases?.length) {
          tooltips.push({
            id: 'generate-tests',
            type: 'generation',
            element: '.test-creation-area',
            icon: Zap,
            title: 'Generate Test Cases',
            preview: 'AI can create App test cases from requirements',
            confidence: 88,
            action: 'generate-test-cases',
            data: monitoredData.requirements,
            isGenerating: aiOperations.generateTestCases
          });
        }

        if (monitoredData.testCases?.length > 5) {
          tooltips.push({
            id: 'prioritize-tests',
            type: 'optimization',
            element: '.test-list-header',
            icon: Target,
            title: 'Smart Prioritization',
            preview: 'Optimize test execution order for maximum efficiency',
            confidence: 92,
            action: 'prioritize-tests',
            data: monitoredData.testCases,
            isGenerating: aiOperations.prioritizeTests
          });
        }

        // Regression test selection
        if (monitoredData.changedComponents?.length > 0 && monitoredData.testCases?.length > 20) {
          tooltips.push({
            id: 'regression-selection',
            type: 'optimization',
            element: '.regression-panel',
            icon: Filter,
            title: 'Smart Regression Selection',
            preview: 'Select optimal subset of tests based on code changes',
            confidence: 85,
            action: 'select-regression',
            data: { changes: monitoredData.changedComponents, tests: monitoredData.testCases },
            isGenerating: aiOperations.selectRegressionTests
          });
        }
      }

      // 2. Bug Management & Severity Assessment
      if (pageType === 'bug-management') {
        if (monitoredData.bugs?.some(bug => !bug.severity)) {
          tooltips.push({
            id: 'assess-severity',
            type: 'assessment',
            element: '.bug-item:not([data-severity])',
            icon: Bug,
            title: 'Severity Assessment',
            preview: 'AI can assess bug severity, priority, and impact',
            confidence: 94,
            action: 'assess-bug-severity',
            data: monitoredData.bugs?.find(bug => !bug.severity),
            isGenerating: aiOperations.assessBugSeverity
          });
        }

        // Defect trend analysis
        if (monitoredData.bugs?.length > 10) {
          tooltips.push({
            id: 'trend-analysis',
            type: 'insights',
            element: '.bugs-dashboard',
            icon: TrendingUp,
            title: 'Defect Trend Analysis',
            preview: 'Identify patterns and predict quality risks',
            confidence: 87,
            action: 'analyze-trends',
            data: monitoredData.bugs,
            isGenerating: aiOperations.analyzeDefectTrends
          });
        }
      }

      // 3. Requirements & Documentation
      if (pageType === 'documents' || pageType === 'requirements') {
        if (monitoredData.documentContent?.length > 200) {
          tooltips.push({
            id: 'analyze-requirements',
            type: 'quality',
            element: '.document-editor',
            icon: FileCheck,
            title: 'Requirement Analysis',
            preview: 'Check clarity, completeness, and testability',
            confidence: 89,
            action: 'analyze-requirements',
            data: monitoredData.documentContent,
            isGenerating: aiOperations.analyzeRequirements
          });
        }

        if (monitoredData.documentType && monitoredData.documentContent?.length > 500) {
          tooltips.push({
            id: 'improve-documentation',
            type: 'improvement',
            element: '.document-toolbar',
            icon: FileText,
            title: 'Improve Documentation',
            preview: 'Enhance clarity, structure, and professional quality',
            confidence: 83,
            action: 'improve-docs',
            data: { content: monitoredData.documentContent, type: monitoredData.documentType },
            isGenerating: aiOperations.improveDocumentation
          });
        }
      }

      // 4. Test Data Generation
      if (pageType === 'test-data' || (monitoredData.testCases?.some(tc => !tc.testData))) {
        tooltips.push({
          id: 'generate-test-data',
          type: 'generation',
          element: '.test-data-section',
          icon: Database,
          title: 'Generate Test Data',
          preview: 'Create realistic test data for App testing',
          confidence: 91,
          action: 'generate-test-data',
          data: monitoredData.requirements || monitoredData.testCases,
          isGenerating: aiOperations.generateTestData
        });
      }

      // 5. Effort Estimation
      if (pageType === 'project-planning' || contextData.needsEstimation) {
        tooltips.push({
          id: 'estimate-effort',
          type: 'planning',
          element: '.planning-section',
          icon: Calculator,
          title: 'Estimate Test Effort',
          preview: 'Get accurate time and resource estimates',
          confidence: 86,
          action: 'estimate-effort',
          data: monitoredData.testScope || contextData.scope,
          isGenerating: aiOperations.estimateTestEffort
        });
      }

      // 6. Dashboard & Reporting Insights
      if (pageType === 'dashboard' && monitoredData.metrics) {
        tooltips.push({
          id: 'metrics-insights',
          type: 'insights',
          element: '.metrics-panel',
          icon: BarChart3,
          title: 'Quality Insights',
          preview: 'Get actionable insights from your QA metrics',
          confidence: 84,
          action: 'analyze-metrics',
          data: monitoredData.metrics,
          isGenerating: aiOperations.analyzeQualityMetrics
        });
      }

      // 7. Cross-cutting AI suggestions
      if (monitoredData.recentActivity?.length > 0) {
        // Workflow optimization
        tooltips.push({
          id: 'workflow-optimization',
          type: 'optimization',
          element: '.activity-feed',
          icon: Shuffle,
          title: 'Workflow Insights',
          preview: 'AI detected optimization opportunities in your workflow',
          confidence: 78,
          action: 'optimize-workflow',
          data: monitoredData.recentActivity,
          isGenerating: aiOperations.analyzeWorkflow
        });
      }

      setActiveTooltips(tooltips);
    };

    generateTooltips();
  }, [pageType, monitoredData, contextData, aiAvailable, aiError, aiOperations]);

  // Enhanced AI operation handler
  const handleTooltipClick = useCallback(async (tooltip) => {
    setSelectedContext(tooltip);
    setDrawerOpen(true);
    setAnalyzing(true);
    
    try {
      let analysis = null;
      
      switch (tooltip.action) {
        case 'generate-test-cases':
          analysis = await actions.ai.generateTestCases(tooltip.data, {
            includePrioritization: true,
            includeDataRequirements: true,
            includeAutomationGuidance: true
          });
          break;

        case 'prioritize-tests':
          analysis = await actions.ai.prioritizeTests(tooltip.data, {
            phase: contextData.phase || 'Execution Planning',
            timeConstraints: contextData.timeConstraints || 'Standard',
            riskTolerance: contextData.riskTolerance || 'Medium'
          });
          break;

        case 'select-regression':
          analysis = await actions.ai.selectRegressionTests?.(
            tooltip.data.changes, 
            tooltip.data.tests,
            { timeBudget: '4 hours', riskTolerance: 'Medium' }
          );
          break;

        case 'assess-bug-severity':
          analysis = await actions.ai.assessBugSeverity(tooltip.data, {
            applicationType: contextData.applicationType || 'Web Application',
            businessCriticality: contextData.businessCriticality || 'High'
          });
          break;

        case 'analyze-trends':
          analysis = await actions.ai.analyzeDefectTrends(tooltip.data, '30 days');
          break;

        case 'analyze-requirements':
          analysis = await actions.ai.analyzeRequirements(tooltip.data, {
            projectType: contextData.projectType || 'Web Application',
            criticality: contextData.criticality || 'Medium'
          });
          break;

        case 'improve-docs':
          analysis = await actions.ai.improveDocumentation(
            tooltip.data.content, 
            tooltip.data.type, 
            { clarity: true, completeness: true, professional: true }
          );
          break;

        case 'generate-test-data':
          analysis = await actions.ai.generateTestData(tooltip.data, {
            volume: 'Medium',
            realism: 'High',
            includeEdgeCases: true,
            format: 'JSON'
          });
          break;

        case 'estimate-effort':
          analysis = await actions.ai.estimateTestEffort?.(tooltip.data, {
            projectType: contextData.projectType || 'Web Application',
            teamExperience: contextData.teamExperience || 'Medium',
            automationLevel: contextData.automationLevel || '30%'
          });
          break;

        case 'analyze-metrics':
          analysis = await actions.ai.analyzeQualityMetrics?.(tooltip.data);
          break;

        case 'optimize-workflow':
          analysis = await actions.ai.analyzeWorkflow?.(tooltip.data);
          break;

        default:
          analysis = { success: false, error: 'Unknown AI operation' };
      }
      
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiAnalysis({ success: false, error: error.message });
    } finally {
      setAnalyzing(false);
    }
  }, [monitoredData, contextData, actions.ai]);

  // Enhanced tooltip positioning system
  const calculateTooltipPosition = useCallback((elementSelector) => {
    try {
      const element = document.querySelector(elementSelector);
      if (!element) return { top: '10px', right: '10px' };

      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Calculate optimal position
      const elementTop = rect.top + scrollTop;
      const elementRight = rect.right + scrollLeft;
      
      // Position tooltip at top-right of element with some padding
      return {
        position: 'absolute',
        top: `${elementTop}px`,
        left: `${elementRight - 40}px`,
        transform: 'translateY(-50%)'
      };
    } catch (error) {
      // Fallback position if element not found or positioning fails
      return { 
        position: 'fixed',
        top: '20px', 
        right: '20px' 
      };
    }
  }, []);

  // Enhanced tooltip indicator with dynamic positioning and loading states
  const TooltipIndicator = ({ tooltip }) => {
    const [position, setPosition] = useState({ top: '10px', right: '10px' });
    const IconComponent = tooltip.icon;
    const isCurrentlyGenerating = tooltip.isGenerating || analyzing;
    
    useEffect(() => {
      // Calculate position when tooltip mounts or element changes
      if (tooltip.element) {
        const pos = calculateTooltipPosition(tooltip.element);
        setPosition(pos);
      }
    }, [tooltip.element, calculateTooltipPosition]);

    const getTooltipColor = (type) => {
      const colors = {
        generation: 'bg-green-500 hover:bg-green-600 shadow-green-200',
        optimization: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
        assessment: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
        quality: 'bg-purple-500 hover:bg-purple-600 shadow-purple-200',
        improvement: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200',
        insights: 'bg-pink-500 hover:bg-pink-600 shadow-pink-200',
        planning: 'bg-teal-500 hover:bg-teal-600 shadow-teal-200'
      };
      return colors[type] || 'bg-gray-500 hover:bg-gray-600 shadow-gray-200';
    };
    
    return (
      <div 
        ref={el => tooltipRefs.current[tooltip.id] = el}
        className="z-40 group cursor-pointer animate-pulse hover:animate-none"
        style={position}
        onClick={() => !isCurrentlyGenerating && handleTooltipClick(tooltip)}
      >
        <div className="relative">
          {/* Main tooltip button */}
          <div className={`${getTooltipColor(tooltip.type)} text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${isCurrentlyGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isCurrentlyGenerating ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <IconComponent size={18} />
            )}
            
            {/* Pulsing ring animation */}
            {!isCurrentlyGenerating && (
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current"></div>
            )}
          </div>
          
          {/* Confidence badge */}
          <div className="absolute -top-1 -right-1 bg-white border-2 border-current text-current text-xs rounded-full px-2 py-0.5 min-w-[28px] h-6 flex items-center justify-center font-bold shadow-sm">
            {tooltip.confidence}
          </div>

          {/* Type indicator */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white text-gray-700 text-xs px-2 py-0.5 rounded-full shadow-sm border">
            {tooltip.type.charAt(0).toUpperCase() + tooltip.type.slice(1)}
          </div>

          {/* Loading indicator */}
          {isCurrentlyGenerating && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              AI Processing...
            </div>
          )}
        </div>
        
        {/* Enhanced hover preview */}
        {!isCurrentlyGenerating && (
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform translate-y-1 group-hover:translate-y-0">
            <div className="bg-gray-900 text-white text-sm rounded-lg p-4 whitespace-nowrap max-w-sm shadow-xl">
              <div className="flex items-center space-x-2 mb-2">
                <IconComponent size={16} />
                <span className="font-semibold">{tooltip.title}</span>
              </div>
              <div className="text-gray-300 text-xs mb-3">{tooltip.preview}</div>
              
              {/* Productivity metrics preview */}
              <div className="border-t border-gray-700 pt-2 mt-2">
                <div className="text-xs text-gray-400">
                  Confidence: {tooltip.confidence}% • Click for AI analysis
                </div>
              </div>
              
              {/* Tooltip arrow */}
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced analysis results with support for all AI capabilities
  const AnalysisResults = ({ analysis, context }) => {
    if (!analysis.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Analysis Failed</h4>
          <p className="text-red-600 text-sm">{analysis.error}</p>
        </div>
      );
    }

    const data = analysis.data;

    switch (context.action) {
      case 'generate-test-cases':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Test Cases Generated</h4>
              <p className="text-green-700 text-sm">
                Generated {data.testCases?.length || 0} App test cases
              </p>
              {analysis.productivity && (
                <p className="text-green-600 text-xs mt-1">
                  ⏱️ {analysis.productivity.estimatedManualTime} saved
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">Test Case Breakdown:</h5>
              {data.summary && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-blue-50 p-2 rounded">Functional: {data.summary.breakdown?.functional || 0}</div>
                  <div className="bg-purple-50 p-2 rounded">Integration: {data.summary.breakdown?.integration || 0}</div>
                  <div className="bg-yellow-50 p-2 rounded">Edge Cases: {data.summary.breakdown?.edgeCase || 0}</div>
                  <div className="bg-red-50 p-2 rounded">Negative: {data.summary.breakdown?.negative || 0}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h5 className="font-medium">Sample Test Cases:</h5>
              {data.testCases?.slice(0, 2).map((test, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="font-medium mb-1">{test.title}</div>
                  <div className="text-gray-600 mb-2">{test.description}</div>
                  <div className="flex justify-between text-xs">
                    <span className={`px-2 py-1 rounded ${
                      test.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {test.priority}
                    </span>
                    <span className="text-gray-500">{test.estimatedTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'prioritize-tests':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Prioritization Complete</h4>
              <p className="text-blue-700 text-sm">
                {data.prioritizedTests?.length} tests analyzed and prioritized
              </p>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium">Top Priority Tests:</h5>
              {data.prioritizedTests?.slice(0, 3).map((test, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h6 className="font-medium text-sm">{test.title}</h6>
                    <span className={`px-2 py-1 rounded text-xs ${
                      test.priorityLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                      test.priorityLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {test.priorityLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{test.reasoning}</p>
                  <div className="text-xs text-gray-500">
                    Score: {test.priorityScore}/100 • {test.estimatedEffort}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'assess-bug-severity':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Severity Assessment</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Severity:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    data.assessment?.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    data.assessment?.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {data.assessment?.severity}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Priority:</span>
                  <span className="ml-2 font-medium">{data.assessment?.priority}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium">Impact Analysis:</h5>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div><span className="font-medium">User Impact:</span> {data.impactAnalysis?.userImpact}</div>
                <div><span className="font-medium">Business Impact:</span> {data.impactAnalysis?.businessImpact}</div>
                <div><span className="font-medium">Affected Users:</span> {data.impactAnalysis?.affectedUsers}</div>
              </div>
              
              <h5 className="font-medium">Reasoning:</h5>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {data.assessment?.reasoning}
              </p>
            </div>
          </div>
        );

      case 'analyze-requirements':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">Quality Analysis</h4>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Overall Score:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-purple-200 rounded">
                    <div 
                      className="h-full bg-purple-500 rounded"
                      style={{ width: `${data.overallScore || 75}%` }}
                    />
                  </div>
                  <span className="font-bold text-purple-800">
                    {data.overallGrade || 'B+'}
                  </span>
                </div>
              </div>
            </div>

            {data.summary && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="font-bold text-green-800">{data.summary.highQuality || 0}</div>
                  <div className="text-green-600">High Quality</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="font-bold text-red-800">{data.summary.criticalIssues || 0}</div>
                  <div className="text-red-600">Critical Issues</div>
                </div>
              </div>
            )}

            {data.recommendations?.immediate && (
              <div className="space-y-2">
                <h5 className="font-medium">Immediate Actions:</h5>
                <div className="space-y-1">
                  {data.recommendations.immediate.slice(0, 3).map((rec, index) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-2 text-sm">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-gray-600">Analysis completed</div>;
    }
  };

  // Enhanced action buttons for all AI capabilities
  const ActionButtons = ({ analysis, context }) => {
    const handleAction = (actionType = null) => {
      switch (actionType) {
        case 'apply-test-cases':
          // Integration with your existing test case creation
          if (analysis.data?.testCases) {
            actions.testCases.createMultipleTestCases?.(analysis.data.testCases);
          }
          break;
          
        case 'apply-priority':
          // Apply AI-suggested priorities to existing test cases
          if (analysis.data?.prioritizedTests) {
            analysis.data.prioritizedTests.forEach(test => {
              actions.testCases.updateTestCase?.(test.id, {
                priority: test.priorityLevel,
                priorityScore: test.priorityScore
              });
            });
          }
          break;
          
        case 'apply-severity':
          // Apply AI-assessed severity to bug
          if (analysis.data?.assessment && context.data?.id) {
            actions.bugs.updateBug?.(context.data.id, {
              severity: analysis.data.assessment.severity,
              priority: analysis.data.assessment.priority,
              aiAssessment: analysis.data.assessment
            });
          }
          break;
          
        case 'export-test-data':
          // Download generated test data
          if (analysis.data?.testDataSets) {
            const dataBlob = new Blob([
              JSON.stringify(analysis.data.testDataSets, null, 2)
            ], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ai-generated-test-data.json';
            a.click();
            URL.revokeObjectURL(url);
          }
          break;
          
        case 'view-full-analysis':
          // Open detailed analysis view
          actions.ui.openModal?.({
            type: 'ai-analysis-detail',
            data: analysis.data,
            context: context
          });
          break;
      }
      
      // Show success notification
      actions.ui.showNotification?.({
        id: `ai-action-${Date.now()}`,
        type: 'success',
        message: `Applied AI ${context.title.toLowerCase()} successfully`,
        duration: 3000
      });
      
      setDrawerOpen(false);
    };

    const getActionButtons = () => {
      const buttons = [];
      
      switch (context.action) {
        case 'generate-test-cases':
          buttons.push(
            <button 
              key="apply"
              onClick={() => handleAction('apply-test-cases')}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              Create {analysis.data?.testCases?.length || 0} Test Cases
            </button>
          );
          break;

        case 'prioritize-tests':
          buttons.push(
            <button 
              key="apply"
              onClick={() => handleAction('apply-priority')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Apply Priority Order
            </button>
          );
          break;

        case 'assess-bug-severity':
          buttons.push(
            <button 
              key="apply"
              onClick={() => handleAction('apply-severity')}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Apply Severity: {analysis.data?.assessment?.severity}
            </button>
          );
          break;
      }

      // Always add view full analysis button
      if (analysis.data && Object.keys(analysis.data).length > 0) {
        buttons.push(
          <button 
            key="view-full"
            onClick={() => handleAction('view-full-analysis')}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border"
          >
            View Full Analysis
          </button>
        );
      }

      return buttons;
    };

    return (
      <div className="space-y-2">
        {getActionButtons()}
        
        <button 
          onClick={() => setDrawerOpen(false)}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          Close Analysis
        </button>
      </div>
    );
  };

  // Analysis drawer
  const AnalysisDrawer = () => {
    if (!drawerOpen || !selectedContext) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div 
          className="absolute inset-0 bg-black bg-opacity-25"
          onClick={() => setDrawerOpen(false)}
        />
        
        <div 
          ref={drawerRef}
          className="absolute left-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
          style={{
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)'
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <selectedContext.icon className="text-blue-500" size={20} />
                <h3 className="font-semibold">{selectedContext.title}</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {analyzing ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Loader className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-gray-600">AI is analyzing...</p>
                  </div>
                </div>
              ) : aiAnalysis ? (
                <AnalysisResults analysis={aiAnalysis} context={selectedContext} />
              ) : (
                <div className="text-gray-600">Click to start AI analysis</div>
              )}
            </div>
            
            {/* Actions */}
            {aiAnalysis?.success && (
              <div className="border-t p-4 space-y-2">
                <ActionButtons analysis={aiAnalysis} context={selectedContext} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Configuration-aware tooltip filtering
  const filterTooltipsByConfig = useCallback((tooltips) => {
    const config = JSON.parse(localStorage.getItem('aiTooltipsConfig') || '{}');
    
    if (!config.enabled) return [];
    
    return tooltips
      .filter(tooltip => {
        // Filter by enabled features
        const featureMap = {
          'generate-test-cases': 'testGeneration',
          'prioritize-tests': 'testPrioritization',
          'assess-bug-severity': 'bugSeverityAssessment',
          'analyze-requirements': 'requirementAnalysis',
          'improve-docs': 'documentImprovement',
          'generate-test-data': 'testDataGeneration',
          'estimate-effort': 'effortEstimation',
          'analyze-trends': 'defectTrendAnalysis'
        };
        
        const featureKey = featureMap[tooltip.action];
        if (featureKey && !config.enabledFeatures?.[featureKey]) {
          return false;
        }
        
        // Filter by confidence threshold
        if (tooltip.confidence < (config.minConfidence || 75)) {
          return false;
        }
        
        return true;
      })
      .slice(0, config.maxTooltips || 3); // Limit number of tooltips
  }, []);

  // Apply configuration filtering to active tooltips
  const memoizedTooltips = useMemo(() => {
    return filterTooltipsByConfig(activeTooltips);
  }, [activeTooltips, filterTooltipsByConfig]);

  // Tooltip lifecycle management
  useEffect(() => {
    // Auto-hide tooltips after configured time
    const tooltipConfig = JSON.parse(localStorage.getItem('aiTooltipsConfig') || '{}');
    const autoHideTime = tooltipConfig.autoHide || 30000;
    
    if (activeTooltips.length > 0 && autoHideTime > 0) {
      const timer = setTimeout(() => {
        setActiveTooltips(prev => prev.map(tooltip => ({
          ...tooltip,
          autoHidden: true
        })));
      }, autoHideTime);
      
      return () => clearTimeout(timer);
    }
  }, [activeTooltips]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(tooltipRefs.current).forEach(ref => {
        if (ref && ref.remove) ref.remove();
      });
    };
  }, []);

  if (!aiAvailable || !aiHealthy || memoizedTooltips.length === 0) {
    return null;
  }

  return (
    <>
      {/* Render filtered tooltips */}
      {memoizedTooltips.map(tooltip => (
        <TooltipIndicator key={tooltip.id} tooltip={tooltip} />
      ))}
      
      {/* Analysis drawer */}
      <AnalysisDrawer />
      
      {/* Accessibility announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        className="sr-only"
        aria-label={`${memoizedTooltips.length} AI suggestions available`}
      >
        {memoizedTooltips.length > 0 && 
          `${memoizedTooltips.length} AI suggestions available on this page`
        }
      </div>
    </>
  );
};

// Specialized tooltip components for different page types
export const TestManagementTooltips = ({ testCases = [], requirements = '', changedComponents = [] }) => {
  const contextData = useMemo(() => ({
    phase: 'Development',
    timeConstraints: 'Standard',
    riskTolerance: 'Medium',
    changeImpact: changedComponents.length > 0 ? 'High' : 'Low'
  }), [changedComponents]);

  return (
    <AppAITooltips 
      pageType="test-management"
      monitoredData={{ testCases, requirements, changedComponents }}
      contextData={contextData}
    />
  );
};

export const BugManagementTooltips = ({ bugs = [], metrics = {} }) => {
  const contextData = useMemo(() => ({
    applicationType: 'Web Application',
    businessCriticality: 'High',
    defectTrend: metrics.trend || 'stable'
  }), [metrics]);

  return (
    <AppAITooltips 
      pageType="bug-management"
      monitoredData={{ bugs, metrics }}
      contextData={contextData}
    />
  );
};

export const DocumentationTooltips = ({ documentContent = '', documentType = 'general' }) => {
  const contextData = useMemo(() => ({
    projectType: 'Web Application',
    criticality: 'Medium',
    documentLength: documentContent.length,
    complexityLevel: documentContent.length > 1000 ? 'High' : 'Medium'
  }), [documentContent]);

  return (
    <AppAITooltips 
      pageType="documents"
      monitoredData={{ documentContent, documentType }}
      contextData={contextData}
    />
  );
};

export const PlanningTooltips = ({ testScope = {}, projectContext = {} }) => {
  const contextData = useMemo(() => ({
    ...projectContext,
    needsEstimation: true,
    projectType: projectContext.projectType || 'Web Application',
    teamExperience: projectContext.teamExperience || 'Medium',
    scopeComplexity: Object.keys(testScope).length > 5 ? 'High' : 'Medium'
  }), [testScope, projectContext]);

  return (
    <AppAITooltips 
      pageType="project-planning"
      monitoredData={{ testScope }}
      contextData={contextData}
    />
  );
};

// Enhanced hook with App features
export const useAITooltips = (pageType, monitoredData, contextData = {}) => {
  const [tooltipsEnabled, setTooltipsEnabled] = useState(() => 
    localStorage.getItem('aiTooltipsEnabled') !== 'false'
  );
  
  const [tooltipConfig, setTooltipConfig] = useState(() => {
    const saved = localStorage.getItem('aiTooltipsConfig');
    return saved ? JSON.parse(saved) : {
      minConfidence: 75,
      maxTooltips: 3,
      autoHide: 30000,
      showProductivityMetrics: true,
      enabledFeatures: {
        testGeneration: true,
        testPrioritization: true,
        bugSeverityAssessment: true,
        requirementAnalysis: true,
        documentImprovement: true,
        testDataGeneration: true,
        effortEstimation: true,
        defectTrendAnalysis: true
      }
    };
  });

  const toggleTooltips = useCallback((enabled) => {
    setTooltipsEnabled(enabled);
    localStorage.setItem('aiTooltipsEnabled', enabled.toString());
  }, []);

  const updateTooltipConfig = useCallback((newConfig) => {
    const updatedConfig = { ...tooltipConfig, ...newConfig };
    setTooltipConfig(updatedConfig);
    localStorage.setItem('aiTooltipsConfig', JSON.stringify(updatedConfig));
  }, [tooltipConfig]);

  return {
    tooltipsEnabled,
    toggleTooltips,
    tooltipConfig,
    updateTooltipConfig,
    TooltipsComponent: () => (
      <AppAITooltips 
        pageType={pageType} 
        monitoredData={monitoredData}
        contextData={contextData}
      />
    )
  };
};

export default AppAITooltips;