import { useTranslation } from 'react-i18next';
import { Swords } from 'lucide-react';
import ThoughtBattleGame from '../features/thought-battle/ThoughtBattleGame';

export default function ThoughtBattlePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Swords aria-hidden="true" className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground font-serif">
            {t('thoughtBattle.pageTitle')}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t('thoughtBattle.intro')}</p>
      </div>

      <ThoughtBattleGame />
    </div>
  );
}
