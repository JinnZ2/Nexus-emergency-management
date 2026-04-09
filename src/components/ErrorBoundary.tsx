import React from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare state: ErrorBoundaryState;
  declare props: Readonly<{ children: React.ReactNode }>;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[NEXUS CRITICAL] UI crash during operation:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dark min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-8">
          <div className="max-w-xl w-full space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/20 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nexus UI Failure</h1>
                <p className="text-zinc-400 text-sm">The interface crashed but backend systems remain operational.</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Immediate Actions</h2>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">1.</span>
                  Backend services and emergency protocols remain active on port 3001
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">2.</span>
                  Emergency actions can be triggered via direct API calls if needed
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">3.</span>
                  Reload the interface below to restore the dashboard
                </li>
              </ul>
            </div>

            <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-2">
                <Terminal className="w-3 h-3" /> ERROR_DETAIL
              </div>
              <p className="text-xs font-mono text-rose-400 break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reload Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
