import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import i18n from './i18n/i18n';
import { getErrorMessage } from './lib/error-messages';
import { initErrorReporting } from './lib/errorReporter';
import { initMetrika } from './lib/metrika';

// Яндекс.Метрика (только на боевом домене)
initMetrika();

// Глобальный перехват ошибок клиента → POST /api/client-errors (лог на бэке)
initErrorReporting();

// Регистрация Service Worker (PWA + push-уведомления). autoUpdate → new SW
// становится активным сразу после публикации без перезагрузки пользователя.
registerSW({ immediate: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        toast.error(getErrorMessage(error, i18n.t));
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
