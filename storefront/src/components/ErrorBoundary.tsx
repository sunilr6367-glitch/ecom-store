'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { UnstyledButton } from '@/design-system';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Pass current pathname to auto-reset error state on navigation */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Reset error state when navigating to a different route
  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary',
      },
      tags: {
        errorType: 'react_error_boundary',
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-parchment">
            <div className="text-center max-w-md px-6">
              <h2 className="text-display-md font-display text-primary mb-4">
                Something went wrong
              </h2>
              <p className="text-secondary mb-6">
                We apologize for the inconvenience. Please try refreshing the
                page.
              </p>
              <UnstyledButton
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-primary text-inverse px-6 py-3 font-bold  tracking-token-wider text-body-xs hover:bg-secondary transition-colors"
              >
                Refresh Page
              </UnstyledButton>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
