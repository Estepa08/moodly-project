import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

interface AddFactorInputProps {
  onAdd: (label: string) => void;
  disabled?: boolean;
}

export default function AddFactorInput({ onAdd, disabled }: AddFactorInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onAdd(trimmed);
    setText('');
  };

  if (disabled) {
    return <p className="text-xs text-muted-foreground">{t('responsibilityPie.maxFactorsHint')}</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('responsibilityPie.addFactorPlaceholder')}
        className="h-9 text-sm"
        enterKeyHint="done"
        inputMode="text"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus aria-hidden="true" className="w-4 h-4" />
        {t('responsibilityPie.addFactorCta')}
      </Button>
    </div>
  );
}
