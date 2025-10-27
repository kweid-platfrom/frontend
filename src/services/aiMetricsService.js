// services/aiMetricsService.js
/**
 * AI Metrics Service
 * Calculates AI usage metrics from Firestore data
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Calculate comprehensive AI metrics for a test suite
 * @param {string} suiteId - Test suite ID
 * @param {number} dateRange - Number of days to include (default: 30)
 * @returns {Promise<Object>} Metrics object
 */
export const calculateSuiteAIMetrics = async (suiteId, dateRange = 30) => {
  try {
    if (!suiteId) {
      throw new Error('Suite ID is required');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    // Fetch AI usage logs
    const logsRef = collection(db, `testSuites/${suiteId}/ai_usage_logs`);
    const logsQuery = query(
      logsRef,
      where('created_at', '>=', cutoffTimestamp),
      orderBy('created_at', 'desc')
    );
    const logsSnapshot = await getDocs(logsQuery);
    const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch AI-generated test cases
    const testCasesRef = collection(db, `testSuites/${suiteId}/testCases`);
    const aiTestCasesQuery = query(
      testCasesRef,
      where('source', '==', 'ai_generated')
    );
    const aiTestCasesSnapshot = await getDocs(aiTestCasesQuery);

    // Fetch AI-generated bugs
    const bugsRef = collection(db, `testSuites/${suiteId}/bugs`);
    const aiBugsQuery = query(
      bugsRef,
      where('source', '==', 'ai_generated')
    );
    const aiBugsSnapshot = await getDocs(aiBugsQuery);

    // Calculate metrics
    const metrics = calculateMetricsFromData(
      logs,
      aiTestCasesSnapshot.docs,
      aiBugsSnapshot.docs,
      dateRange
    );

    return {
      success: true,
      data: metrics,
    };
  } catch (error) {
    console.error('Error calculating AI metrics:', error);
    return {
      success: false,
      error: error.message,
      data: getDefaultMetrics(),
    };
  }
};

/**
 * Calculate metrics from fetched data
 * @param {Array} logs - Usage logs
 * @param {Array} testCasesDocs - Test case documents
 * @param {Array} bugsDocs - Bug documents
 * @param {number} dateRange - Date range in days
 * @returns {Object} Calculated metrics
 */
const calculateMetricsFromData = (logs, testCasesDocs, bugsDocs, dateRange) => {
  // Basic counts
  const totalTestCasesGenerated = testCasesDocs.length;
  const totalBugReportsGenerated = bugsDocs.length;
  const totalAIGenerations = logs.filter(log => log.success).length;
  const totalOperations = logs.length;

  // Success/Failure
  const successfulOperations = logs.filter(log => log.success).length;
  const failedOperations = logs.filter(log => !log.success).length;
  const overallSuccessRate = totalOperations > 0 
    ? (successfulOperations / totalOperations) * 100 
    : 0;

  // Tokens and Cost
  const totalTokensUsed = logs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

  // Operations by type
  const operationsByType = logs.reduce((acc, log) => {
    const type = log.operation_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Provider usage
  const providerUsage = logs.reduce((acc, log) => {
    const provider = log.model || log.provider || 'gemini';
    if (!acc[provider]) {
      acc[provider] = {
        calls: 0,
        cost: 0,
        tokens: 0,
        successful: 0,
        failed: 0,
      };
    }
    acc[provider].calls += 1;
    acc[provider].cost += log.cost || 0;
    acc[provider].tokens += log.tokens_used || 0;
    if (log.success) {
      acc[provider].successful += 1;
    } else {
      acc[provider].failed += 1;
    }
    acc[provider].successRate = (acc[provider].successful / acc[provider].calls) * 100;
    return acc;
  }, {});

  // Time saved estimation (30 min per test case, 45 min per bug report)
  const timeSavedHours = 
    (totalTestCasesGenerated * 0.5) + 
    (totalBugReportsGenerated * 0.75);

  // Cost efficiency (value vs cost)
  const timeSavedValue = timeSavedHours * 50; // $50/hour
  const costEfficiency = totalCost > 0 ? timeSavedValue / totalCost : 0;

  // ROI calculation
  const estimatedROI = totalCost > 0 
    ? ((timeSavedValue - totalCost) / totalCost) * 100 
    : 0;

  // Efficiency score (0-100)
  const avgTestCasesPerGeneration = totalAIGenerations > 0 
    ? totalTestCasesGenerated / totalAIGenerations 
    : 0;
  const efficiencyScore = Math.min(100, Math.round(
    (overallSuccessRate * 0.4) + 
    (avgTestCasesPerGeneration * 5) + 
    (Math.min(costEfficiency * 10, 30))
  ));

  // Quality score (0-100)
  const qualityScore = Math.min(100, Math.round(
    (overallSuccessRate * 0.5) + 
    (avgTestCasesPerGeneration * 3) + 
    20
  ));

  // Productivity increase
  const productivityIncrease = timeSavedHours > 0 
    ? (timeSavedHours / (timeSavedHours + 160)) * 100 
    : 0;

  // Daily stats
  const dailyStats = calculateDailyStats(logs, dateRange);

  // Estimates
  const automationCandidates = Math.round(totalTestCasesGenerated * 0.3);
  const criticalBugsIdentified = Math.round(totalBugReportsGenerated * 0.2);

  return {
    // Basic counts
    totalTestCasesGenerated,
    totalBugReportsGenerated,
    totalAIGenerations,
    totalOperations,
    
    // Success metrics
    successfulOperations,
    failedOperations,
    overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
    
    // Usage metrics
    totalTokensUsed,
    totalCost: parseFloat(totalCost.toFixed(6)),
    
    // Value metrics
    totalTimeSavedHours: parseFloat(timeSavedHours.toFixed(2)),
    costEfficiency: parseFloat(costEfficiency.toFixed(2)),
    estimatedROI: parseFloat(estimatedROI.toFixed(2)),
    
    // Performance scores
    efficiencyScore,
    qualityScore,
    productivityIncrease: parseFloat(productivityIncrease.toFixed(2)),
    
    // Detailed breakdowns
    operationsByType,
    providerUsage,
    dailyStats,
    
    // Averages
    averageTestCasesPerGeneration: parseFloat(avgTestCasesPerGeneration.toFixed(2)),
    averageTokensPerOperation: totalOperations > 0 
      ? Math.round(totalTokensUsed / totalOperations) 
      : 0,
    averageCostPerOperation: totalOperations > 0 
      ? parseFloat((totalCost / totalOperations).toFixed(6)) 
      : 0,
    
    // Estimates
    automationCandidates,
    criticalBugsIdentified,
    
    // Metadata
    dateRange,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Calculate daily statistics
 * @param {Array} logs - Usage logs
 * @param {number} dateRange - Date range in days
 * @returns {Object} Daily stats
 */
const calculateDailyStats = (logs) => {
  const stats = {};
  
  logs.forEach(log => {
    const date = new Date(log.timestamp || log.created_at?.toDate()).toISOString().split('T')[0];
    
    if (!stats[date]) {
      stats[date] = {
        operations: 0,
        successful: 0,
        failed: 0,
        tokens: 0,
        cost: 0,
        testCases: 0,
        bugReports: 0,
      };
    }
    
    stats[date].operations += 1;
    stats[date].tokens += log.tokens_used || 0;
    stats[date].cost += log.cost || 0;
    
    if (log.success) {
      stats[date].successful += 1;
    } else {
      stats[date].failed += 1;
    }
    
    if (log.operation_type === 'test_case_generation') {
      stats[date].testCases += log.asset_count || 0;
    } else if (log.operation_type === 'bug_report_generation') {
      stats[date].bugReports += log.asset_count || 0;
    }
  });
  
  return stats;
};

/**
 * Get default/empty metrics
 * @returns {Object} Default metrics
 */
const getDefaultMetrics = () => ({
  totalTestCasesGenerated: 0,
  totalBugReportsGenerated: 0,
  totalAIGenerations: 0,
  totalOperations: 0,
  successfulOperations: 0,
  failedOperations: 0,
  overallSuccessRate: 0,
  totalTokensUsed: 0,
  totalCost: 0,
  totalTimeSavedHours: 0,
  costEfficiency: 0,
  estimatedROI: 0,
  efficiencyScore: 0,
  qualityScore: 0,
  productivityIncrease: 0,
  operationsByType: {},
  providerUsage: {},
  dailyStats: {},
  averageTestCasesPerGeneration: 0,
  averageTokensPerOperation: 0,
  averageCostPerOperation: 0,
  automationCandidates: 0,
  criticalBugsIdentified: 0,
  dateRange: 30,
  lastUpdated: new Date().toISOString(),
});

/**
 * Get recent AI operations
 * @param {string} suiteId - Test suite ID
 * @param {number} limitCount - Number of operations to fetch
 * @returns {Promise<Array>} Recent operations
 */
export const getRecentAIOperations = async (suiteId, limitCount = 10) => {
  try {
    const logsRef = collection(db, `testSuites/${suiteId}/ai_usage_logs`);
    const recentQuery = query(
      logsRef,
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(recentQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().created_at?.toDate?.() || new Date(doc.data().timestamp),
    }));
  } catch (error) {
    console.error('Error fetching recent operations:', error);
    return [];
  }
};

/**
 * Get AI-generated assets count by type
 * @param {string} suiteId - Test suite ID
 * @param {string} assetType - Asset type (testCases, bugs, etc.)
 * @returns {Promise<number>} Count of AI-generated assets
 */
export const getAIGeneratedAssetsCount = async (suiteId, assetType) => {
  try {
    const assetsRef = collection(db, `testSuites/${suiteId}/${assetType}`);
    const aiAssetsQuery = query(
      assetsRef,
      where('source', '==', 'ai_generated')
    );
    
    const snapshot = await getDocs(aiAssetsQuery);
    return snapshot.size;
  } catch (error) {
    console.error(`Error fetching AI ${assetType} count:`, error);
    return 0;
  }
};

/**
 * Export metrics as JSON
 * @param {Object} metrics - Metrics data
 * @returns {string} JSON string
 */
export const exportMetricsAsJSON = (metrics) => {
  return JSON.stringify(metrics, null, 2);
};

/**
 * Export metrics as CSV
 * @param {Object} metrics - Metrics data
 * @returns {string} CSV string
 */
export const exportMetricsAsCSV = (metrics) => {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Test Cases Generated', metrics.totalTestCasesGenerated],
    ['Total Bug Reports Generated', metrics.totalBugReportsGenerated],
    ['Total AI Generations', metrics.totalAIGenerations],
    ['Success Rate (%)', metrics.overallSuccessRate],
    ['Total Tokens Used', metrics.totalTokensUsed],
    ['Total Cost ($)', metrics.totalCost],
    ['Time Saved (hours)', metrics.totalTimeSavedHours],
    ['Cost Efficiency', metrics.costEfficiency],
    ['Estimated ROI (%)', metrics.estimatedROI],
    ['Efficiency Score', metrics.efficiencyScore],
    ['Quality Score', metrics.qualityScore],
    ['Productivity Increase (%)', metrics.productivityIncrease],
  ];

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

export default {
  calculateSuiteAIMetrics,
  getRecentAIOperations,
  getAIGeneratedAssetsCount,
  exportMetricsAsJSON,
  exportMetricsAsCSV,
};