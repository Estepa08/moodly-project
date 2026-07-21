import { useState } from "react";
import { setToken, getToken } from "./lib/api";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import Dashboard from "./routes/dashboard";
import OnboardingPage from "./routes/onboarding";
import TestsPage from "./routes/tests";
import TestDetailPage from "./routes/test-detail";
import TestResultsPage from "./routes/test-results";
import FeedbackPage from "./routes/feedback";
import ReportsPage from "./routes/reports";

type Page =
  | "login"
  | "register"
  | "onboarding"
  | "dashboard"
  | "tests"
  | "test-detail"
  | "test-results"
  | "feedback"
  | "reports";

export default function App() {
  const [page, setPage] = useState<Page>(getToken() ? "dashboard" : "login");
  const [pageParams, setPageParams] = useState<Record<string, string>>({});

  const navigate = (p: string, params?: Record<string, string>) => {
    setPage(p as Page);
    if (params) setPageParams(params);
  };

  const handleLogin = (token: string) => {
    setToken(token);
    navigate("onboarding");
  };

  const handleLogout = () => {
    setToken(null);
    navigate("login");
  };

  const commonProps = {
    navigate,
    onLogout: handleLogout,
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {page === "login" && <LoginPage onLogin={handleLogin} navigate={navigate} />}
      {page === "register" && <RegisterPage onLogin={handleLogin} navigate={navigate} />}
      {page === "onboarding" && <OnboardingPage {...commonProps} />}
      {page === "dashboard" && <Dashboard {...commonProps} />}
      {page === "tests" && <TestsPage {...commonProps} />}
      {page === "test-detail" && <TestDetailPage {...commonProps} testId={pageParams.testId || ""} />}
      {page === "test-results" && <TestResultsPage {...commonProps} />}
      {page === "feedback" && <FeedbackPage {...commonProps} />}
      {page === "reports" && <ReportsPage {...commonProps} />}
    </div>
  );
}
