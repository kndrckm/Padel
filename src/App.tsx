import React from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppProvider } from './hooks/useAppContext';
import { AppRouter } from './AppRouter';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </ErrorBoundary>
  );
}
