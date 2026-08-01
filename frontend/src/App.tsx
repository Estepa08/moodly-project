import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useCurrentUser } from "./hooks/useCurrentUser";
import Layout from "./components/Layout";
import Spinner from "./components/ui/spinner";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import ForgotPasswordPage from "./routes/forgot-password";
import ResetPasswordPage from "./routes/reset-password";
import PrivacyPage from "./routes/privacy";
import TermsPage from "./routes/terms";
import Dashboard from "./routes/dashboard";

const OnboardingPage = lazy(() => import("./routes/onboarding"));
const TestsPage = lazy(() => import("./routes/tests"));
const TestDetailPage = lazy(() => import("./routes/test-detail"));
const BreathingPage = lazy(() => import("./routes/breathing"));
const PracticesPage = lazy(() => import("./routes/practices"));
const GratitudeJournalPage = lazy(() => import("./routes/gratitude-journal"));
const DistortionsPage = lazy(() => import("./routes/distortions"));
const SleepHygienePage = lazy(() => import("./routes/sleep-hygiene"));
const ThoughtJournalPage = lazy(() => import("./routes/thought-journal"));
const CostBenefitAnalysisPage = lazy(() => import("./routes/cost-benefit-analysis"));
const SettingsPage = lazy(() => import("./routes/settings"));
const ProgressPage = lazy(() => import("./routes/progress"));
const AdminPanelPage = lazy(() => import("./routes/admin-panel"));

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

function AdminRoute() {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) return <BootstrapSpinner />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <BootstrapSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/practices" element={<PracticesPage />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/tests/:testId" element={<TestDetailPage />} />
        <Route path="/results" element={<Navigate to="/" replace />} />
        <Route path="/practices/breathing" element={<BreathingPage />} />
        <Route path="/practices/gratitude" element={<GratitudeJournalPage />} />
        <Route path="/practices/distortions" element={<DistortionsPage />} />
        <Route path="/practices/sleep-hygiene" element={<SleepHygienePage />} />
        <Route path="/practices/thought-journal" element={<ThoughtJournalPage />} />
        <Route path="/practices/cost-benefit-analysis" element={<CostBenefitAnalysisPage />} />

        {/* Old practice route redirects */}
        <Route path="/breathing" element={<Navigate to="/practices/breathing" replace />} />
        <Route path="/gratitude-journal" element={<Navigate to="/practices/gratitude" replace />} />
        <Route path="/distortions" element={<Navigate to="/practices/distortions" replace />} />
        <Route path="/sleep-hygiene" element={<Navigate to="/practices/sleep-hygiene" replace />} />
        <Route
          path="/thought-journal"
          element={<Navigate to="/practices/thought-journal" replace />}
        />
        <Route
          path="/cost-benefit-analysis"
          element={<Navigate to="/practices/cost-benefit-analysis" replace />}
        />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPanelPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
