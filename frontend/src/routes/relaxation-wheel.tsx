import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Settings, Plus, X, Check, Pencil, Trash2, Shuffle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useRewardPractice } from '../features/gamification';
import { PracticeSource } from '../features/gamification/practice.enums';
import RelaxationWheelSvg from '../features/relaxation-wheel/RelaxationWheelSvg';
import {
  computeTargetRotation,
  pickRandomSegmentIndex,
} from '../features/relaxation-wheel/wheelMath';
import { RELAXATION_WHEEL_CATALOG, findRelaxationWheelCatalogItem } from '../lib/relaxationWheel';
import {
  loadRelaxationWheelItems,
  createRelaxationWheelItem,
  removeRelaxationWheelItem,
  type RelaxationWheelCustomItem,
} from '../lib/relaxationWheelItems';
import {
  loadWheels,
  createWheel,
  renameWheel,
  deleteWheel,
  addItemToWheel,
  removeItemFromWheel,
  removeItemFromAllWheels,
  DEFAULT_WHEEL_ID,
  type RelaxationWheel,
} from '../lib/relaxationWheels';

const SPIN_DURATION_SEC = 4.5;
const SPIN_DURATION_MS = SPIN_DURATION_SEC * 1000;

type View =
  | { step: 'list' }
  | { step: 'wheel'; wheelId: string }
  | { step: 'customize'; wheelId: string }
  | { step: 'create' };

function chipClass(active: boolean): string {
  return `relative flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-left shadow-neumorphic-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    active
      ? 'border-primary bg-primary/10 text-primary'
      : 'border-border bg-card text-foreground hover:border-primary/50'
  }`;
}

export default function RelaxationWheelPage() {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const rewardPractice = useRewardPractice();
  const defaultWheelName = t('relaxationWheel.defaultWheelName');

  const [view, setView] = useState<View>({ step: 'list' });
  const [wheels, setWheels] = useState<RelaxationWheel[]>(() => loadWheels(defaultWheelName));
  const [library, setLibrary] = useState<RelaxationWheelCustomItem[]>(() =>
    loadRelaxationWheelItems(),
  );

  const [spinPhase, setSpinPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [rotation, setRotation] = useState(0);
  const [resultKey, setResultKey] = useState<string | null>(null);

  const [createName, setCreateName] = useState('');
  const [itemDraft, setItemDraft] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const refreshWheels = useCallback(() => {
    setWheels(loadWheels(defaultWheelName));
  }, [defaultWheelName]);

  const currentWheel =
    view.step === 'wheel' || view.step === 'customize'
      ? wheels.find((w) => w.id === view.wheelId)
      : undefined;

  useEffect(() => {
    if ((view.step === 'wheel' || view.step === 'customize') && !currentWheel) {
      setView({ step: 'list' });
    }
  }, [view, currentWheel]);

  const resolveItem = useCallback(
    (key: string): { key: string; title: string; description: string } | null => {
      const builtin = findRelaxationWheelCatalogItem(key);
      if (builtin) {
        return { key, title: t(builtin.titleKey), description: t(builtin.descriptionKey) };
      }
      const custom = library.find((c) => c.key === key);
      if (custom) return { key, title: custom.label, description: '' };
      return null;
    },
    [library, t],
  );

  const spin = () => {
    if (!currentWheel || currentWheel.itemKeys.length === 0 || spinPhase === 'spinning') return;
    const idx = pickRandomSegmentIndex(currentWheel.itemKeys.length);
    const key = currentWheel.itemKeys[idx];

    if (reducedMotion) {
      setResultKey(key);
      setSpinPhase('result');
      return;
    }

    setRotation((prev) => computeTargetRotation(prev, idx, currentWheel.itemKeys.length));
    setSpinPhase('spinning');
    window.setTimeout(() => {
      setResultKey(key);
      setSpinPhase('result');
    }, SPIN_DURATION_MS);
  };

  const handleDone = () => {
    rewardPractice.mutate(PracticeSource.RelaxationWheel);
    setSpinPhase('idle');
    setResultKey(null);
  };

  const handleCreateWheel = () => {
    const name = createName.trim();
    if (!name) return;
    const wheel = createWheel(name);
    refreshWheels();
    setCreateName('');
    setView({ step: 'customize', wheelId: wheel.id });
  };

  const commitRename = () => {
    if (!currentWheel) return;
    const name = nameDraft.trim();
    if (!name) return;
    renameWheel(currentWheel.id, name);
    refreshWheels();
    setEditingName(false);
  };

  const handleDeleteWheel = () => {
    if (!currentWheel || currentWheel.id === DEFAULT_WHEEL_ID) return;
    if (!window.confirm(t('relaxationWheel.deleteWheelConfirm', { name: currentWheel.name })))
      return;
    deleteWheel(currentWheel.id);
    refreshWheels();
    setView({ step: 'list' });
  };

  const toggleItemInWheel = (key: string) => {
    if (!currentWheel) return;
    if (currentWheel.itemKeys.includes(key)) removeItemFromWheel(currentWheel.id, key);
    else addItemToWheel(currentWheel.id, key);
    refreshWheels();
  };

  const handleAddItem = () => {
    const label = itemDraft.trim();
    if (!label || !currentWheel) return;
    if (library.some((l) => l.label.toLowerCase() === label.toLowerCase())) return;
    const item = createRelaxationWheelItem(label);
    setLibrary(loadRelaxationWheelItems());
    addItemToWheel(currentWheel.id, item.key);
    refreshWheels();
    setItemDraft('');
  };

  const handleRemoveFromLibrary = (key: string) => {
    removeRelaxationWheelItem(key);
    removeItemFromAllWheels(key);
    setLibrary(loadRelaxationWheelItems());
    refreshWheels();
  };

  if (view.step === 'list') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground font-heading">
            {t('relaxationWheel.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('relaxationWheel.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {wheels.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setView({ step: 'wheel', wheelId: w.id })}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-4 text-center shadow-neumorphic-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <Shuffle aria-hidden="true" className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold text-foreground leading-tight">{w.name}</span>
              <span className="text-xs text-muted-foreground">
                {t('relaxationWheel.itemsCount', { count: w.itemKeys.length })}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setView({ step: 'create' })}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-3 py-4 text-center shadow-neumorphic-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid place-items-center w-10 h-10 rounded-full bg-muted text-muted-foreground">
              <Plus aria-hidden="true" className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-foreground">
              {t('relaxationWheel.createWheel')}
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (view.step === 'create') {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-lg font-heading">
              {t('relaxationWheel.createWheelTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={t('relaxationWheel.createWheelPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateWheel();
              }}
            />
            <div className="flex justify-center gap-3">
              <Button onClick={handleCreateWheel} disabled={!createName.trim()}>
                {t('relaxationWheel.createWheelSubmit')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateName('');
                  setView({ step: 'list' });
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentWheel) return null;

  if (view.step === 'wheel') {
    const result = spinPhase === 'result' && resultKey ? resolveItem(resultKey) : null;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="shadow-neumorphic">
          <CardHeader className="flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => setView({ step: 'list' })}
              aria-label={t('relaxationWheel.backToList')}
              className="grid place-items-center w-9 h-9 rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft aria-hidden="true" className="w-5 h-5" />
            </button>
            <CardTitle className="text-lg font-heading flex-1 truncate">
              {currentWheel.name}
            </CardTitle>
            <button
              type="button"
              onClick={() => setView({ step: 'customize', wheelId: currentWheel.id })}
              aria-label={t('relaxationWheel.customize')}
              className="grid place-items-center w-9 h-9 rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Settings aria-hidden="true" className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 py-4">
            {spinPhase !== 'result' && (
              <>
                <div className="relative" style={{ width: 240, height: 240 }}>
                  <RelaxationWheelSvg
                    itemCount={currentWheel.itemKeys.length}
                    rotation={rotation}
                    transitionDuration={spinPhase === 'spinning' ? SPIN_DURATION_SEC : 0}
                  />
                  <button
                    type="button"
                    onClick={spin}
                    disabled={currentWheel.itemKeys.length === 0 || spinPhase === 'spinning'}
                    aria-label={t('relaxationWheel.spin')}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-btn-gradient text-primary-foreground font-semibold text-xs shadow-elevation-2 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {spinPhase === 'spinning'
                      ? t('relaxationWheel.spinning')
                      : t('relaxationWheel.spin')}
                  </button>
                </div>
                {currentWheel.itemKeys.length === 0 && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('relaxationWheel.emptyWheel')}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setView({ step: 'customize', wheelId: currentWheel.id })}
                    >
                      {t('relaxationWheel.goToCustomize')}
                    </Button>
                  </div>
                )}
              </>
            )}

            {spinPhase === 'result' && result && (
              <div className="w-full space-y-4 text-center" role="status" aria-live="polite">
                <p className="sr-only">
                  {t('relaxationWheel.resultAnnouncement', { title: result.title })}
                </p>
                <div className="rounded-2xl border border-primary/20 bg-secondary px-5 py-6 space-y-2">
                  <p className="text-base font-heading font-extrabold text-foreground">
                    {result.title}
                  </p>
                  {result.description && (
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                  )}
                </div>
                <div className="flex justify-center gap-3">
                  <Button onClick={handleDone}>{t('relaxationWheel.done')}</Button>
                  <Button variant="outline" onClick={spin}>
                    {t('relaxationWheel.spinAgain')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => setView({ step: 'wheel', wheelId: currentWheel.id })}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-neumorphic-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft aria-hidden="true" className="w-4 h-4" />
        {t('common.back')}
      </button>

      <Card className="shadow-neumorphic">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-2">
            {editingName ? (
              <>
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                  }}
                  className="h-9 text-sm flex-1"
                />
                <Button size="sm" onClick={commitRename} disabled={!nameDraft.trim()}>
                  <Check aria-hidden="true" className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-foreground font-heading flex-1 truncate">
                  {t('relaxationWheel.customizeTitle', { name: currentWheel.name })}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(currentWheel.name);
                    setEditingName(true);
                  }}
                  aria-label={t('relaxationWheel.renameWheel')}
                  className="grid place-items-center w-8 h-8 rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil aria-hidden="true" className="w-4 h-4" />
                </button>
                {currentWheel.id !== DEFAULT_WHEEL_ID && (
                  <button
                    type="button"
                    onClick={handleDeleteWheel}
                    aria-label={t('relaxationWheel.deleteWheel')}
                    className="grid place-items-center w-8 h-8 rounded-full text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 aria-hidden="true" className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t('relaxationWheel.itemsInWheel')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RELAXATION_WHEEL_CATALOG.map((d) => {
                const active = currentWheel.itemKeys.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleItemInWheel(d.key)}
                    className={chipClass(active)}
                  >
                    {active && <Check aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate text-xs font-medium">{t(d.titleKey)}</span>
                  </button>
                );
              })}
              {library.map((item) => {
                const active = currentWheel.itemKeys.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 shadow-neumorphic-sm ${
                      active ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItemInWheel(item.key)}
                      className="flex items-center gap-1.5 flex-1 min-w-0 text-left active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {active && (
                        <Check aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-primary" />
                      )}
                      <span className="truncate text-xs font-medium text-foreground">
                        {item.label}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromLibrary(item.key)}
                      aria-label={t('relaxationWheel.removeFromLibrary')}
                      className="grid place-items-center w-6 h-6 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden="true" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Input
                className="h-10 text-sm flex-1"
                placeholder={t('relaxationWheel.addItemPlaceholder')}
                value={itemDraft}
                onChange={(e) => setItemDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem();
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                disabled={
                  !itemDraft.trim() ||
                  library.some((l) => l.label.toLowerCase() === itemDraft.trim().toLowerCase())
                }
              >
                <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
                {t('relaxationWheel.addItem')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
