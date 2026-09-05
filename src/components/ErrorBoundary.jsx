import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled Application Exception caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6">
          <div className="bg-card border border-rose-500/30 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-inner">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-rose-500/10 text-rose-500 font-mono font-bold text-xs rounded-full border border-rose-500/20">
                HTTP 500 SYSTEM ERROR
              </span>
              <h1 className="text-2xl font-heading font-bold text-foreground">Something Went Wrong</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected runtime or state error occurred. Personal Tracker protected your data from corruption and logged the trace.
              </p>
            </div>

            {this.state.error && (
              <details className="p-3 bg-muted/40 border border-border rounded-xl text-left font-mono text-[11px] text-rose-400 overflow-x-auto max-h-36">
                <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                  Show Error Trace Details
                </summary>
                <p className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</p>
              </details>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <a
                href="/"
                className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-border transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
