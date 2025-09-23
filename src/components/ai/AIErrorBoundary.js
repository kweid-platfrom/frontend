// components/ai/AIErrorBoundary.jsx - Error handling for AI components
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class AIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AI Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                AI Component Error
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {this.state.error?.message || 'An unexpected error occurred in the AI component.'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="inline-flex items-center mt-3 px-3 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}