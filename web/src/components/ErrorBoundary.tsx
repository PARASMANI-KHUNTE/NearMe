import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
          <Card variant="glass" className="max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-error/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-[var(--text)] mb-2">Something went wrong</h1>
            <p className="text-[var(--text-muted)] mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Error details (development)
                </summary>
                <pre className="text-xs text-error bg-error/5 p-4 rounded-xl overflow-auto max-h-48">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={this.handleReset} className="flex-1">
                Go Home
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()} className="flex-1">
                Refresh Page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
