import React, { useState } from 'react';
import { Settings, AlertCircle, CheckCircle } from 'lucide-react';

export const AIConfigurationHelper = () => {
    const [showConfig, setShowConfig] = useState(false);

    const envVars = {
        NEXT_PUBLIC_AI_PROVIDER: process.env.NEXT_PUBLIC_AI_PROVIDER || '',
        NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        NEXT_PUBLIC_OPENAI_MODEL: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-3.5-turbo',
        NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        // Updated default Gemini model
        NEXT_PUBLIC_GEMINI_MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash',
        NEXT_PUBLIC_OLLAMA_ENDPOINT: process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT || 'http://localhost:11434/api',
        NEXT_PUBLIC_OLLAMA_MODEL: process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama2',
        NEXT_PUBLIC_LOCALAI_ENDPOINT: process.env.NEXT_PUBLIC_LOCALAI_ENDPOINT || 'http://localhost:8080/v1',
        NEXT_PUBLIC_LOCALAI_MODEL: process.env.NEXT_PUBLIC_LOCALAI_MODEL || 'gpt-3.5-turbo',
        NEXT_PUBLIC_LOCALAI_API_KEY: process.env.NEXT_PUBLIC_LOCALAI_API_KEY || 'local-key'
    };

    const copyEnvTemplate = () => {
        const template = `# AI Service Configuration
# Choose your primary AI provider: openai, gemini, ollama, or localai
NEXT_PUBLIC_AI_PROVIDER=gemini

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-3.5-turbo
NEXT_PUBLIC_OPENAI_ENDPOINT=https://api.openai.com/v1

# Google Gemini Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-pro

# Ollama Configuration (for local AI)
NEXT_PUBLIC_OLLAMA_ENDPOINT=http://localhost:11434/api
NEXT_PUBLIC_OLLAMA_MODEL=llama2

# LocalAI Configuration (for self-hosted)
NEXT_PUBLIC_LOCALAI_ENDPOINT=http://localhost:8080/v1
NEXT_PUBLIC_LOCALAI_MODEL=gpt-3.5-turbo
NEXT_PUBLIC_LOCALAI_API_KEY=local-key`;

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
                <h4 className="font-semibold text-gray-800">AI Service Configuration</h4>
                <button
                    onClick={() => setShowConfig(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ×
                </button>
            </div>

            <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">
                            <strong>Important:</strong> Environment variables are read at build time.
                            After adding them to your .env file, restart your development server.
                        </p>
                    </div>
                </div>

                <div>
                    <h5 className="font-medium text-gray-700 mb-2">Current Configuration Status:</h5>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            {envVars.NEXT_PUBLIC_AI_PROVIDER ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            Provider: {envVars.NEXT_PUBLIC_AI_PROVIDER || 'Not set'}
                        </div>

                        {envVars.NEXT_PUBLIC_AI_PROVIDER === 'openai' && (
                            <div className="flex items-center">
                                {envVars.NEXT_PUBLIC_OPENAI_API_KEY ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                                )}
                                OpenAI API Key: {envVars.NEXT_PUBLIC_OPENAI_API_KEY ? 'Configured' : 'Missing'}
                            </div>
                        )}

                        {envVars.NEXT_PUBLIC_AI_PROVIDER === 'gemini' && (
                            <div className="flex items-center">
                                {envVars.NEXT_PUBLIC_GEMINI_API_KEY ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                                )}
                                Gemini API Key: {envVars.NEXT_PUBLIC_GEMINI_API_KEY ? 'Configured' : 'Missing'}
                            </div>
                        )}

                        {envVars.NEXT_PUBLIC_AI_PROVIDER === 'ollama' && (
                            <div className="flex items-center">
                                <Settings className="w-4 h-4 text-blue-600 mr-2" />
                                Ollama Endpoint: {envVars.NEXT_PUBLIC_OLLAMA_ENDPOINT}
                            </div>
                        )}

                        {envVars.NEXT_PUBLIC_AI_PROVIDER === 'localai' && (
                            <div className="flex items-center">
                                <Settings className="w-4 h-4 text-blue-600 mr-2" />
                                LocalAI Endpoint: {envVars.NEXT_PUBLIC_LOCALAI_ENDPOINT}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h5 className="font-medium text-gray-700 mb-2">Setup Instructions:</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in your project root</li>
                        <li>Copy the environment template below</li>
                        <li>Fill in your API keys and endpoints</li>
                        <li>Restart your development server</li>
                    </ol>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-700">Environment Template:</h5>
                        <button
                            onClick={copyEnvTemplate}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                            Copy Template
                        </button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`# AI Service Configuration
# Recommended: gemini (cost-effective, high quality)
NEXT_PUBLIC_AI_PROVIDER=gemini

# OpenAI Configuration  
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-3.5-turbo
NEXT_PUBLIC_OPENAI_ENDPOINT=https://api.openai.com/v1

# Google Gemini Configuration (Recommended)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-pro

# Ollama Configuration (local AI)
NEXT_PUBLIC_OLLAMA_ENDPOINT=http://localhost:11434/api  
NEXT_PUBLIC_OLLAMA_MODEL=llama2

# LocalAI Configuration
NEXT_PUBLIC_LOCALAI_ENDPOINT=http://localhost:8080/v1
NEXT_PUBLIC_LOCALAI_MODEL=gpt-3.5-turbo
NEXT_PUBLIC_LOCALAI_API_KEY=local-key`}
                    </pre>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h6 className="font-medium text-teal-800 mb-1">Provider Options:</h6>
                    <ul className="text-sm text-teal-700 space-y-1">
                        <li><strong>Gemini (Recommended):</strong> Google&apos;s AI, cost-effective, excellent for QA tasks</li>
                        <li><strong>OpenAI:</strong> Requires API key, premium quality results</li>
                        <li><strong>Ollama:</strong> Free local AI, requires Ollama installed</li>
                        <li><strong>LocalAI:</strong> Self-hosted alternative, customizable</li>
                    </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-3">
                    <h6 className="font-medium text-green-800 mb-1">Getting Gemini API Key:</h6>
                    <p className="text-sm text-green-700 mb-2">
                        1. Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">Google AI Studio</a>
                    </p>
                    <p className="text-sm text-green-700 mb-2">
                        2. Sign in with your Google account
                    </p>
                    <p className="text-sm text-green-700">
                        3. Create a new API key and copy it to your .env file
                    </p>
                </div>

                {envVars.NEXT_PUBLIC_AI_PROVIDER === 'gemini' && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <h6 className="font-medium text-purple-800 mb-1">Gemini Model Options:</h6>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li><strong>gemini-pro:</strong> Best for text-only prompts (recommended)</li>
                            <li><strong>gemini-pro-vision:</strong> For text and image inputs</li>
                            <li><strong>gemini-1.5-pro:</strong> Latest model with improved capabilities</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};