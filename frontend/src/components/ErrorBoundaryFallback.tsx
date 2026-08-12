import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export default function ErrorBoundaryFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="w-14 h-14 rounded-full bg-muted shadow-neumorphic-inset flex items-center justify-center mb-4">
        <AlertTriangle aria-hidden="true" className="w-6 h-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{t('common.somethingWentWrong')}</p>
      <p className="text-xs text-muted-foreground max-w-xs mb-4">{t('common.tryAgain')}</p>
      <Button onClick={() => window.location.reload()}>{t('common.tryAgain')}</Button>
    </div>
  );
}
