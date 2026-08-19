import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { toast } from 'sonner';
import { api, type AdminUser } from '../lib/api';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAdminFeedbackList } from '../hooks/useAdminFeedback';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ToggleSwitch } from '../components/ui/toggle-switch';
import Spinner from '../components/ui/spinner';
import EmptyState from '../components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { AlertTriangle, MessageSquare, ShieldCheck, Star, Users } from 'lucide-react';
import ContentMessagesManager from '../features/content/ContentMessagesManager';
import { cn } from '../lib/utils';

function initials(u: AdminUser): string {
  if (u.name) {
    const parts = u.name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase();
  }
  return u.email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-warning/10 text-warning',
  'bg-success/10 text-success',
  'bg-destructive/10 text-destructive',
  'bg-info/10 text-info',
];

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface PremiumToggleProps {
  user: AdminUser;
  onToggle: (user: AdminUser, next: boolean) => void;
  pending: boolean;
}

function PremiumToggle({ user, onToggle, pending }: PremiumToggleProps) {
  const { t } = useTranslation();
  const isPremium = user.subscriptionTier === 'premium';
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <ToggleSwitch
        size="sm"
        checked={isPremium}
        disabled={pending}
        onCheckedChange={(next) => onToggle(user, next)}
        aria-label={t('admin.premium')}
      />
      <span
        className={cn(
          'text-xs font-semibold',
          isPremium ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {isPremium ? t('admin.premium') : t('admin.free')}
      </span>
    </label>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={cn(
            'w-3.5 h-3.5',
            value <= rating ? 'text-warning fill-warning' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </div>
  );
}

export default function AdminPanelPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const usersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.admin.listUsers(),
  });

  const [tab, setTab] = useState('users');
  const feedbackQuery = useAdminFeedbackList();
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [pendingTierId, setPendingTierId] = useState<string | null>(null);

  const updateTier = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: 'free' | 'premium' }) =>
      api.admin.updateTier(id, tier),
    onMutate: ({ id }) => setPendingTierId(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
    onError: () => toast.error(t('admin.tierUpdateFailed')),
    onSettled: () => setPendingTierId(null),
  });

  const handleTierToggle = (user: AdminUser, next: boolean) => {
    updateTier.mutate({ id: user.id, tier: next ? 'premium' : 'free' });
  };

  if (currentUser && currentUser.role !== 'admin') {
    return <EmptyState icon={ShieldCheck} title={t('admin.forbidden')} className="min-h-[50vh]" />;
  }

  const users = usersQuery.data ?? [];
  const feedbacks = feedbackQuery.data ?? [];
  const matches =
    target !== null && confirmEmail.trim().toLowerCase() === target.email.toLowerCase();

  const openDelete = (user: AdminUser) => {
    setTarget(user);
    setConfirmEmail('');
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.admin.deleteUser(target.id);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setTarget(null);
      setConfirmEmail('');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('admin.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground font-serif">{t('admin.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
        {!usersQuery.isLoading && (
          <span className="px-3 py-1.5 rounded-lg bg-secondary/50 text-sm text-muted-foreground shadow-neumorphic-sm">
            {t('admin.total')}: {users.length}
          </span>
        )}
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="inline-flex items-center gap-1 rounded-xl bg-secondary/50 p-1">
          <Tabs.Trigger
            value="users"
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-neumorphic-sm',
            )}
          >
            {t('admin.usersTab')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="feedback"
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-neumorphic-sm',
            )}
          >
            {t('admin.feedbackTab')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="content"
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-neumorphic-sm',
            )}
          >
            {t('admin.contentTab')}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="users" className="space-y-4">
          {usersQuery.isLoading ? (
            <Card className="flex items-center justify-center py-16">
              <Spinner size={28} />
            </Card>
          ) : usersQuery.isError ? (
            <EmptyState icon={Users} title={t('admin.loadFailed')} />
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title={t('admin.empty')} />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{t('admin.deleteWarning')}</p>

              <Card className="overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                        <th className="px-4 py-3 font-medium">{t('admin.user')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.role')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.access')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.registered')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.emailVerified')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.activity')}</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                                  AVATAR_COLORS[idx % AVATAR_COLORS.length],
                                )}
                              >
                                {initials(u)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {u.name ?? t('admin.roleUser')}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-block px-2 py-0.5 rounded-md text-xs font-semibold',
                                u.role === 'admin'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-secondary text-muted-foreground',
                              )}
                            >
                              {u.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <PremiumToggle
                              user={u}
                              onToggle={handleTierToggle}
                              pending={pendingTierId === u.id}
                            />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(u.createdAt, i18n.language)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {u.emailVerified ? t('admin.yes') : t('admin.no')}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {u.entriesCount} {t('admin.entriesCount')} · {u.testResultsCount}{' '}
                            {t('admin.testsCount')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive/30 text-destructive hover:bg-destructive/5"
                              onClick={() => openDelete(u)}
                            >
                              {t('admin.delete')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-border">
                  {users.map((u, idx) => (
                    <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                      <span
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                          AVATAR_COLORS[idx % AVATAR_COLORS.length],
                        )}
                      >
                        {initials(u)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{u.name ?? u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(u.createdAt, i18n.language)} · {u.entriesCount}{' '}
                          {t('admin.entriesCount')}
                        </p>
                        <div className="mt-1.5">
                          <PremiumToggle
                            user={u}
                            onToggle={handleTierToggle}
                            pending={pendingTierId === u.id}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0"
                        onClick={() => openDelete(u)}
                      >
                        {t('admin.delete')}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </Tabs.Content>

        <Tabs.Content value="feedback" className="space-y-4">
          {feedbackQuery.isLoading ? (
            <Card className="flex items-center justify-center py-16">
              <Spinner size={28} />
            </Card>
          ) : feedbackQuery.isError ? (
            <EmptyState icon={MessageSquare} title={t('admin.feedbackLoadFailed')} />
          ) : feedbacks.length === 0 ? (
            <EmptyState icon={MessageSquare} title={t('admin.noFeedback')} />
          ) : (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <Card key={f.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {f.user.name ?? f.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {formatDate(f.createdAt, i18n.language)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{f.user.email}</p>
                    <div className="mt-1.5">
                      <Stars rating={f.rating} />
                    </div>
                    <p className="text-sm text-foreground mt-2">{f.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="content" className="space-y-4">
          <ContentMessagesManager />
        </Tabs.Content>
      </Tabs.Root>

      <Dialog
        open={target !== null}
        onOpenChange={(v) => {
          if (!v) setTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle aria-hidden="true" className="w-5 h-5 text-destructive" />
              <DialogTitle className="text-lg">{t('admin.deleteConfirmTitle')}</DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              {t('admin.deleteConfirmDesc', { email: target?.email })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">{t('admin.confirmEmailLabel')}</span>
              <Input
                type="email"
                autoComplete="off"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="mt-1"
              />
            </label>
            {deleteError && (
              <p className="text-sm text-destructive" role="alert">
                {deleteError}
              </p>
            )}
            {!matches && (
              <p className="text-xs text-muted-foreground">{t('admin.emailMismatch')}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTarget(null)}
                disabled={deleting}
              >
                {t('admin.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!matches || deleting}
                onClick={handleDelete}
              >
                {deleting ? t('admin.deleting') : t('admin.deleteButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
