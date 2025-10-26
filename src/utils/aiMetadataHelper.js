// utils/aiMetadataHelper.js
/**
 * AI Metadata Helper Functions
 * Generates consistent AI metadata for assets and usage logs
 */

/**
 * Generate AI metadata object for embedding in assets (test cases, bugs, etc.)
 * @param {Object} operationResult - Result from AI operation
 * @returns {Object} AI metadata object
 */
export const generateAIMetadata = (operationResult = {}) => {
  const {
    provider = 'gemini',
    model = 'gemini-1.5-flash-latest',
    tokensUsed = 0,
    cost = 0,
    operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    promptSummary = '',
    confidence = null,
  } = operationResult;

  return {
    generated: true,
    assisted: false,
    provider,
    model,
    generated_at: new Date().toISOString(),
    tokens_used: tokensUsed,
    cost: parseFloat(cost.toFixed(6)), // Store as float with 6 decimal precision
    operation_id: operationId,
    prompt_summary: promptSummary.substring(0, 200), // Limit to 200 chars
    confidence_score: confidence,
    generation_timestamp: Date.now(),
    modified_after_generation: false,
  };
};

/**
 * Generate AI usage log entry for Firestore
 * @param {Object} operationData - Data about the AI operation
 * @returns {Object} Usage log object
 */
export const createAIUsageLog = (operationData = {}) => {
  const {
    operationId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operationType,
    assetType,
    assetIds = [],
    provider = 'gemini',
    model = 'gemini-1.5-flash-latest',
    tokensUsed = 0,
    cost = 0,
    success = true,
    promptSummary = '',
    promptLength = 0,
    userId,
    suiteId,
    error = null,
  } = operationData;

  // Validate required fields
  if (!operationType) {
    throw new Error('operationType is required for AI usage log');
  }
  if (!userId) {
    throw new Error('userId is required for AI usage log');
  }
  if (!suiteId) {
    throw new Error('suiteId is required for AI usage log');
  }

  const timestamp = new Date();

  return {
    id: operationId,
    operation_id: operationId,
    operation_type: operationType,
    timestamp: timestamp.toISOString(),
    
    // Asset References
    asset_type: assetType || null,
    asset_ids: Array.isArray(assetIds) ? assetIds : [],
    asset_count: Array.isArray(assetIds) ? assetIds.length : 0,
    
    // AI Details
    provider,
    model,
    tokens_used: tokensUsed,
    cost: parseFloat(cost.toFixed(6)),
    
    // Operation Details
    success,
    prompt_summary: promptSummary.substring(0, 500), // Store up to 500 chars
    prompt_length: promptLength,
    error_message: error ? error.message || String(error) : null,
    
    // User Context
    user_id: userId,
    suite_id: suiteId,
    
    // Timestamps
    created_at: timestamp,
  };
};

/**
 * Calculate cost estimate based on tokens and provider
 * @param {string} provider - AI provider name
 * @param {string} model - Model name
 * @param {number} tokensUsed - Number of tokens consumed
 * @returns {number} Estimated cost in USD
 */
export const calculateAICost = (provider, model, tokensUsed) => {
  // Cost per 1M tokens (as of 2025)
  const pricingMap = {
    gemini: {
      'gemini-1.5-flash-latest': 0.075 / 1000000, // $0.075 per 1M tokens
      'gemini-1.5-pro-latest': 1.25 / 1000000, // $1.25 per 1M tokens
      'gemini-2.0-flash-exp': 0.075 / 1000000,
    },
    openai: {
      'gpt-4': 30.0 / 1000000,
      'gpt-4-turbo': 10.0 / 1000000,
      'gpt-3.5-turbo': 0.5 / 1000000,
    },
  };

  const providerPricing = pricingMap[provider.toLowerCase()] || pricingMap.gemini;
  const costPerToken = providerPricing[model] || providerPricing['gemini-1.5-flash-latest'];
  
  return tokensUsed * costPerToken;
};

/**
 * Validate AI metadata structure
 * @param {Object} metadata - AI metadata to validate
 * @returns {boolean} True if valid
 */
export const isValidAIMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return false;
  
  const requiredFields = ['generated', 'provider', 'model', 'generated_at', 'operation_id'];
  return requiredFields.every(field => field in metadata);
};

/**
 * Enrich existing asset with AI metadata (for updates)
 * @param {Object} asset - Existing asset object
 * @param {Object} aiData - AI operation data
 * @returns {Object} Asset with AI metadata
 */
export const enrichAssetWithAIMetadata = (asset, aiData) => {
  return {
    ...asset,
    source: 'ai_generated',
    ai_metadata: generateAIMetadata(aiData),
  };
};

/**
 * Mark asset as AI-assisted (edited after generation)
 * @param {Object} asset - Asset with AI metadata
 * @returns {Object} Updated asset
 */
export const markAsAIAssisted = (asset) => {
  if (!asset.ai_metadata) return asset;
  
  return {
    ...asset,
    ai_metadata: {
      ...asset.ai_metadata,
      modified_after_generation: true,
      last_modified_at: new Date().toISOString(),
    },
  };
};

/**
 * Get operation type from asset type
 * @param {string} assetType - Type of asset (testCases, bugs, etc.)
 * @returns {string} Operation type
 */
export const getOperationTypeFromAssetType = (assetType) => {
  const typeMap = {
    testCases: 'test_case_generation',
    bugs: 'bug_report_generation',
    documents: 'documentation',
    reports: 'report_generation',
  };
  
  return typeMap[assetType] || 'unknown';
};

/**
 * Format prompt summary for storage
 * @param {string} prompt - Full prompt text
 * @param {number} maxLength - Maximum length
 * @returns {string} Formatted summary
 */
export const formatPromptSummary = (prompt, maxLength = 200) => {
  if (!prompt) return '';
  
  const trimmed = prompt.trim();
  if (trimmed.length <= maxLength) return trimmed;
  
  return trimmed.substring(0, maxLength - 3) + '...';
};

/**
 * Extract model info from result
 * @param {Object} result - AI operation result
 * @returns {Object} Model info {provider, model}
 */
export const extractModelInfo = (result) => {
  const model = result.model || result.currentModel || 'gemini-1.5-flash-latest';
  const provider = result.provider || model.split('-')[0] || 'gemini';
  
  return { provider, model };
};

/**
 * Create batch operation metadata for multiple assets
 * @param {Array} assets - Array of assets created
 * @param {Object} operationData - Operation data
 * @returns {Object} Batch metadata
 */
export const createBatchOperationMetadata = (assets, operationData) => {
  const operationId = operationData.operationId || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate per-asset metrics
  const tokensPerAsset = operationData.tokensUsed / assets.length;
  const costPerAsset = operationData.cost / assets.length;
  
  return assets.map((asset, index) => ({
    ...asset,
    source: 'ai_generated',
    ai_metadata: generateAIMetadata({
      ...operationData,
      operationId: `${operationId}_${index}`,
      tokensUsed: tokensPerAsset,
      cost: costPerAsset,
    }),
  }));
};

/**
 * Generate operation ID
 * @returns {string} Unique operation ID
 */
export const generateOperationId = () => {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if asset is AI-generated
 * @param {Object} asset - Asset to check
 * @returns {boolean} True if AI-generated
 */
export const isAIGenerated = (asset) => {
  return asset?.source === 'ai_generated' || asset?.ai_metadata?.generated === true;
};

/**
 * Check if asset is AI-assisted
 * @param {Object} asset - Asset to check
 * @returns {boolean} True if AI-assisted
 */
export const isAIAssisted = (asset) => {
  return asset?.ai_metadata?.assisted === true || 
         asset?.ai_metadata?.modified_after_generation === true;
};

/**
 * Get AI metadata summary for display
 * @param {Object} metadata - AI metadata
 * @returns {string} Human-readable summary
 */
export const getAIMetadataSummary = (metadata) => {
  if (!metadata) return 'Not AI-generated';
  
  const parts = [];
  
  if (metadata.generated) {
    parts.push('AI Generated');
  } else if (metadata.assisted) {
    parts.push('AI Assisted');
  }
  
  if (metadata.model) {
    parts.push(`using ${metadata.model}`);
  }
  
  if (metadata.tokens_used) {
    parts.push(`(${metadata.tokens_used.toLocaleString()} tokens)`);
  }
  
  return parts.join(' ');
};

export default {
  generateAIMetadata,
  createAIUsageLog,
  calculateAICost,
  isValidAIMetadata,
  enrichAssetWithAIMetadata,
  markAsAIAssisted,
  getOperationTypeFromAssetType,
  formatPromptSummary,
  extractModelInfo,
  createBatchOperationMetadata,
  generateOperationId,
  isAIGenerated,
  isAIAssisted,
  getAIMetadataSummary,
};