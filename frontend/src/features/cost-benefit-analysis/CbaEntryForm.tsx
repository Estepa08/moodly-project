import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ChecklistItem } from "../../components/ui/checklist-item";
import { ComponentSize } from "../../lib/constants";
import { cn } from "../../lib/utils";
import CbaWeightSlider from "./CbaWeightSlider";
import type { useCreateCbaEntry } from "./useCba";
import type { CbaCommonItem } from "./cba.types";

interface CbaEntryFormProps {
  commonItems: CbaCommonItem[];
  createEntry: ReturnType<typeof useCreateCbaEntry>;
}

function ItemChecklist({
  title,
  common,
  checked,
  onToggle,
  custom,
  onAddCustom,
  onRemoveCustom,
  accentClassName,
}: {
  title: string;
  common: CbaCommonItem[];
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
      <p className={cn("text-xs font-medium", accentClassName)}>{title}</p>
      <div className="space-y-1.5">
        {common.map((item) => (
          <ChecklistItem
            key={item.id}
            checked={checked.has(item.id)}
            onToggle={() => onToggle(item.id)}
            label={item.itemText}
            size={ComponentSize.Sm}
          />
        ))}
      </div>

      {custom.length > 0 && (
        <ul className="space-y-1.5">
          {custom.map((text, i) => (
            <li
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-primary/10 text-primary shadow-neumorphic-inset"
            >
              <span className="flex-1">{text}</span>
              <button
                type="button"
                onClick={() => onRemoveCustom(i)}
                aria-label={t("cba.removeItem")}
                className="text-muted-foreground hover:text-destructive transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <X aria-hidden="true" className="w-3.5 h-3.5" />
              </button>
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
  const [checkedAdvantages, setCheckedAdvantages] = useState<Set<string>>(new Set());
  const [checkedDisadvantages, setCheckedDisadvantages] = useState<Set<string>>(new Set());
  const [customAdvantages, setCustomAdvantages] = useState<string[]>([]);
  const [customDisadvantages, setCustomDisadvantages] = useState<string[]>([]);
  const [prosWeight, setProsWeight] = useState(50);

  const advantageBank = commonItems.filter((i) => i.itemType === "advantage");
  const disadvantageBank = commonItems.filter((i) => i.itemType === "disadvantage");

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const advantageItems = [
    ...advantageBank.filter((i) => checkedAdvantages.has(i.id)).map((i) => i.itemText),
    ...customAdvantages,
  ];
  const disadvantageItems = [
    ...disadvantageBank.filter((i) => checkedDisadvantages.has(i.id)).map((i) => i.itemText),
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ItemChecklist
            title={t("cba.pros")}
            common={advantageBank}
            checked={checkedAdvantages}
            onToggle={(id) => toggle(checkedAdvantages, setCheckedAdvantages, id)}
            custom={customAdvantages}
            onAddCustom={(text) => setCustomAdvantages((prev) => [...prev, text])}
            onRemoveCustom={(i) =>
              setCustomAdvantages((prev) => prev.filter((_, idx) => idx !== i))
            }
            accentClassName="text-accent"
          />
          <ItemChecklist
            title={t("cba.cons")}
            common={disadvantageBank}
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
