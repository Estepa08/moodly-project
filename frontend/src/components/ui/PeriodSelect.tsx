import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { Period } from '../../lib/constants';
import { PERIODS, cn } from '../../lib/utils';

interface PeriodSelectProps {
  value: Period;
  onChange: (period: Period) => void;
  className?: string;
}

export default function PeriodSelect({ value, onChange, className }: PeriodSelectProps) {
  const { t } = useTranslation();

  const options = useMemo(() => PERIODS.map((p) => ({ key: p.key, label: t(p.labelKey) })), [t]);

  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger aria-label={t('dashboard.period')} className={cn('w-44', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.key} value={opt.key}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
