import { Navigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import Spinner from './ui/spinner';

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { needsOnboarding, isLoading } = useOnboarding();
  if (location.pathname === '/onboarding') return <>{children}</>;
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size={28} />
      </div>
    );
  }
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
