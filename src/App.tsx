import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RepoInput } from './components/RepoInput';
import { ScanProgress } from './components/ScanProgress';
import { Dashboard } from './components/Dashboard';
import { WebDashboard } from './components/WebDashboard';
import { useScanner } from './hooks/useScanner';
import { useWebScanner } from './hooks/useWebScanner';

type ScanMode = 'idle' | 'repo' | 'web';

export function App() {
  const [scanMode, setScanMode] = useState<ScanMode>('idle');

  const repoScanner = useScanner();
  const webScanner = useWebScanner();

  const handleSubmit = (url: string) => {
    // Detect if it's a GitHub URL or general website
    const isGitHub = /github\.com\/[^\/]+\/[^\/]+/.test(url);

    if (isGitHub) {
      setScanMode('repo');
      repoScanner.scan(url);
    } else {
      setScanMode('web');
      webScanner.scan(url);
    }
  };

  const handleReset = () => {
    setScanMode('idle');
    repoScanner.reset();
    webScanner.reset();
  };

  const activeScanner = scanMode === 'repo' ? repoScanner : webScanner;
  const { status, stages, currentStage, result, error } = activeScanner;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-40 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">SecureShield</h1>
                  <p className="text-xs text-slate-400">Security Scanner</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Free & Open
                </span>
                <span className="hidden sm:inline">•</span>
                <span>No Login Required</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Idle State - Show input */}
          {status === 'idle' && (
            <div className="text-center py-8 sm:py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-6 sm:mb-8">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Security Analysis
              </h2>
              <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
                Scan GitHub repositories for dependency risks or analyze websites for security misconfigurations
              </p>
              <RepoInput onSubmit={handleSubmit} isLoading={false} />
            </div>
          )}

          {/* Scanning State */}
          {status === 'scanning' && (
            <ScanProgress
              stages={stages}
              currentStage={currentStage}
            />
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-red-900/30 flex items-center justify-center border border-red-500/30">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                  Scan Failed
                </h3>
                <p className="text-sm sm:text-base text-red-300 mb-6 break-words">
                  {error}
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Completed State - Show appropriate dashboard */}
          {status === 'completed' && result && (
            <>
              {scanMode === 'repo' && <Dashboard result={result} onNewScan={handleReset} />}
              {scanMode === 'web' && (
                <ErrorBoundary>
                  <WebDashboard result={result} onNewScan={handleReset} />
                </ErrorBoundary>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 mt-12 sm:mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 text-center sm:text-left">
              <p>© 2024 SecureShield. Open Source Security Tools.</p>
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                <span>Powered by OSV.dev, Mozilla Observatory</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
