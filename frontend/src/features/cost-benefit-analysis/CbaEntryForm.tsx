import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import CbaWeightSlider from "./CbaWeightSlider";
import SuggestCombobox from "./SuggestCombobox";
import type { useCreateCbaEntry } from "./useCba";
import type { CbaCommonItem, CbaItemCategory } from "./cba.types";

interface CbaEntryFormProps {
  commonItems: CbaCommonItem[];
  createEntry: ReturnType<typeof useCreateCbaEntry>;
}

const CATEGORIES: CbaItemCategory[] = [
  "anxiety",
  "self-esteem",
  "relationships",
  "work",
  "health",
  "habit",
];

function CategoryPicker({
  value,
  onChange,
}: {
  value: CbaItemCategory;
  onChange: (c: CbaItemCategory) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{t("cba.categoryLabel")}</span>
      <Select value={value} onValueChange={(v) => onChange(v as CbaItemCategory)}>
        <SelectTrigger>
          <SelectValue placeholder={t("cba.categoryPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`cba.categories.${c}`)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function ItemSuggest({
  title,
  options,
  checked,
  onToggle,
  custom,
  onAddCustom,
  onRemoveCustom,
  accentClassName,
}: {
  title: string;
  options: CbaCommonItem[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  custom: string[];
  onAddCustom: (text: string) => void;
  onRemoveCustom: (index: number) => void;
  accentClassName: string;
}) {
  const { t } = useTranslation();
  const [customText, setCustomText] = useState("");

  const handleAdd = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    onAddCustom(trimmed);
    setCustomText("");
  };

  return (
    <div className="space-y-2">
      <SuggestCombobox
        label={title}
        accentClassName={accentClassName}
        options={options.map((o) => ({
          id: o.id,
          label: t(`cba.commonItems.${o.itemKey}`),
        }))}
        selected={Array.from(checked)}
        onToggle={onToggle}
        placeholder={t("cba.suggestionsPlaceholder")}
        searchPlaceholder={t("cba.suggestionsSearch")}
        emptyText={t("cba.suggestionsEmpty")}
        selectedCountLabel="cba.selectedCount"
      />

      {custom.length > 0 && (
        <ul className="space-y-1.5">
          {custom.map((text, i) => (
            <li
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-primary/10 text-primary shadow-neumorphic-inset"
            >
              <span className="flex-1">{text}</span>
              <IconButton
                type="button"
                variant="ghost"
                size="icon-sm"
                label={t("cba.removeItem")}
                onClick={() => onRemoveCustom(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X aria-hidden="true" className="w-3.5 h-3.5" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder={t("cba.addItemPlaceholder")}
          className="h-9 text-sm"
          enterKeyHint="done"
          inputMode="text"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus aria-hidden="true" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CbaEntryForm({ commonItems, createEntry }: CbaEntryFormProps) {
  const { t } = useTranslation();
  const [thoughtText, setThoughtText] = useState("");
  const [category, setCategory] = useState<CbaItemCategory>("anxiety");
  const [checkedAdvantages, setCheckedAdvantages] = useState<Set<string>>(new Set());
  const [checkedDisadvantages, setCheckedDisadvantages] = useState<Set<string>>(new Set());
  const [customAdvantages, setCustomAdvantages] = useState<string[]>([]);
  const [customDisadvantages, setCustomDisadvantages] = useState<string[]>([]);
  const [prosWeight, setProsWeight] = useState(50);

  const categoryItems = commonItems.filter((i) => i.category === category);
  const advantageBank = categoryItems.filter((i) => i.itemType === "advantage");
  const disadvantageBank = categoryItems.filter((i) => i.itemType === "disadvantage");

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const checkedItemsText = (bank: CbaCommonItem[], checked: Set<string>): string[] =>
    bank.filter((i) => checked.has(i.id)).map((i) => t(`cba.commonItems.${i.itemKey}`));

  const advantageItems = [
    ...checkedItemsText(advantageBank, checkedAdvantages),
    ...customAdvantages,
  ];
  const disadvantageItems = [
    ...checkedItemsText(disadvantageBank, checkedDisadvantages),
    ...customDisadvantages,
  ];

  const canSave =
    thoughtText.trim().length > 0 && advantageItems.length > 0 && disadvantageItems.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    createEntry.mutate(
      {
        thoughtText: thoughtText.trim(),
        prosWeight,
        consWeight: 100 - prosWeight,
        items: [
          ...advantageItems.map((itemText) => ({ itemType: "advantage" as const, itemText })),
          ...disadvantageItems.map((itemText) => ({ itemType: "disadvantage" as const, itemText })),
        ],
      },
      {
        onSuccess: () => {
          setThoughtText("");
          setCheckedAdvantages(new Set());
          setCheckedDisadvantages(new Set());
          setCustomAdvantages([]);
          setCustomDisadvantages([]);
          setCategory("anxiety");
          setProsWeight(50);
        },
      },
    );
  };

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("cba.formTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{t("cba.thoughtLabel")}</p>
          <Textarea
            value={thoughtText}
            onChange={(e) => setThoughtText(e.target.value)}
            placeholder={t("cba.thoughtPlaceholder")}
            rows={2}
            enterKeyHint="done"
            inputMode="text"
          />
        </div>

        <CategoryPicker value={category} onChange={setCategory} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ItemSuggest
            title={t("cba.pros")}
            options={advantageBank}
            checked={checkedAdvantages}
            onToggle={(id) => toggle(checkedAdvantages, setCheckedAdvantages, id)}
            custom={customAdvantages}
            onAddCustom={(text) => setCustomAdvantages((prev) => [...prev, text])}
            onRemoveCustom={(i) =>
              setCustomAdvantages((prev) => prev.filter((_, idx) => idx !== i))
            }
            accentClassName="text-success"
          />
          <ItemSuggest
            title={t("cba.cons")}
            options={disadvantageBank}
            checked={checkedDisadvantages}
            onToggle={(id) => toggle(checkedDisadvantages, setCheckedDisadvantages, id)}
            custom={customDisadvantages}
            onAddCustom={(text) => setCustomDisadvantages((prev) => [...prev, text])}
            onRemoveCustom={(i) =>
              setCustomDisadvantages((prev) => prev.filter((_, idx) => idx !== i))
            }
            accentClassName="text-destructive"
          />
        </div>

        <CbaWeightSlider prosWeight={prosWeight} onChange={setProsWeight} />

        <Button
          className="w-full"
          disabled={!canSave || createEntry.isPending}
          onClick={handleSave}
        >
          {createEntry.isPending ? t("common.saving") : t("cba.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
