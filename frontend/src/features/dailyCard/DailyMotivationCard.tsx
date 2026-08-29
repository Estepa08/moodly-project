import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { History, Lock, Sparkles, Star, X } from 'lucide-react';
import { useCardHistory, type DayCardViewModel } from './useCardHistory';
import { useFavorites } from './useFavorites';
import { useColorTheme } from '../../hooks/useColorTheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import ClaimBurst from '../gamification/ClaimBurst';
import { ModalShell } from '../../components/ui/modal-shell';
import { cn } from '../../lib/utils';
import type { ColorThemeId } from '../../lib/colorTheme';
import type { MotivationPrinciple } from './dailyCard';

// «Карточка дня»: вариант B+C из product-strategy обсуждения — персональный
// день-индекс (useCardHistory) + открытие явным тапом. Лента вертикальных,
// как игральные, карточек: до недели истории назад (можно проскроллить),
// сегодня и один запертый день вперёд. Все карточки используют один и тот же
// флип-механизм (FlipCard) и его можно повторять сколько угодно раз в обе
// стороны — тап переворачивает лицом вверх, повторный тап переворачивает
// обратно рубашкой вверх. Взаимодействие — press & hold: пока палец/курсор
// удерживает карту, по кромке нарастает свечение, а сам флип запускается в
// момент отпускания. Флип сделан нарочито «зрелищным» — тумблинг с
// овершутом, вспышка на ребре карты и shine-полоса по лицевой стороне после
// посадки, по мотивам card reveal в Hearthstone. Для карточки, которая
// раскрывается впервые в жизни, вдобавок играет праздничный confetti-burst.
// Завтрашняя карточка заперта до полуночи и показывает обратный отсчёт.
// Полюбившиеся высказывания можно сохранить в избранное — они не привязаны
// к конкретной дате, ключ — day-номер расписания, чтобы при следующем
// годовом цикле та же цитата не задвоилась в списке.
//
// Цветовой стиль (ThemeSpec / THEMES) следует глобальной цветовой теме
// приложения (/settings → lib/colorTheme.ts) — тот же выбор перекрашивает
// весь UI через CSS-переменные на <html>, поэтому sectionBg/title/accent/
// front у всех четырёх тем здесь буквально совпадают (hsl(var(--x))).
// Единственное, что остаётся специфичным для этого виджета — bespoke
// арт-дирекшн флип-карты (tones/medallionGlow/pressGlow/pressPulse), не
// сводимая к простой замене переменных (напр. Duo Bold намеренно плоский,
// без размытого свечения — см. medallionGlow ниже).

const PRINCIPLE_LABEL_KEY: Record<MotivationPrinciple, string> = {
  autonomy: 'dailyCard.principle.autonomy',
  competence: 'dailyCard.principle.competence',
  relatedness: 'dailyCard.principle.relatedness',
  process_praise: 'dailyCard.principle.processPraise',
  effort_over_talent: 'dailyCard.principle.effortOverTalent',
  challenge_reframe: 'dailyCard.principle.challengeReframe',
};

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
};

type TFn = (key: string, options?: Record<string, unknown>) => string;
/** Тон карточки: прошлое / сегодня / запертое будущее. Открытые карточки
 *  (FlipCard) бывают только 'past' или 'today' — 'future' только у LockedCard. */
type Tone = 'past' | 'today' | 'future';
type OpenTone = Exclude<Tone, 'future'>;

interface ToneSpec {
  surface: string;
  frame: string;
  ring: string;
  glow: string;
  icon: string;
  text: string;
}

interface ThemeSpec {
  sectionBg: string;
  title: string;
  mutedLabel: string;
  accent: string;
  slotBg: string;
  /** Мягкий блюр-ореол за медальоном — выключен у Duo Bold: в плоском
   *  дизайне с жёсткой обводкой размытое свечение не к месту. */
  medallionGlow: boolean;
  tones: Record<Tone, ToneSpec>;
  front: { bg: string; border: string; text: string; muted: string; shine: string };
  pressGlow: string;
  pressPulse: boolean;
}

// sectionBg/title/mutedLabel/accent/slotBg/front одинаковы для всех тем —
// глобальная тема (data-color-theme на <html>, см. index.css) уже подставляет
// нужные значения в эти CSS-переменные.
const SHARED_SURFACE = {
  sectionBg: 'hsl(var(--card))',
  title: 'hsl(var(--muted-foreground))',
  mutedLabel: 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))',
  slotBg: 'hsl(var(--card))',
  front: {
    bg: 'hsl(var(--card))',
    border: 'hsl(var(--border))',
    text: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted-foreground))',
    shine: 'hsl(var(--foreground) / 0.14)',
  },
};

const THEMES: Record<ColorThemeId, ThemeSpec> = {
  warm: {
    ...SHARED_SURFACE,
    medallionGlow: true,
    tones: {
      past: {
        surface: 'hsl(var(--secondary))',
        frame: 'hsl(var(--muted-foreground) / 0.35)',
        ring: 'hsl(var(--muted-foreground) / 0.4)',
        glow: 'hsl(var(--secondary))',
        icon: 'hsl(var(--muted-foreground))',
        text: 'hsl(var(--foreground))',
      },
      today: {
        surface: 'hsl(var(--accent) / 0.3)',
        frame: 'hsl(var(--accent) / 0.6)',
        ring: 'hsl(var(--accent) / 0.65)',
        glow: 'hsl(var(--accent) / 0.85)',
        icon: 'hsl(var(--accent))',
        text: 'hsl(var(--foreground))',
      },
      future: {
        surface: 'hsl(var(--muted))',
        frame: 'hsl(var(--muted-foreground) / 0.3)',
        ring: 'hsl(var(--muted-foreground) / 0.35)',
        glow: 'hsl(var(--muted-foreground) / 0.4)',
        icon: 'hsl(var(--muted-foreground))',
        text: 'hsl(var(--foreground))',
      },
    },
    pressGlow: [
      '0 0 0 2px hsl(24 100% 58% / 1)',
      '0 0 8px 2px hsl(24 100% 58% / 0.95)',
      '0 0 22px 6px hsl(320 100% 60% / 0.55)',
      '0 0 42px 14px hsl(190 100% 55% / 0.4)',
    ].join(', '),
    pressPulse: true,
  },
  calm: {
    ...SHARED_SURFACE,
    medallionGlow: true,
    tones: {
      past: {
        surface: '#e6e2f7',
        frame: 'rgba(124,111,224,0.35)',
        ring: 'rgba(124,111,224,0.4)',
        glow: '#c9c3f2',
        icon: '#7a749e',
        text: '#3d3b57',
      },
      today: {
        surface: 'linear-gradient(155deg,#bfe7de,#c9c3f2)',
        frame: 'rgba(124,111,224,0.55)',
        ring: 'rgba(124,111,224,0.6)',
        glow: '#7c6fe0',
        icon: '#4f6f8f',
        text: '#3d3b57',
      },
      future: {
        surface: '#e6e2f7',
        frame: 'rgba(124,111,224,0.26)',
        ring: 'rgba(124,111,224,0.28)',
        glow: '#c9c3f2',
        icon: '#7a749e',
        text: '#3d3b57',
      },
    },
    pressGlow:
      '0 0 0 2px rgba(124,111,224,0.9), 0 0 14px 4px rgba(124,111,224,0.55), 0 0 32px 10px rgba(79,182,166,0.45)',
    pressPulse: true,
  },
  bold: {
    ...SHARED_SURFACE,
    medallionGlow: false,
    tones: {
      past: {
        surface: '#f3ecd6',
        frame: '#2b2b28',
        ring: '#2b2b28',
        glow: '#f3ecd6',
        icon: '#2b2b28',
        text: '#2b2b28',
      },
      today: {
        surface: '#ff7a45',
        frame: '#2b2b28',
        ring: '#2b2b28',
        glow: '#ff7a45',
        icon: '#2b2b28',
        text: '#2b2b28',
      },
      future: {
        surface: '#f3ecd6',
        frame: '#2b2b28',
        ring: '#2b2b28',
        glow: '#f3ecd6',
        icon: '#2b2b28',
        text: '#2b2b28',
      },
    },
    pressGlow: '0 0 0 3px #2b2b28, 0 0 0 6px #ff7a45',
    pressPulse: false,
  },
  neon: {
    ...SHARED_SURFACE,
    medallionGlow: true,
    tones: {
      past: {
        surface: '#1c1c24',
        frame: 'rgba(255,255,255,0.12)',
        ring: 'rgba(255,255,255,0.18)',
        glow: '#2a2a35',
        icon: '#a9a9c0',
        text: '#e7e2f5',
      },
      today: {
        surface: '#1c1c24',
        frame: 'rgba(185,140,255,0.6)',
        ring: 'rgba(185,140,255,0.7)',
        glow: '#b98cff',
        icon: '#d8bfff',
        text: '#e7e2f5',
      },
      future: {
        surface: '#1c1c24',
        frame: 'rgba(255,255,255,0.1)',
        ring: 'rgba(255,255,255,0.15)',
        glow: '#2a2a35',
        icon: '#7d7d92',
        text: '#e7e2f5',
      },
    },
    pressGlow:
      '0 0 0 2px #b98cff, 0 0 10px 3px #b98cff, 0 0 26px 8px rgba(94,234,212,0.7), 0 0 46px 16px rgba(94,234,212,0.4)',
    pressPulse: true,
  },
};

function getSlotLabel(offset: number, t: TFn): string {
  if (offset === 0) return t('dailyCard.slot.today');
  if (offset === 1) return t('dailyCard.slot.tomorrow');
  if (offset === -1) return t('dailyCard.slot.yesterday');
  return t('dailyCard.slot.daysAgo', { count: Math.abs(offset) });
}

export default function DailyMotivationCard() {
  const { t } = useTranslation();
  const history = useCardHistory();
  const { favorites, isFavorite, toggle, remove } = useFavorites();
  const { theme: themeId } = useColorTheme();
  const theme = THEMES[themeId];
  const reducedMotion = useReducedMotion();
  const todayRef = useRef<HTMLDivElement>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  // Лента прокручивается горизонтально на любом экране (и на мобильном, и на
  // десктопе) — карточек может быть до 9 (неделя назад + сегодня + завтра), в
  // сетку это уже не уложить. Сразу показываем сегодняшнюю по центру, чтобы
  // было видно, что слева есть история, а справа — запертый день.
  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, []);

  return (
    <section
      aria-label={t('dailyCard.title')}
      className="relative rounded-3xl shadow-neumorphic p-5 overflow-hidden"
      style={{ background: theme.sectionBg }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: theme.title }}>
          {t('dailyCard.title')}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFavoritesOpen(true)}
            aria-label={t('dailyCard.favorite.modalTitle')}
            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: favorites.length > 0 ? theme.accent : theme.mutedLabel }}
          >
            <Star
              aria-hidden="true"
              className="w-3.5 h-3.5"
              fill={favorites.length > 0 ? theme.accent : 'none'}
            />
            {favorites.length > 0 && <span>{favorites.length}</span>}
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-1 [justify-content:safe_center]">
        {history.map((vm) => {
          const toneKey: Tone = vm.offset === 0 ? 'today' : vm.offset > 0 ? 'future' : 'past';
          return (
            <DaySlot
              key={vm.dateKey}
              title={getSlotLabel(vm.offset, t)}
              toneKey={toneKey}
              theme={theme}
              slotRef={vm.offset === 0 ? todayRef : undefined}
            >
              {vm.kind === 'locked' ? (
                <LockedCard unlocksAt={vm.unlocksAt} theme={theme} t={t} />
              ) : (
                <DayCardContent
                  vm={vm}
                  reducedMotion={reducedMotion}
                  t={t}
                  theme={theme}
                  toneKey={vm.offset === 0 ? 'today' : 'past'}
                  icon={
                    vm.offset === 0 ? (
                      <Sparkles aria-hidden="true" className="w-4 h-4" />
                    ) : (
                      <History aria-hidden="true" className="w-4 h-4" />
                    )
                  }
                  isFavorite={isFavorite}
                  onToggleFavorite={toggle}
                />
              )}
            </DaySlot>
          );
        })}
      </div>

      <FavoritesModal
        open={favoritesOpen}
        onOpenChange={setFavoritesOpen}
        favorites={favorites}
        onRemove={remove}
        t={t}
      />
    </section>
  );
}

// --- Обёртка слота: заголовок + рамка карты, пропорции игральной карты ---
function DaySlot({
  title,
  toneKey,
  theme,
  slotRef,
  children,
}: {
  title: string;
  toneKey: Tone;
  theme: ThemeSpec;
  slotRef?: React.RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
}) {
  return (
    <div
      ref={slotRef}
      className={cn(
        'relative flex flex-col shrink-0 snap-center rounded-2xl p-2 shadow-neumorphic-sm',
        'w-[74%] sm:w-56 md:w-60',
        'aspect-[5/7]',
      )}
      style={{ background: theme.slotBg }}
    >
      <span
        className="shrink-0 text-center text-[11px] font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: toneKey === 'today' ? theme.accent : theme.mutedLabel }}
      >
        {title}
      </span>
      <div
        className="relative flex-1 min-h-0 rounded-2xl"
        style={
          toneKey === 'today' ? { boxShadow: `0 0 0 1px ${theme.tones.today.ring}` } : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

// --- Рубашка карты: однотонная заливка (свой оттенок на тон) + рамка +
// медальон с иконкой — просто, без узоров. ---
function CardBackShell({ toneSpec, children }: { toneSpec: ToneSpec; children: React.ReactNode }) {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden"
      style={{ background: toneSpec.surface }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[6px] rounded-[0.6rem] border-2"
        style={{ borderColor: toneSpec.frame }}
      />
      <div className="relative flex flex-col items-center gap-2 px-3 text-center">{children}</div>
    </div>
  );
}

function CardMedallion({
  toneSpec,
  chipBg,
  icon,
  pulse,
  showGlow,
}: {
  toneSpec: ToneSpec;
  chipBg: string;
  icon: React.ReactNode;
  pulse: boolean;
  showGlow: boolean;
}) {
  return (
    <span className="relative flex items-center justify-center w-11 h-11">
      {showGlow && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -inset-1.5 rounded-full blur-md opacity-70',
            pulse && 'animate-glow-warm',
          )}
          style={{ background: toneSpec.glow }}
        />
      )}
      <span
        className="relative flex items-center justify-center w-9 h-9 rounded-full"
        style={{
          background: chipBg,
          color: toneSpec.icon,
          boxShadow: `var(--elevation-1), 0 0 0 2px ${toneSpec.ring}`,
        }}
      >
        {icon}
      </span>
    </span>
  );
}

// --- Открытая (не запертая по времени) карточка: впервые или повторно ---
function DayCardContent({
  vm,
  reducedMotion,
  t,
  theme,
  toneKey,
  icon,
  isFavorite,
  onToggleFavorite,
}: {
  vm: DayCardViewModel;
  reducedMotion: boolean;
  t: TFn;
  theme: ThemeSpec;
  toneKey: OpenTone;
  icon: React.ReactNode;
  isFavorite: (dayNumber: number) => boolean;
  onToggleFavorite: (entry: {
    dayNumber: number;
    principle: MotivationPrinciple;
    text: string;
  }) => void;
}) {
  if (vm.kind === 'locked') return null;

  const principle = (
    <span
      className="mt-2 inline-block text-[11px] font-semibold"
      style={{ color: theme.front.muted }}
    >
      {t(PRINCIPLE_LABEL_KEY[vm.card.principle])}
    </span>
  );

  const fav = isFavorite(vm.card.day);
  const toggleFav = () =>
    onToggleFavorite({ dayNumber: vm.card.day, principle: vm.card.principle, text: vm.card.text });
  const favoriteLabel = fav ? t('dailyCard.favorite.remove') : t('dailyCard.favorite.add');

  return (
    <FlipCard
      text={vm.card.text}
      principle={principle}
      revealed={vm.revealed}
      isFirstReveal={vm.isFirstReveal}
      onToggle={vm.toggle}
      reducedMotion={reducedMotion}
      theme={theme}
      toneKey={toneKey}
      icon={icon}
      isFavorite={fav}
      onToggleFavorite={toggleFav}
      favoriteLabel={favoriteLabel}
      t={t}
    />
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

// --- Запертая карточка «завтра»: обратный отсчёт до полуночи ---
function LockedCard({ unlocksAt, theme, t }: { unlocksAt: number; theme: ThemeSpec; t: TFn }) {
  const [remainingMs, setRemainingMs] = useState(() => unlocksAt - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setRemainingMs(unlocksAt - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [unlocksAt]);

  const toneSpec = theme.tones.future;

  return (
    <div className="absolute inset-0">
      <CardBackShell toneSpec={toneSpec}>
        <CardMedallion
          toneSpec={toneSpec}
          chipBg={theme.sectionBg}
          icon={<Lock aria-hidden="true" className="w-4 h-4" />}
          pulse={false}
          showGlow={theme.medallionGlow}
        />
        <span className="text-xs" style={{ color: theme.mutedLabel }}>
          {t('dailyCard.slot.unlocksIn')}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: toneSpec.text }}>
          {formatCountdown(remainingMs)}
        </span>
      </CardBackShell>
    </div>
  );
}

// --- Избранное ---
function FavoriteButton({
  isFavorite,
  onToggle,
  reducedMotion,
  label,
  accent,
  muted,
}: {
  isFavorite: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
  label: string;
  accent: string;
  muted: string;
}) {
  const [pulse, setPulse] = useState(false);

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
        if (!reducedMotion) setPulse(true);
      }}
      onAnimationEnd={() => setPulse(false)}
      aria-pressed={isFavorite}
      aria-label={label}
      className="absolute -top-0.5 -right-0.5 z-10 p-1.5 rounded-full transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ color: isFavorite ? accent : muted }}
    >
      <Star
        aria-hidden="true"
        className={cn('w-4 h-4', pulse && 'animate-icon-pop')}
        fill={isFavorite ? accent : 'none'}
      />
    </button>
  );
}

function RevealedCardFace({
  text,
  principle,
  isFavorite,
  onToggleFavorite,
  favoriteLabel,
  reducedMotion,
  front,
}: {
  text: string;
  principle: React.ReactNode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoriteLabel: string;
  reducedMotion: boolean;
  front: ThemeSpec['front'];
}) {
  return (
    <>
      <FavoriteButton
        isFavorite={isFavorite}
        onToggle={onToggleFavorite}
        reducedMotion={reducedMotion}
        label={favoriteLabel}
        accent={front.text}
        muted={front.muted}
      />
      <p className="text-sm font-medium leading-relaxed" style={{ color: front.text }}>
        {text}
      </p>
      {principle}
    </>
  );
}

function FavoritesModal({
  open,
  onOpenChange,
  favorites,
  onRemove,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favorites: { dayNumber: number; principle: MotivationPrinciple; text: string }[];
  onRemove: (dayNumber: number) => void;
  t: TFn;
}) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Star}
      iconBg="bg-accent/10"
      iconColor="text-accent"
      title={t('dailyCard.favorite.modalTitle')}
      description={t('dailyCard.favorite.modalDescription')}
      className="max-w-md"
    >
      {favorites.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t('dailyCard.favorite.empty')}
        </p>
      ) : (
        <ul className="-mx-1 max-h-[50vh] space-y-2 overflow-y-auto px-1">
          {favorites.map((f) => (
            <li
              key={f.dayNumber}
              className="relative rounded-xl border border-border/60 bg-secondary/30 p-3 pr-9"
            >
              <p className="text-sm text-foreground leading-relaxed">{f.text}</p>
              <span className="mt-1 inline-block text-[11px] font-semibold text-muted-foreground">
                {t(PRINCIPLE_LABEL_KEY[f.principle])}
              </span>
              <button
                type="button"
                onClick={() => onRemove(f.dayNumber)}
                aria-label={t('dailyCard.favorite.remove')}
                className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <X aria-hidden="true" className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}

// --- «Hearthstone»-флип: единая анимация для всех карточек, туда-обратно ---
// Взаимодействие — press & hold: pointerdown запускает нарастающее свечение
// по кромке карты (реакция на удержание), а сам флип (тумблинг с овершутом +
// вспышка на ребре + shine по лицевой стороне) запускается в момент
// pointerup — «отпустил палец — карта перевернулась». Всё через
// useAnimation() (императивно), а не через declarative `animate`, потому что
// одно и то же целевое значение (например, открыть → закрыть → открыть)
// должно проигрываться заново при каждом тапе, а не схлопываться из-за
// framer-motion-диффинга одинаковых таргетов.
const FLIP_DURATION = 0.6;
const FLIP_TIMES = [0, 0.45, 0.8, 1];
const FLIP_EASE: ('easeIn' | 'easeOut')[] = ['easeIn', 'easeOut', 'easeOut'];

function FlipFlash({ color }: { color: string }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute inset-0 m-auto w-10 h-10 rounded-full pointer-events-none z-20"
      style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: [0, 1, 0], scale: [0.4, 3, 4] }}
      transition={{
        duration: FLIP_DURATION * 0.65,
        delay: FLIP_DURATION * 0.34,
        times: [0, 0.5, 1],
        ease: 'easeOut',
      }}
    />
  );
}

function ShineSweep({ color }: { color: string }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute inset-y-0 w-1/3 pointer-events-none"
      style={{
        background: `linear-gradient(75deg, transparent, ${color}, transparent)`,
        transform: 'skewX(-20deg)',
      }}
      initial={{ x: '-160%' }}
      animate={{ x: '260%' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
  );
}

interface FlipCardProps {
  text: string;
  principle: React.ReactNode;
  revealed: boolean;
  isFirstReveal: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
  theme: ThemeSpec;
  toneKey: OpenTone;
  icon: React.ReactNode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoriteLabel: string;
  t: TFn;
}

function FlipCard({
  text,
  principle,
  revealed,
  isFirstReveal,
  onToggle,
  reducedMotion,
  theme,
  toneKey,
  icon,
  isFavorite,
  onToggleFavorite,
  favoriteLabel,
  t,
}: FlipCardProps) {
  const toneSpec = theme.tones[toneKey];
  const controls = useAnimation();
  const pressedRef = useRef(false);
  const [pressed, setPressed] = useState(false);
  const [flipKey, setFlipKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);

  const commit = () => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    setPressed(false);

    const willReveal = !revealed;
    onToggle();
    setFlipKey((k) => k + 1);
    if (willReveal && isFirstReveal) setBurstKey((k) => k + 1);

    if (reducedMotion) {
      controls.set({ rotateY: willReveal ? 180 : 0, scale: 1 });
      return;
    }
    vibrate(willReveal ? 14 : 10);
    window.setTimeout(() => vibrate(6), FLIP_DURATION * 1000);
    controls.start({
      rotateY: willReveal ? 180 : 0,
      scale: [1, 1.1, 0.96, 1],
      transition: { duration: FLIP_DURATION, times: FLIP_TIMES, ease: FLIP_EASE },
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pressedRef.current = true;
    if (!reducedMotion) setPressed(true);
  };
  const cancelPress = () => {
    pressedRef.current = false;
    setPressed(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      pressedRef.current = true;
      if (!reducedMotion) setPressed(true);
    }
  };
  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPressed(false);
      commit();
    }
  };

  const backLabel = isFirstReveal ? t('dailyCard.cta') : t('dailyCard.slot.recallCta');
  const flipAriaLabel = revealed ? t('dailyCard.slot.flipBack') : backLabel;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={revealed}
      aria-label={flipAriaLabel}
      onPointerDown={handlePointerDown}
      onPointerUp={() => {
        setPressed(false);
        commit();
      }}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className="absolute inset-0 rounded-2xl cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ perspective: 1000, touchAction: 'pan-y' }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute -inset-1 rounded-[1.1rem] pointer-events-none z-30"
        style={{ boxShadow: theme.pressGlow }}
        initial={false}
        animate={
          pressed
            ? theme.pressPulse
              ? { opacity: [0.7, 1, 0.7] }
              : { opacity: 1 }
            : { opacity: 0 }
        }
        transition={
          pressed
            ? theme.pressPulse
              ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.12 }
            : { duration: 0.2, ease: 'easeIn' }
        }
      />

      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={{ rotateY: revealed ? 180 : 0, scale: 1 }}
        animate={controls}
      >
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
          aria-hidden={revealed}
        >
          <CardBackShell toneSpec={toneSpec}>
            <CardMedallion
              toneSpec={toneSpec}
              chipBg={theme.sectionBg}
              icon={icon}
              pulse={!reducedMotion && toneKey === 'today'}
              showGlow={theme.medallionGlow}
            />
            <span className="text-sm font-bold" style={{ color: toneSpec.text }}>
              {backLabel}
            </span>
          </CardBackShell>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 py-3 rounded-2xl border overflow-y-auto overflow-x-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: theme.front.bg,
            borderColor: theme.front.border,
          }}
          aria-hidden={!revealed}
          aria-live="polite"
        >
          <RevealedCardFace
            text={text}
            principle={principle}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            favoriteLabel={favoriteLabel}
            reducedMotion={reducedMotion}
            front={theme.front}
          />
          {revealed && !reducedMotion && (
            <ShineSweep color={theme.front.shine} key={`shine-${flipKey}`} />
          )}
        </div>
      </motion.div>

      {flipKey > 0 && !reducedMotion && (
        <FlipFlash color={toneSpec.glow} key={`flash-${flipKey}`} />
      )}
      {!reducedMotion && (
        <ClaimBurst triggerKey={burstKey} radius={70} count={6} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}
