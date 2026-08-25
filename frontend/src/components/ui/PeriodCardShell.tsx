import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import PeriodSelect from './PeriodSelect';
import Spinner from './spinner';
import { Period } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface PeriodCardShellProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: ReactNode;
  /** Рендерится под заголовком (текст/бейджи сравнения периодов и т.п.). */
  subtitle?: ReactNode;
  period: Period;
  onPeriodChange: (period: Period) => void;
  isLoading?: boolean;
  /** aria-label для спиннера загрузки; по умолчанию dashboard.practicesLoading. */
  loadingLabel?: string;
  cardClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  /** Данные/empty-state — сам виджет решает, что показать (шелл только берёт на себя загрузку). */
  children: ReactNode;
}

/**
 * Общая обвязка «Card + заголовок с иконкой/PeriodSelect + спиннер загрузки»,
 * повторявшаяся в DistortionStatsCard, ThinkingPatternsCard и
 * TestsResultsSection. Data/empty-state ветки остаются на совести каждого
 * виджета — они передаются через children и рендерятся, когда isLoading не
 * задан или false.
 */
export default function PeriodCardShell({
  icon: Icon,
  iconClassName = 'w-4 h-4 text-primary',
  title,
  subtitle,
  period,
  onPeriodChange,
  isLoading,
  loadingLabel,
  cardClassName,
  headerClassName,
  contentClassName,
  children,
}: PeriodCardShellProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn('shadow-neumorphic', cardClassName)}>
      <CardHeader
        className={cn(
          'flex-row flex-wrap items-start justify-between gap-2 space-y-0',
          headerClassName,
        )}
      >
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon aria-hidden="true" className={iconClassName} />
            {title}
          </CardTitle>
          {subtitle}
        </div>
        <PeriodSelect value={period} onChange={onPeriodChange} className="w-full sm:w-44" />
      </CardHeader>
      <CardContent className={contentClassName}>
        {isLoading ? (
          <div
            className="flex justify-center py-10"
            aria-label={loadingLabel ?? t('dashboard.practicesLoading')}
          >
            <Spinner />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
