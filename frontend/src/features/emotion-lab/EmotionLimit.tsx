import { useTranslation } from 'react-i18next';
import { Moon, Star } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

interface EmotionLimitProps {
  tier: string;
  dailyLimit: number;
  resetsAt: string;
}

export default function EmotionLimit({ tier, dailyLimit }: EmotionLimitProps) {
  const { t } = useTranslation();
  const isPremium = tier === 'premium';

  return (
    <Card className="shadow-elevation-2">
      <CardContent className="flex flex-col items-center text-center py-10 px-6">
        <div className="w-14 h-14 rounded-full bg-muted shadow-neumorphic-inset flex items-center justify-center mb-4">
          <Moon aria-hidden="true" className="w-6 h-6 text-primary" />
        </div>
        <p className="text-base font-heading font-extrabold text-foreground">
          {t('emotionLab.limitTitle')}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mt-1.5">
          {t('emotionLab.limitDescription')}
        </p>

        <div className="mt-5 w-full max-w-md rounded-xl bg-secondary border border-primary/20 px-5 py-4 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Star aria-hidden="true" className="w-4 h-4 text-accent" fill="currentColor" />
            {t('emotionLab.premiumOffer', {
              count: isPremium ? dailyLimit : Math.max(1, dailyLimit * 2),
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t('emotionLab.premiumOfferDesc')}</p>
        </div>

        {/* До запуска биллинга подписка нигде не покупается (см.
            docs/audit/market-readiness-audit.md, раздел «Монетизация»), поэтому
            здесь нет кликабельного CTA — только нейтральная пометка без ложного
            обещания перехода к покупке. */}
        <p className="mt-5 text-xs text-muted-foreground">{t('emotionLab.moreAttemptsSoon')}</p>
      </CardContent>
    </Card>
  );
}
