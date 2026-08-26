import { useTranslation } from 'react-i18next';
import { Trash2, PieChart } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { IconButton } from '../../components/ui/icon-button';
import EmptyState from '../../components/ui/empty-state';
import type { components } from '../../lib/api-types';
import type { useDeleteResponsibilityPieEntry } from './useResponsibilityPie';

type ResponsibilityPieEntry = components['schemas']['ResponsibilityPieEntry'];

interface ResponsibilityPieHistoryProps {
  entries: ResponsibilityPieEntry[];
  deleteEntry: ReturnType<typeof useDeleteResponsibilityPieEntry>;
}

export default function ResponsibilityPieHistory({
  entries,
  deleteEntry,
}: ResponsibilityPieHistoryProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState icon={PieChart} title={t('responsibilityPie.historyEmpty')} />;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.id} className="shadow-neumorphic-sm">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground flex-1">{entry.situationText}</p>
              <IconButton
                variant="ghost"
                size="icon-sm"
                label={t('responsibilityPie.deleteEntry')}
                onClick={() => deleteEntry.mutate(entry.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 aria-hidden="true" className="w-4 h-4" />
              </IconButton>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {entry.factors.map((f) => (
                <li
                  key={f.id}
                  className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground"
                >
                  {f.label} · {f.percent}%
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
