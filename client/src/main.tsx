import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore.ts';

/**
 * Auth Initializer Component
 * Checks authentication status on app load
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Check if user has a valid token and restore session
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthInitializer>
        <App />
      </AuthInitializer>
    </BrowserRouter>
  </StrictMode>
);
