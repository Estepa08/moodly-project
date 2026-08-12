import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Sun, SunMedium, Moon } from 'lucide-react';
import { api, type MotivationMessage, type MotivationMessageCreate } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import EmptyState from '../../components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { cn } from '../../lib/utils';

const TYPE_FILTERS = ['all', 'morning', 'day', 'evening'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

const LOCALES = ['ru', 'en'] as const;

const TYPE_ICONS = {
  morning: Sun,
  day: SunMedium,
  evening: Moon,
} as const;

function typeIcon(type: string) {
  return TYPE_ICONS[type as keyof typeof TYPE_ICONS] ?? SunMedium;
}

const EMPTY_FORM: MotivationMessageCreate = {
  type: 'morning',
  locale: 'ru',
  text: '',
  question: '',
  isActive: true,
  order: 0,
};

export default function ContentMessagesManager() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('ru');
  const [editing, setEditing] = useState<MotivationMessage | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<MotivationMessageCreate>(EMPTY_FORM);

  const {
    data: messages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['contentMessages', typeFilter, locale],
    queryFn: () =>
      api.content.listMessages({
        type: typeFilter === 'all' ? undefined : typeFilter,
        locale,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contentMessages'] });

  const createMutation = useMutation({
    mutationFn: (body: MotivationMessageCreate) => api.content.createMessage(body),
    onSuccess: () => {
      toast.success(t('content.saved'));
      setCreating(false);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: () => toast.error(t('content.saveFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<MotivationMessageCreate> }) =>
      api.content.updateMessage(id, body),
    onSuccess: () => {
      toast.success(t('content.saved'));
      setEditing(null);
      invalidate();
    },
    onError: () => toast.error(t('content.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.content.deleteMessage(id),
    onSuccess: () => {
      toast.success(t('content.deleted'));
      invalidate();
    },
    onError: () => toast.error(t('content.deleteFailed')),
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  const openEdit = (m: MotivationMessage) => {
    setForm({
      type: m.type,
      locale: m.locale,
      text: m.text,
      question: m.question ?? '',
      isActive: m.isActive,
      order: m.order,
    });
    setEditing(m);
  };

  const submitForm = () => {
    const text = form.text.trim();
    if (!text) return;
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        body: {
          ...form,
          text,
          question: form.question?.trim() ? form.question.trim() : null,
        },
      });
    } else {
      createMutation.mutate({
        ...form,
        text,
        question: form.question?.trim() ? form.question.trim() : null,
      });
    }
  };

  const list = messages ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-xl bg-secondary/50 p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-[color,background-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                typeFilter === f
                  ? 'bg-card text-foreground shadow-neumorphic-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`content.type.${f}`)}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 rounded-xl bg-secondary/50 p-1">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium uppercase transition-[color,background-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                locale === l
                  ? 'bg-card text-foreground shadow-neumorphic-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <Button type="button" onClick={openCreate} className="ml-auto">
          <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
          {t('content.add')}
        </Button>
      </div>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </Card>
      ) : isError ? (
        <EmptyState title={t('content.loadFailed')} />
      ) : list.length === 0 ? (
        <EmptyState title={t('content.empty')} />
      ) : (
        <div className="space-y-2">
          {list.map((m) => {
            const Icon = typeIcon(m.type);
            return (
              <Card key={m.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'grid place-items-center w-9 h-9 shrink-0 rounded-full',
                        m.isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon aria-hidden="true" className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug">{m.text}</p>
                      {m.question && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {m.question}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {t(`content.type.${m.type}`)} · {m.locale.toUpperCase()} · #{m.order}
                        {!m.isActive && (
                          <span className="ml-1 text-warning">· {t('content.inactive')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                        <Pencil aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                        {t('content.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/5"
                        onClick={() => {
                          if (window.confirm(t('content.deleteConfirm'))) {
                            deleteMutation.mutate(m.id);
                          }
                        }}
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={creating || editing !== null}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('content.editTitle') : t('content.addTitle')}</DialogTitle>
            <DialogDescription className="text-sm">{t('content.formDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <label className="block flex-1">
                <span className="text-xs text-muted-foreground">{t('content.typeLabel')}</span>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as MotivationMessageCreate['type'],
                    }))
                  }
                  className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="morning">{t('content.type.morning')}</option>
                  <option value="day">{t('content.type.day')}</option>
                  <option value="evening">{t('content.type.evening')}</option>
                </select>
              </label>
              <label className="block flex-1">
                <span className="text-xs text-muted-foreground">{t('content.localeLabel')}</span>
                <select
                  value={form.locale}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      locale: e.target.value as MotivationMessageCreate['locale'],
                    }))
                  }
                  className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="ru">RU</option>
                  <option value="en">EN</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-muted-foreground">{t('content.textLabel')} *</span>
              <Input
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder={t('content.textPlaceholder')}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">{t('content.questionLabel')}</span>
              <Input
                value={form.question ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder={t('content.questionPlaceholder')}
                className="mt-1"
              />
            </label>
            <div className="flex items-center gap-4">
              <label className="block flex-1">
                <span className="text-xs text-muted-foreground">{t('content.orderLabel')}</span>
                <Input
                  type="number"
                  min={0}
                  value={form.order ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </label>
              <label className="flex items-center gap-2 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">{t('content.activeLabel')}</span>
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {t('content.cancel')}
              </Button>
              <Button
                className="flex-1"
                disabled={!form.text.trim() || createMutation.isPending || updateMutation.isPending}
                onClick={submitForm}
              >
                {t('content.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
