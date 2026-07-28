import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Spinner from "./components/ui/spinner";
import LoginPage from "./routes/login";
import ForgotPasswordPage from "./routes/forgot-password";
import ResetPasswordPage from "./routes/reset-password";
import Dashboard from "./routes/dashboard";

const OnboardingPage = lazy(() => import("./routes/onboarding"));
const TestsPage = lazy(() => import("./routes/tests"));
const TestDetailPage = lazy(() => import("./routes/test-detail"));
const TestResultsPage = lazy(() => import("./routes/test-results"));
const FeedbackPage = lazy(() => import("./routes/feedback"));
const ReportsPage = lazy(() => import("./routes/reports"));
const BreathingPage = lazy(() => import("./routes/breathing"));
const PracticesPage = lazy(() => import("./routes/practices"));
const GratitudeJournalPage = lazy(() => import("./routes/gratitude-journal"));
const DistortionsPage = lazy(() => import("./routes/distortions"));
const SleepHygienePage = lazy(() => import("./routes/sleep-hygiene"));
const CostBenefitAnalysisPage = lazy(() => import("./routes/cost-benefit-analysis"));
const DigestPage = lazy(() => import("./routes/digest"));

function SuspenseFallback() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Spinner size={28} />
    </div>
  );
}

function ProtectedSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>;
}

function BootstrapSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner size={32} />
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <BootstrapSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <ProtectedSuspense>
        <Outlet />
      </ProtectedSuspense>
    </Layout>
  );
}

function PublicRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <BootstrapSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <Outlet />
  );
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
        <Route path="/practices" element={<PracticesPage />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/tests/:testId" element={<TestDetailPage />} />
        <Route path="/results" element={<TestResultsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/breathing" element={<BreathingPage />} />
        <Route path="/gratitude-journal" element={<GratitudeJournalPage />} />
        <Route path="/distortions" element={<DistortionsPage />} />
        <Route path="/sleep-hygiene" element={<SleepHygienePage />} />
        <Route path="/cost-benefit-analysis" element={<CostBenefitAnalysisPage />} />
        <Route path="/digest" element={<DigestPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
