import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSeo, withCanonical } from '../lib/seo';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  useSeo({
    title: t('notFound.title'),
    noindex: true,
    canonical: withCanonical('/404'),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-extrabold text-primary" translate="no">
          404
        </p>
        <h1 className="mt-4 text-2xl font-extrabold text-foreground text-balance">
          {t('notFound.title')}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t('notFound.text')}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">{t('notFound.home')}</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/login">{t('notFound.signIn')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
