import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css';
import './global.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore.ts';

// Auth Initializer Component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
