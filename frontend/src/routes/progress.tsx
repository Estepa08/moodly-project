import { Navigate } from 'react-router-dom';
import ProgressPage from '../features/gamification/ProgressPage';
import { useInterfaceMode } from '../hooks/useInterfaceMode';
import Spinner from '../components/ui/spinner';

// /progress — целиком игровая надстройка (серии/heatmap/уровень/XP/достижения/
// коллекция питомцев). В классическом режиме (см.
// docs/plans/three-personas-design-gaps.md, Сессия 1) пункт навигации сюда
// скрыт, но пользователь мог сохранить прямую ссылку — редиректим на
// /my-day вместо пустого экрана/404.
export default function ProgressRoute() {
  const { isClassic, isLoading } = useInterfaceMode();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size={28} />
      </div>
    );
  }

  if (isClassic) {
    return <Navigate to="/my-day" replace />;
  }

  return <ProgressPage />;
}
