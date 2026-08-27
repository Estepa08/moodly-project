import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { getReferralLink } from '../../lib/referral';

/**
 * Инвайт-механика «пригласи подругу» (Сессия 8, three-personas-design-gaps.md).
 * Живёт в /settings, а не только на /progress: приглашать друзей может любой
 * пользователь, а не только тот, кто в режиме «с компаньоном» — в
 * классическом режиме (Сессия 1) /progress вообще скрыт из навигации, а
 * /settings доступен всегда.
 *
 * Кнопка использует ровно тот же паттерн Web Share MVP, что уже есть в
 * StreakMilestoneMoment.tsx (Phase 3, gamification-retention-plan.md):
 * navigator.share, если поддерживается, иначе — копирование в буфер + toast.
 * Единственное отличие — тут постоянная ссылка на сам продукт с реферальным
 * кодом (lib/referral.ts), а не ссылка на конкретную веху прогресса.
 */
export default function InviteFriendCard() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  if (!user) return null;

  const shareUrl = getReferralLink(user.id);
  const shareText = t('settings.inviteShareText');

  const handleInvite = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl });
      } catch {
        // Пользователь отменил шеринг или платформа отказала — не критично.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success(t('settings.inviteCopied'));
    } catch {
      toast.error(t('settings.inviteCopyFailed'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus aria-hidden="true" className="w-4 h-4" />
          {t('settings.inviteSection')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t('settings.inviteSectionDesc')}</p>
        <Button variant="default" className="w-full" onClick={handleInvite}>
          <UserPlus aria-hidden="true" className="w-4 h-4" />
          {t('settings.inviteButton')}
        </Button>
      </CardContent>
    </Card>
  );
}
