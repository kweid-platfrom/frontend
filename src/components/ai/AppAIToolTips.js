import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppProvider';
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
  
  const [activeTooltips, setActiveTooltips] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const tooltipRefs = useRef({});
  const drawerRef = useRef(null);

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
            preview: 'AI can create comprehensive test cases from requirements',
            confidence: 88,
            action: 'generate-test-cases',
            data: monitoredData.requirements,
            isGenerating: aiOperations.generating || false
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
            isGenerating: aiOperations.prioritizing || false
          });
        }

        // Regression test selection
        if (monitoredData.changedComponents?.length > 0 && monitoredData.testCases?.length > 20) {
          tooltips.push({
            id: 'regression-selection',
            type: 'optimization',
            element: '.test-list-header',
            icon: Filter,
            title: 'Smart Regression Selection',
            preview: 'Select optimal subset of tests based on code changes',
            confidence: 85,
            action: 'select-regression',
            data: { changes: monitoredData.changedComponents, tests: monitoredData.testCases },
            isGenerating: aiOperations.analyzing || false
          });
        }

        // Test data generation
        if (monitoredData.testCasesNeedingData?.length > 0) {
          tooltips.push({
            id: 'generate-test-data',
            type: 'generation',
            element: '.test-creation-area',
            icon: Database,
            title: 'Generate Test Data',
            preview: 'Create realistic test data for testing',
            confidence: 91,
            action: 'generate-test-data',
            data: monitoredData.requirements || monitoredData.testCases,
            isGenerating: aiOperations.generating || false
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
            isGenerating: aiOperations.assessing || false
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
            isGenerating: aiOperations.analyzing || false
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
            isGenerating: aiOperations.analyzing || false
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
            isGenerating: aiOperations.improving || false
          });
        }
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
          if (actions.ai.generateTestCases) {
            analysis = await actions.ai.generateTestCases(tooltip.data, {
              includePrioritization: true,
              includeDataRequirements: true,
              includeAutomationGuidance: true
            });
          } else {
            analysis = { success: false, error: { message: 'Test generation not available' } };
          }
          break;

        case 'prioritize-tests':
          if (actions.ai.prioritizeTests) {
            analysis = await actions.ai.prioritizeTests(tooltip.data, {
              phase: contextData.phase || 'Execution Planning',
              timeConstraints: contextData.timeConstraints || 'Standard',
              riskTolerance: contextData.riskTolerance || 'Medium'
            });
          } else {
            analysis = { success: false, error: { message: 'Test prioritization not available' } };
          }
          break;

        case 'select-regression':
          if (actions.ai.selectRegressionTests) {
            analysis = await actions.ai.selectRegressionTests(
              tooltip.data.changes, 
              tooltip.data.tests,
              { timeBudget: '4 hours', riskTolerance: 'Medium' }
            );
          } else {
            analysis = { success: false, error: { message: 'Regression selection not available' } };
          }
          break;

        case 'assess-bug-severity':
          if (actions.ai.assessBugSeverity) {
            analysis = await actions.ai.assessBugSeverity(tooltip.data, {
              applicationType: contextData.applicationType || 'Web Application',
              businessCriticality: contextData.businessCriticality || 'High'
            });
          } else {
            analysis = { success: false, error: { message: 'Bug severity assessment not available' } };
          }
          break;

        case 'analyze-trends':
          if (actions.ai.analyzeDefectTrends) {
            analysis = await actions.ai.analyzeDefectTrends(tooltip.data, '30 days');
          } else {
            analysis = { success: false, error: { message: 'Defect trend analysis not available' } };
          }
          break;

        case 'analyze-requirements':
          if (actions.ai.analyzeRequirements) {
            analysis = await actions.ai.analyzeRequirements(tooltip.data, {
              projectType: contextData.projectType || 'Web Application',
              criticality: contextData.criticality || 'Medium'
            });
          } else {
            analysis = { success: false, error: { message: 'Requirement analysis not available' } };
          }
          break;

        case 'improve-docs':
          if (actions.ai.improveDocumentation) {
            analysis = await actions.ai.improveDocumentation(
              tooltip.data.content, 
              tooltip.data.type, 
              { clarity: true, completeness: true, professional: true }
            );
          } else {
            analysis = { success: false, error: { message: 'Document improvement not available' } };
          }
          break;

        case 'generate-test-data':
          if (actions.ai.generateTestData) {
            analysis = await actions.ai.generateTestData(tooltip.data, {
              volume: 'Medium',
              realism: 'High',
              includeEdgeCases: true,
              format: 'JSON'
            });
          } else {
            analysis = { success: false, error: { message: 'Test data generation not available' } };
          }
          break;

        default:
          analysis = { success: false, error: { message: 'Unknown AI operation' } };
      }
      
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiAnalysis({ success: false, error: { message: error.message } });
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

      const elementTop = rect.top + scrollTop;
      const elementRight = rect.right + scrollLeft;
      
      return {
        position: 'absolute',
        top: `${elementTop}px`,
        left: `${elementRight - 40}px`,
        transform: 'translateY(-50%)'
      };
    } catch (error) {
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
          <div className={`${getTooltipColor(tooltip.type)} text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${isCurrentlyGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isCurrentlyGenerating ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <IconComponent size={18} />
            )}
            
            {!isCurrentlyGenerating && (
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current"></div>
            )}
          </div>
          
          <div className="absolute -top-1 -right-1 bg-white border-2 border-current text-current text-xs rounded-full px-2 py-0.5 min-w-[28px] h-6 flex items-center justify-center font-bold shadow-sm">
            {tooltip.confidence}
          </div>

          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white text-gray-700 text-xs px-2 py-0.5 rounded-full shadow-sm border">
            {tooltip.type.charAt(0).toUpperCase() + tooltip.type.slice(1)}
          </div>

          {isCurrentlyGenerating && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              AI Processing...
            </div>
          )}
        </div>
        
        {!isCurrentlyGenerating && (
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform translate-y-1 group-hover:translate-y-0">
            <div className="bg-gray-900 text-white text-sm rounded-lg p-4 whitespace-nowrap max-w-sm shadow-xl">
              <div className="flex items-center space-x-2 mb-2">
                <IconComponent size={16} />
                <span className="font-semibold">{tooltip.title}</span>
              </div>
              <div className="text-gray-300 text-xs mb-3">{tooltip.preview}</div>
              
              <div className="border-t border-gray-700 pt-2 mt-2">
                <div className="text-xs text-gray-400">
                  Confidence: {tooltip.confidence}% • Click for AI analysis
                </div>
              </div>
              
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Analysis results component (simplified)
  const AnalysisResults = ({ analysis, context }) => {
    if (!analysis.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Analysis Failed</h4>
          <p className="text-red-600 text-sm">{analysis.error?.message || 'Unknown error'}</p>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-800 mb-2">Analysis Complete</h4>
        <p className="text-green-700 text-sm">
          AI analysis completed successfully for {context.title}
        </p>
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
            
            <div className="border-t p-4">
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Configuration-aware tooltip filtering
  const filterTooltipsByConfig = useCallback((tooltips) => {
    // Simple filtering - can be enhanced based on your needs
    return tooltips.slice(0, 3); // Limit to top 3 suggestions
  }, []);

  // Apply configuration filtering to active tooltips
  const memoizedTooltips = useMemo(() => {
    return filterTooltipsByConfig(activeTooltips);
  }, [activeTooltips, filterTooltipsByConfig]);

  if (!aiAvailable || !aiHealthy || memoizedTooltips.length === 0) {
    return null;
  }

  return (
    <>
      {memoizedTooltips.map(tooltip => (
        <TooltipIndicator key={tooltip.id} tooltip={tooltip} />
      ))}
      
      <AnalysisDrawer />
      
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

// Specialized tooltip components that work with AppProvider
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

export default AppAITooltips;