import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9F7] flex items-center justify-center p-6 text-slate-900 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <span className="material-symbols-outlined text-3xl">error_outline</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              We encountered a rendering issue. Please reload or head back to the dashboard.
            </p>

            {this.state.error?.message && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs font-mono text-rose-700 overflow-x-auto max-h-32">
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">home</span>
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
