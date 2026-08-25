import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { components } from '../../lib/api-types';
import { toast } from 'sonner';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import type { CreateEntryMutation } from '../../lib/app-types';
import { formatDateShort } from '../../lib/utils';
import { GratitudeCategory } from '../../lib/gratitudePrompts';
import { Button } from '../../components/ui/button';
import { Chip } from '../../components/ui/chip';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';
import EmptyState from '../../components/ui/empty-state';
import { usePets, PET_DEFINITIONS } from '../gamification';

interface GratitudeJournalProps {
  parameterId: string | undefined;
  entries: components['schemas']['Entry'][];
  createEntry: CreateEntryMutation;
  limit?: number;
  hideTitle?: boolean;
}

const ALL_CATEGORIES = Object.values(GratitudeCategory);

export default function GratitudeJournal({
  parameterId,
  entries,
  createEntry,
  limit = 5,
  hideTitle = false,
}: GratitudeJournalProps) {
  const { t, i18n } = useTranslation();
  const { data: pets } = usePets();
  const petName = pets?.petName?.trim() || t(PET_DEFINITIONS[0].labelKey);
  const [note, setNote] = useState('');
  const [activePrompt, setActivePrompt] = useState<GratitudeCategory | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const recentEntries = entries.slice(-limit).reverse();

  const handlePromptSelect = (category: GratitudeCategory) => {
    setActivePrompt(activePrompt === category ? null : category);
  };

  const handleSave = async () => {
    if (!parameterId || !createEntry) return;
    createEntry.mutate(
      { parameterId, value: 1, note: note || activePrompt || undefined },
      {
        onSuccess: () => {
          setNote('');
          setActivePrompt(null);
          toast.success(t('dashboard.gratitudeSaved'));
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.gratitudeJournal')}</h3>
      )}

      <Card className="shadow-neumorphic">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-muted-foreground">{t('dashboard.gratitudePrompt')}</p>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                variant={activePrompt === cat ? 'active' : 'default'}
                onClick={() => handlePromptSelect(cat)}
              >
                {t(`gratitudePrompts.${cat}`)}
              </Chip>
            ))}
          </div>
          {activePrompt && (
            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
              {t(`gratitudePrompts.${activePrompt}Hint`)}
            </p>
          )}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('dashboard.gratitudePlaceholder')}
          />
          <Button
            onClick={handleSave}
            disabled={!note.trim() || createEntry.isPending}
            className="w-full"
          >
            <Heart aria-hidden="true" className="w-4 h-4 mr-1.5" />
            {t('dashboard.gratitudeSave')}
          </Button>
        </CardContent>
      </Card>

      {recentEntries.length > 0 && (
        <div className="space-y-2">
          {(showAllHistory ? recentEntries : recentEntries.slice(0, 3)).map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-neumorphic-sm"
            >
              <Heart aria-hidden="true" className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-foreground break-words">{entry.note || entry.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateShort(new Date(entry.createdAt), i18n.language)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentEntries.length === 0 && (
        <EmptyState
          pet
          petType={pets?.activePetType}
          title={t('dashboard.gratitudeEmpty')}
          description={t('dashboard.gratitudeEmptyPet', { name: petName })}
        />
      )}

      {recentEntries.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAllHistory((s) => !s)}
          aria-expanded={showAllHistory}
          className="flex items-center justify-center gap-1 w-full py-2 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {showAllHistory
            ? t('dashboard.hideAllGratitude')
            : t('dashboard.showAllGratitude', { count: recentEntries.length })}
          {showAllHistory ? (
            <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
