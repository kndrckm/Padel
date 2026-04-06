import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      try {
        const parsed = JSON.parse(event.message);
        setErrorMessage(parsed.error || 'A database error occurred.');
      } catch {
        setErrorMessage(event.message || 'An unexpected error occurred.');
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-brand-neutral flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-on-surface/5">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Something went wrong</h2>
          <p className="text-on-surface/60 font-medium mb-8 leading-relaxed">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary-container text-on-primary-container py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
