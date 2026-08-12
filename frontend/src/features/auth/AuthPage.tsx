import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

export function AuthPage({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs z-10">
        <button
          className={cn(
            'px-1.5 py-0.5 rounded cursor-pointer transition-[color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            i18n.language === 'en' ? 'text-primary font-semibold' : 'text-muted-foreground',
          )}
          onClick={() => i18n.changeLanguage('en')}
        >
          {t('common.languageEn')}
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          className={cn(
            'px-1.5 py-0.5 rounded cursor-pointer transition-[color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            i18n.language === 'ru' ? 'text-primary font-semibold' : 'text-muted-foreground',
          )}
          onClick={() => i18n.changeLanguage('ru')}
        >
          {t('common.languageRu')}
        </button>
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-5 sm:p-8 space-y-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
