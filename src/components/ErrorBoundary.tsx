import React from 'react';
import { reportError } from '../services/crashReporting';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error boundary caught an error:', error, errorInfo);
    reportError(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0F0F13] px-4 text-white">
          <div className="max-w-lg rounded-3xl border border-red-500/20 bg-[#16161C] p-6 shadow-2xl shadow-black/30">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Something crashed</p>
            <h1 className="mt-2 text-2xl font-bold">This screen failed to render</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              The page hit a runtime error instead of showing a blank screen. Open the browser console to see the exact error, or reload the app after fixing the issue.
            </p>
            {this.state.error && (
              <pre className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-red-200">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] px-4 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
