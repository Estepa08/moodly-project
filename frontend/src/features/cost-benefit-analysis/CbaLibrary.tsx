import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { ProgressBar } from '../../components/ui/progress-bar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Chip } from '../../components/ui/chip';
import { IconButton } from '../../components/ui/icon-button';
import EmptyState from '../../components/ui/empty-state';
import { cn } from '../../lib/utils';
import type { CbaExample } from './cba.types';

interface CbaLibraryProps {
  examples: CbaExample[];
}

export default function CbaLibrary({ examples }: CbaLibraryProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  if (examples.length === 0) {
    return <EmptyState icon={BookOpen} title={t('cba.libraryEmpty')} />;
  }

  const example = examples[index];
  const advantages = example.items.filter((i) => i.itemType === 'advantage');
  const disadvantages = example.items.filter((i) => i.itemType === 'disadvantage');

  return (
    <div className="space-y-3">
      <Card className="shadow-neumorphic">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{example.persona}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-foreground">{example.thoughtText}</p>

          {example.distortions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {example.distortions.map((d) => (
                <Chip key={d.id} asChild>
                  <Link to="/practices/distortions">
                    {t(`cognitiveDistortions.${d.distortionKey}`)}
                  </Link>
                </Chip>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-success">{t('cba.pros')}</p>
              <ul className="space-y-1">
                {advantages.map((i) => (
                  <li key={i.id} className="text-sm text-muted-foreground">
                    {i.itemText}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-destructive">{t('cba.cons')}</p>
              <ul className="space-y-1">
                {disadvantages.map((i) => (
                  <li key={i.id} className="text-sm text-muted-foreground">
                    {i.itemText}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="text-sm font-semibold text-success">{example.prosWeight}</span>
            <ProgressBar
              height={3}
              segments={[
                {
                  value: Math.min(100, example.prosWeight + example.consWeight),
                  style: {
                    backgroundImage:
                      'linear-gradient(to right, hsl(var(--success)), hsl(var(--destructive)))',
                  },
                },
              ]}
              className="flex-1"
            />
            <span className="text-sm font-semibold text-destructive">{example.consWeight}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <IconButton
          variant="ghost"
          size="icon"
          label={t('cba.prevExample')}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft aria-hidden="true" className="w-5 h-5" />
        </IconButton>
        <div className="flex items-center gap-1.5">
          {examples.map((e, i) => (
            <span
              key={e.id}
              className={cn(
                'h-1.5 rounded-full transition-[width,background-color] duration-150',
                i === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted',
              )}
            />
          ))}
        </div>
        <IconButton
          variant="ghost"
          size="icon"
          label={t('cba.nextExample')}
          onClick={() => setIndex((i) => Math.min(examples.length - 1, i + 1))}
          disabled={index === examples.length - 1}
        >
          <ChevronRight aria-hidden="true" className="w-5 h-5" />
        </IconButton>
      </div>
    </div>
  );
}
