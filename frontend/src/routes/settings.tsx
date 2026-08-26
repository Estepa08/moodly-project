import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Globe,
  Bell,
  Shield,
  Star,
  Trash2,
  AlertTriangle,
  ChevronRight,
  PawPrint,
  FileText,
  Mail,
  ScrollText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ToggleSwitch } from '../components/ui/toggle-switch';
import ReviewForm from '../features/review/ReviewForm';
import { RemindersCard } from '../features/reminders/RemindersCard';
import {
  isCompanionHidden,
  setCompanionHidden,
} from '../features/gamification/companionVisibility';
import {
  isSpeechBubbleHidden,
  setSpeechBubbleHidden,
} from '../features/gamification/speechBubbleVisibility';
import { isRewardSoundEnabled, setRewardSoundEnabled } from '../features/gamification/rewardSound';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [companionHidden, setCompanionHiddenState] = useState(isCompanionHidden());
  const [speechHidden, setSpeechHiddenState] = useState(isSpeechBubbleHidden());
  const [soundEnabled, setSoundEnabledState] = useState(isRewardSoundEnabled());
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const toggleCompanion = () => {
    const next = !companionHidden;
    setCompanionHiddenState(next);
    setCompanionHidden(next);
  };

  const toggleSpeech = () => {
    const next = !speechHidden;
    setSpeechHiddenState(next);
    setSpeechBubbleHidden(next);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setRewardSoundEnabled(next);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.users.delete();
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('settings.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawError('');
    try {
      await api.users.delete();
      logout();
      navigate('/login');
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : t('settings.consentFailed'));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20">
      <h1 className="text-xl font-bold text-foreground font-serif">{t('settings.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield aria-hidden="true" className="w-4 h-4" />
            {t('settings.account')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{t('settings.email')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.comingSoon')}</p>
            </div>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{t('settings.password')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.comingSoon')}</p>
            </div>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe aria-hidden="true" className="w-4 h-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-stretch rounded-full bg-muted p-1 shadow-neumorphic-inset">
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary-strong shadow-neumorphic-sm transition-transform duration-200 motion-reduce:transition-none',
                i18n.language === 'en' && 'translate-x-full',
              )}
            />
            {(['ru', 'en'] as const).map((lang) => {
              const active = i18n.language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={active}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={cn(
                    'relative z-10 flex-1 min-h-[44px] rounded-full text-sm font-medium text-center transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
                    active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  {lang === 'ru' ? 'Русский' : 'English'}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell aria-hidden="true" className="w-4 h-4" />
            {t('settings.remindersTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RemindersCard />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText aria-hidden="true" className="w-4 h-4" />
            {t('settings.rightsSection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            to="/privacy"
            className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-muted/50 px-2 -mx-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Shield aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t('settings.privacyLink')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.privacyLinkDesc')}</p>
            </div>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
          <Link
            to="/terms"
            className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-muted/50 px-2 -mx-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ScrollText aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t('settings.termsLink')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.termsLinkDesc')}</p>
            </div>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
          <a
            href="mailto:privacy@moodly.app"
            className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-muted/50 px-2 -mx-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t('settings.privacyContact')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.privacyContactDesc')}</p>
            </div>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground shrink-0" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText aria-hidden="true" className="w-4 h-4" />
            {t('settings.consentSection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('settings.consentDesc')}</p>
          {withdrawError && (
            <p className="text-sm text-destructive" role="alert">
              {withdrawError}
            </p>
          )}
          <Button variant="destructive" size="sm" onClick={() => setShowWithdrawConfirm(true)}>
            {t('settings.consentWithdrawButton')}
          </Button>
          <p className="text-xs text-muted-foreground">{t('settings.consentNote')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PawPrint aria-hidden="true" className="w-4 h-4" />
            {t('settings.companionSection')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t('settings.companionToggleLabel')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('settings.companionToggleDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={!companionHidden}
              onCheckedChange={toggleCompanion}
              aria-label={t('settings.companionToggleLabel')}
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
            <div>
              <p className="text-sm font-medium">{t('settings.speechToggleLabel')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('settings.speechToggleDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={!speechHidden}
              onCheckedChange={toggleSpeech}
              aria-label={t('settings.speechToggleLabel')}
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
            <div>
              <p className="text-sm font-medium">{t('settings.soundToggleLabel')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('settings.soundToggleDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={soundEnabled}
              onCheckedChange={toggleSound}
              aria-label={t('settings.soundToggleLabel')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star aria-hidden="true" className="w-4 h-4" />
            {t('review.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 aria-hidden="true" className="w-4 h-4" />
            {t('settings.deleteAccount')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('settings.deleteDesc')}</p>
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          )}
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            {t('settings.deleteButton')}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(v) => {
          if (!v) setShowDeleteConfirm(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle aria-hidden="true" className="w-5 h-5 text-destructive" />
              <DialogTitle className="text-lg">{t('settings.confirmTitle')}</DialogTitle>
            </div>
            <DialogDescription className="text-sm">{t('settings.confirmDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              {t('settings.confirmCancel')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('settings.deleting') : t('settings.confirmDelete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showWithdrawConfirm}
        onOpenChange={(v) => {
          if (!v) setShowWithdrawConfirm(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle aria-hidden="true" className="w-5 h-5 text-destructive" />
              <DialogTitle className="text-lg">{t('settings.consentConfirmTitle')}</DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              {t('settings.consentConfirmDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowWithdrawConfirm(false)}
              disabled={withdrawing}
            >
              {t('settings.consentConfirmCancel')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? t('settings.withdrawing') : t('settings.consentConfirmWithdraw')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
