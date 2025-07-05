"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { reportReactError } from "@/utils/error-reporter";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: Record<string, any>;
  showError?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error to our API
    reportReactError(
      error,
      { componentStack: errorInfo.componentStack || "" },
      {
        component: this.constructor.name,
        ...this.props.context,
      }
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showError } = this.props;
      const { error } = this.state;

      // If fallback is a function, call it with error and reset
      if (typeof fallback === "function") {
        return fallback(error!, this.reset);
      }

      // If fallback is provided, render it
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center p-4 text-center">
          <div className="rounded-lg bg-gradient-to-br from-red-50 to-pink-50 p-8 shadow-lg border border-red-100 max-w-md w-full">
            {/* Error Icon */}
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-red-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Oops! Something went wrong
            </h2>

            <p className="text-gray-600 mb-4">
              This component encountered an error. Dont worry, we have been
              notified and are working on it.
            </p>

            {showError && error && (
              <div className="bg-red-100 rounded-md p-3 mb-4">
                <p className="text-red-700 text-sm font-medium">
                  {error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.reset}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for use in functional components
export function useErrorBoundary(context?: Record<string, any>) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      reportReactError(
        error,
        { componentStack: "" },
        { source: "useErrorBoundary", ...context }
      );
    }
  }, [error, context]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { error, resetError, captureError };
}
