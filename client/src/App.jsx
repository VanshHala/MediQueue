import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                },
                success: {
                  iconTheme: {
                    primary: '#14B8A6',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
