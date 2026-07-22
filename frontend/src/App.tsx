import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import LoginPage from "./routes/login";
import ForgotPasswordPage from "./routes/forgot-password";
import ResetPasswordPage from "./routes/reset-password";

import OnboardingPage from "./routes/onboarding";
import Dashboard from "./routes/dashboard";
import TestsPage from "./routes/tests";
import TestDetailPage from "./routes/test-detail";
import TestResultsPage from "./routes/test-results";
import FeedbackPage from "./routes/feedback";
import ReportsPage from "./routes/reports";
import BreathingPage from "./routes/breathing";
import GratitudeJournalPage from "./routes/gratitude-journal";
import DistortionsPage from "./routes/distortions";
import SleepHygienePage from "./routes/sleep-hygiene";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage defaultRegister />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/tests/:testId" element={<TestDetailPage />} />
        <Route path="/results" element={<TestResultsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/breathing" element={<BreathingPage />} />
        <Route path="/gratitude-journal" element={<GratitudeJournalPage />} />
        <Route path="/distortions" element={<DistortionsPage />} />
        <Route path="/sleep-hygiene" element={<SleepHygienePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
