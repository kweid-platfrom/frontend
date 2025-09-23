// utils/aiHelpers.js
export const aiHelpers = {
    // Format AI confidence scores
    formatConfidence: (confidence) => {
      if (typeof confidence !== 'number') return 'N/A';
      return `${Math.round(confidence * 100)}%`;
    },
  
    // Get severity badge styling
    getSeverityStyle: (severity) => {
      const styles = {
        critical: 'bg-red-100 text-red-800 border-red-200',
        high: 'bg-orange-100 text-orange-800 border-orange-200', 
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        low: 'bg-green-100 text-green-800 border-green-200',
        unknown: 'bg-gray-100 text-gray-800 border-gray-200'
      };
      return styles[severity?.toLowerCase()] || styles.unknown;
    },
  
    // Get priority badge styling
    getPriorityStyle: (priority) => {
      if (!priority) return 'bg-gray-100 text-gray-800';
      
      if (priority.startsWith('P1')) return 'bg-red-100 text-red-800';
      if (priority.startsWith('P2')) return 'bg-orange-100 text-orange-800';
      if (priority.startsWith('P3')) return 'bg-yellow-100 text-yellow-800';
      if (priority.startsWith('P4')) return 'bg-green-100 text-green-800';
      
      return 'bg-gray-100 text-gray-800';
    },
  
    // Calculate test pass rate
    calculatePassRate: (testCases) => {
      if (!testCases || testCases.length === 0) return 0;
      const passed = testCases.filter(tc => tc.status === 'passed').length;
      return Math.round((passed / testCases.length) * 100);
    },
  
    // Group defects by time period
    groupDefectsByTime: (defects, timeframe = 'day') => {
      const groups = {};
      
      defects.forEach(defect => {
        const date = new Date(defect.created_at || defect.createdAt);
        let key;
        
        switch (timeframe) {
          case 'hour':
            key = date.toISOString().substring(0, 13);
            break;
          case 'day':
            key = date.toISOString().substring(0, 10);
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().substring(0, 10);
            break;
          case 'month':
            key = date.toISOString().substring(0, 7);
            break;
          default:
            key = date.toISOString().substring(0, 10);
        }
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(defect);
      });
      
      return groups;
    },
  
    // Extract key metrics from data
    extractMetrics: (data) => {
      const metrics = {
        totalBugs: 0,
        criticalBugs: 0,
        avgResolutionTime: 0,
        testPassRate: 0,
        recentDefects: 0
      };
  
      if (data.bugs) {
        metrics.totalBugs = data.bugs.length;
        metrics.criticalBugs = data.bugs.filter(b => 
          b.severity === 'critical' || b.priority === 'P1'
        ).length;
  
        // Recent defects (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        metrics.recentDefects = data.bugs.filter(b => 
          new Date(b.created_at || b.createdAt) > sevenDaysAgo
        ).length;
      }
  
      if (data.testCases) {
        metrics.testPassRate = aiHelpers.calculatePassRate(data.testCases);
      }
  
      return metrics;
    },
  
    // Validate AI response structure
    validateAIResponse: (response, expectedFields = []) => {
      if (!response || typeof response !== 'object') {
        return { valid: false, error: 'Invalid response format' };
      }
  
      if (!response.success) {
        return { 
          valid: false, 
          error: response.error?.message || 'Operation failed' 
        };
      }
  
      const missingFields = expectedFields.filter(field => !response.data?.hasOwnProperty(field));
      if (missingFields.length > 0) {
        return { 
          valid: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        };
      }
  
      return { valid: true };
    },
  
    // Format time ago
    timeAgo: (date) => {
      const now = new Date();
      const past = new Date(date);
      const diffInSeconds = Math.floor((now - past) / 1000);
  
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return past.toLocaleDateString();
    },
  
    // Debounce function for AI operations
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };