import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTests } from '../hooks/useTests';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import Spinner from '../components/ui/spinner';
export default function TestsPage() {
  const { t } = useTranslation();
  const { data: tests, isLoading } = useTests();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground font-serif">{t('tests.title')}</h1>
        <Button variant="ghost" asChild>
          <Link to="/my-day">{t('common.back')}</Link>
        </Button>
      </header>

      {tests?.map((test) => (
        <Link key={test.id} to={`/tests/${test.id}`} className="block">
          <Card className="hover:shadow-neumorphic transition-shadow">
            <CardHeader>
              <CardTitle>{test.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{test.description}</p>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
