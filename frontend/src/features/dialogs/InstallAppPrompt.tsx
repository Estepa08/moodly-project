import { useTranslation } from 'react-i18next';
import { Share, Smartphone, SquarePlus } from 'lucide-react';
import { ModalShell } from '../../components/ui/modal-shell';
import { Button } from '../../components/ui/button';
import type { InstallPlatform } from '../../hooks/useInstallPrompt';

interface InstallAppPromptProps {
  open: boolean;
  platform: InstallPlatform | null;
  onInstall: () => void;
  onDismiss: () => void;
}

export default function InstallAppPrompt({
  open,
  platform,
  onInstall,
  onDismiss,
}: InstallAppPromptProps) {
  const { t } = useTranslation();
  const isIos = platform === 'ios';

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      icon={Smartphone}
      title={t('pwaInstall.title')}
      description={isIos ? t('pwaInstall.iosDescription') : t('pwaInstall.androidDescription')}
    >
      {isIos && (
        <div className="flex flex-col gap-3 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
              <Share aria-hidden="true" className="w-4 h-4" />
            </span>
            {t('pwaInstall.iosStepShare')}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
              <SquarePlus aria-hidden="true" className="w-4 h-4" />
            </span>
            {t('pwaInstall.iosStepAdd')}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        {!isIos && (
          <Button variant="default" className="w-full" onClick={onInstall}>
            {t('pwaInstall.install')}
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={onDismiss}>
          {isIos ? t('pwaInstall.gotIt') : t('pwaInstall.notNow')}
        </Button>
      </div>
    </ModalShell>
  );
}
