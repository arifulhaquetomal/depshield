import { useState } from 'react';
import { cn } from '@/utils/cn';

interface RepoInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function RepoInput({ onSubmit, isLoading }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (input: string): boolean => {
    // Accept GitHub URLs or general website URLs
    const patterns = [
      /^https?:\/\//,  // Any http/https URL
      /^github\.com\//,
      /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/, // domain.com format
    ];
    return patterns.some(p => p.test(input.trim()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (e.g., github.com/owner/repo or example.com)');
      return;
    }

    setError('');
    onSubmit(url.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="flex flex-col sm:relative gap-3 sm:gap-0">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="github.com/owner/repo or form.com"
              disabled={isLoading}
              className={cn(
                "w-full pl-12 pr-4 sm:pr-32 py-4 bg-slate-800/50 border rounded-xl",
                "text-slate-100 placeholder-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500",
                "transition-all duration-200",
                error ? "border-red-500/50" : "border-slate-700",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
          <div className="sm:absolute sm:inset-y-0 sm:right-2 flex items-center">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200",
                "bg-gradient-to-r from-cyan-500 to-blue-500",
                "hover:from-cyan-400 hover:to-blue-400",
                "text-white shadow-lg shadow-cyan-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Scan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-2 text-sm text-center text-red-400 flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </form>

      {/* Helper text */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 px-4">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          GitHub Repos
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Website Security
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          No Login Required
        </span>
      </div>
    </div>
  );
}
