import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Plus, X } from "lucide-react";
import type { components } from "../lib/api-types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import CbaWeightSlider from "./CbaWeightSlider";
import { cn } from "../lib/utils";
import type { useCreateCbaEntry } from "../hooks/useCba";

type CbaCommonItem = components["schemas"]["CbaCommonItem"];

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
        {common.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              aria-pressed={isChecked}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isChecked
                  ? "bg-primary/10 text-primary shadow-neumorphic-inset"
                  : "bg-muted text-muted-foreground shadow-neumorphic-sm",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                  isChecked ? "bg-primary border-primary" : "border-border",
                )}
              >
                {isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
              </span>
              {item.itemText}
            </button>
          );
        })}
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
                <X className="w-3.5 h-3.5" />
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
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
          <textarea
            value={thoughtText}
            onChange={(e) => setThoughtText(e.target.value)}
            placeholder={t("cba.thoughtPlaceholder")}
            rows={2}
            className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-base shadow-neumorphic-inset transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none md:text-sm"
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
            onRemoveCustom={(i) => setCustomAdvantages((prev) => prev.filter((_, idx) => idx !== i))}
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
