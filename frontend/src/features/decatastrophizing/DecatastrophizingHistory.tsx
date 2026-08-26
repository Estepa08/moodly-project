import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { IconButton } from '../../components/ui/icon-button';
import EmptyState from '../../components/ui/empty-state';
import type { components } from '../../lib/api-types';
import type { useDeleteDecatastrophizingEntry } from './useDecatastrophizing';

type DecatastrophizingEntry = components['schemas']['DecatastrophizingEntry'];

interface DecatastrophizingHistoryProps {
  entries: DecatastrophizingEntry[];
  deleteEntry: ReturnType<typeof useDeleteDecatastrophizingEntry>;
}

export default function DecatastrophizingHistory({
  entries,
  deleteEntry,
}: DecatastrophizingHistoryProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState icon={AlertTriangle} title={t('decatastrophizing.historyEmpty')} />;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.id} className="shadow-neumorphic-sm">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('decatastrophizing.worstCaseLabel')}
              </p>
              <IconButton
                variant="ghost"
                size="icon-sm"
                label={t('decatastrophizing.deleteEntry')}
                onClick={() => deleteEntry.mutate(entry.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 aria-hidden="true" className="w-4 h-4" />
              </IconButton>
            </div>
            <p className="text-sm text-foreground">{entry.worstCaseText}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-1">
              {t('decatastrophizing.mostLikelyLabel')}
            </p>
            <p className="text-sm text-foreground">{entry.mostLikelyText}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
