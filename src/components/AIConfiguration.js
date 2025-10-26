import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, CheckCircle, Zap, Brain, Eye, Sparkles } from 'lucide-react';

export const AIConfigurationHelper = () => {
    const [showConfig, setShowConfig] = useState(false);
    const [currentModel, setCurrentModel] = useState('gemini-1.5-flash');
    const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

    useEffect(() => {
        // Check environment configuration
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash';
        
        setApiKeyConfigured(!!apiKey);
        setCurrentModel(model);
    }, []);

    const geminiModels = {
        'gemini-1.5-flash': {
            icon: Zap,
            name: 'Gemini 1.5 Flash',
            badge: 'Recommended',
            badgeColor: 'bg-green-100 text-green-800',
            description: 'Fast, cost-effective, perfect for high-volume test generation',
            cost: '$0.00015 per 1K tokens',
            speed: 'Very Fast',
            quality: 'High',
            bestFor: ['Test case generation', 'Bug report analysis', 'Quick insights'],
            color: 'border-green-500'
        },
        'gemini-1.5-pro': {
            icon: Brain,
            name: 'Gemini 1.5 Pro',
            badge: 'Advanced',
            badgeColor: 'bg-purple-100 text-purple-800',
            description: 'Advanced reasoning for complex analysis and detailed insights',
            cost: '$0.00125 per 1K tokens',
            speed: 'Fast',
            quality: 'Very High',
            bestFor: ['Complex bug analysis', 'Deep test coverage', 'Architecture insights'],
            color: 'border-purple-500'
        },
        'gemini-pro': {
            icon: Sparkles,
            name: 'Gemini Pro',
            badge: 'Balanced',
            badgeColor: 'bg-blue-100 text-blue-800',
            description: 'Balanced performance for general QA tasks',
            cost: '$0.0005 per 1K tokens',
            speed: 'Fast',
            quality: 'High',
            bestFor: ['General test cases', 'Standard bug reports', 'Documentation'],
            color: 'border-blue-500'
        },
        'gemini-pro-vision': {
            icon: Eye,
            name: 'Gemini Pro Vision',
            badge: 'Visual',
            badgeColor: 'bg-orange-100 text-orange-800',
            description: 'Analyze screenshots and visual bugs',
            cost: '$0.00025 per 1K tokens',
            speed: 'Fast',
            quality: 'High',
            bestFor: ['Screenshot analysis', 'UI bug detection', 'Visual regression'],
            color: 'border-orange-500'
        }
    };

    const copyEnvTemplate = () => {
        const template = `# AI Service Configuration - Gemini Only
# Get your free API key: https://makersuite.google.com/app/apikey

# Gemini API Key (Required)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Choose your Gemini model (Optional - defaults to gemini-1.5-flash)
# Options: gemini-1.5-flash, gemini-1.5-pro, gemini-pro, gemini-pro-vision
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash

# Model Recommendations:
# - gemini-1.5-flash: Best for most use cases (fast & cheap)
# - gemini-1.5-pro: Use for complex analysis requiring deep reasoning
# - gemini-pro: Balanced option for standard tasks
# - gemini-pro-vision: Use when analyzing screenshots or UI issues`;

        navigator.clipboard.writeText(template);
        alert('Environment template copied to clipboard!');
    };

    if (!showConfig) {
        return (
            <button
                onClick={() => setShowConfig(true)}
                className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-300"
            >
                <Settings className="w-4 h-4 mr-1" />
                AI Configuration
            </button>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Gemini AI Configuration
                </h4>
                <button
                    onClick={() => setShowConfig(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                >
                    ×
                </button>
            </div>

            <div className="space-y-4">
                {/* Status Banner */}
                <div className={`${apiKeyConfigured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded p-3`}>
                    <div className="flex items-start">
                        {apiKeyConfigured ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                            <p className={`text-sm font-medium ${apiKeyConfigured ? 'text-green-800' : 'text-yellow-800'}`}>
                                {apiKeyConfigured ? 'AI Service Ready' : 'Setup Required'}
                            </p>
                            <p className={`text-sm ${apiKeyConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
                                {apiKeyConfigured 
                                    ? `Using ${geminiModels[currentModel]?.name || currentModel}. Switch models anytime in your .env file.`
                                    : 'Add your Gemini API key to enable AI-powered features. Get a free key from Google AI Studio.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Current Configuration */}
                <div>
                    <h5 className="font-medium text-gray-700 mb-2">Current Configuration:</h5>
                    <div className="space-y-2 text-sm bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">API Key:</span>
                            <span className="font-medium">
                                {apiKeyConfigured ? (
                                    <span className="text-green-600 flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-1" /> Configured
                                    </span>
                                ) : (
                                    <span className="text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" /> Not Set
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Active Model:</span>
                            <span className="font-medium text-gray-800">{geminiModels[currentModel]?.name || currentModel}</span>
                        </div>
                    </div>
                </div>

                {/* Available Models */}
                <div>
                    <h5 className="font-medium text-gray-700 mb-3">Available Gemini Models:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(geminiModels).map(([modelId, model]) => {
                            const IconComponent = model.icon;
                            const isActive = modelId === currentModel;
                            
                            return (
                                <div 
                                    key={modelId}
                                    className={`border-2 rounded-lg p-3 ${isActive ? model.color : 'border-gray-200'} ${isActive ? 'bg-gray-50' : 'bg-white'}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center">
                                            <IconComponent className={`w-5 h-5 mr-2 ${isActive ? 'text-primary' : 'text-gray-600'}`} />
                                            <div>
                                                <h6 className="font-medium text-gray-800 text-sm">{model.name}</h6>
                                                {isActive && (
                                                    <span className="text-xs text-primary font-medium">Active</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${model.badgeColor}`}>
                                            {model.badge}
                                        </span>
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 mb-2">{model.description}</p>
                                    
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Cost:</span>
                                            <span className="font-medium text-gray-700">{model.cost}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Speed:</span>
                                            <span className="font-medium text-gray-700">{model.speed}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Quality:</span>
                                            <span className="font-medium text-gray-700">{model.quality}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-600 mb-1">Best for:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {model.bestFor.map((use, idx) => (
                                                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    {use}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Setup Instructions */}
                <div>
                    <h5 className="font-medium text-gray-700 mb-2">Quick Setup Guide:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>
                            Get your free API key from{' '}
                            <a 
                                href="https://makersuite.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </li>
                        <li>Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in your project root</li>
                        <li>Copy the template below and add your API key</li>
                        <li>Choose your preferred model (or use the default)</li>
                        <li>Restart your development server</li>
                    </ol>
                </div>

                {/* Environment Template */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-700">Environment Variables:</h5>
                        <button
                            onClick={copyEnvTemplate}
                            className="px-3 py-1 text-xs bg-blue-100 text-primary rounded hover:bg-blue-200"
                        >
                            Copy Template
                        </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
{`# Get your API key: https://makersuite.google.com/app/apikey
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Choose model (optional, defaults to gemini-1.5-flash)
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash`}
                    </pre>
                </div>

                {/* Model Selection Guide */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h6 className="font-medium text-primary mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-1" />
                        Choosing the Right Model
                    </h6>
                    <ul className="text-sm text-primary space-y-1">
                        <li><strong>Start with Flash:</strong> Perfect for most QA tasks, fast and cost-effective</li>
                        <li><strong>Upgrade to Pro:</strong> Use when you need deeper analysis or complex reasoning</li>
                        <li><strong>Use Vision:</strong> When analyzing screenshots, UI bugs, or visual issues</li>
                        <li><strong>Switch Anytime:</strong> Just update your .env file and restart</li>
                    </ul>
                </div>

                {/* Cost Comparison */}
                <div className="bg-green-50 border border-green-200 rounded p-3">
                    <h6 className="font-medium text-green-800 mb-2">Cost Efficiency Example:</h6>
                    <div className="text-sm text-green-700 space-y-1">
                        <p>Generating 100 test cases (~50K tokens each way):</p>
                        <ul className="ml-4 space-y-1">
                            <li>• Flash: <strong>$0.015</strong> (Recommended)</li>
                            <li>• Pro: <strong>$0.125</strong></li>
                            <li>• Standard Pro: <strong>$0.050</strong></li>
                        </ul>
                        <p className="pt-2 border-t border-green-300 mt-2">
                            <strong>💡 Tip:</strong> Flash saves ~92% vs Pro with similar quality for test generation
                        </p>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Important Notes:</p>
                            <ul className="space-y-1 ml-4">
                                <li>• Environment variables are read at build time</li>
                                <li>• Always restart your dev server after changes</li>
                                <li>• Keep your API key secure and never commit it</li>
                                <li>• Google offers generous free tier quotas</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};