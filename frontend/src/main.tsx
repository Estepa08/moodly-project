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
// Применяет сохранённый масштаб текста к document.documentElement сразу при
// импорте (до первого рендера) — см. features/accessibility/textScale.ts.
import './features/accessibility/textScale';
import i18n from './i18n/i18n';
import { getErrorMessage } from './lib/error-messages';
import { ApiError } from './lib/api-error';
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
      // Retrying a 429 just adds another request into the same rate-limit
      // window that already rejected it — pointless, and it's what turned
      // every throttled request into two in production. Everything else
      // still gets one retry (transient network blips, cold-start 5xx).
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.statusCode === 429) && failureCount < 1,
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
