import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SuggestOption {
  id: string;
  label: string;
}

interface SuggestComboboxProps {
  options: SuggestOption[];
  selected: string[];
  onToggle: (id: string) => void;
  accentClassName: string;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  selectedCountLabel: string;
  className?: string;
}

export default function SuggestCombobox({
  options,
  selected,
  onToggle,
  accentClassName,
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  selectedCountLabel,
  className,
}: SuggestComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selected.includes(o.id)),
    [options, selected],
  );

  const labelRef = useRef<HTMLParagraphElement>(null);
  const id = useMemo(() => `suggest-combobox-${label}`, [label]);

  return (
    <div ref={rootRef} className={cn("space-y-2", className)}>
      <p ref={labelRef} id={`${id}-label`} className={cn("text-xs font-medium", accentClassName)}>
        {label}
      </p>

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 min-h-11 text-left shadow-neumorphic-sm transition-[box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] cursor-pointer",
          open && "ring-2 ring-ring",
        )}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
            >
              {o.label}
              <button
                type="button"
                aria-label={t("cba.removeItem")}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(o.id);
                }}
                className="text-muted-foreground hover:text-destructive focus-visible:outline-none"
              >
                <X aria-hidden="true" className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "ml-auto h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      <p className="text-xs text-muted-foreground">
        {t(selectedCountLabel, { count: selected.length })}
      </p>

      {open && (
        <div
          role="listbox"
          id={`${id}-listbox`}
          aria-labelledby={`${id}-label`}
          className="rounded-xl border border-border bg-card shadow-neumorphic overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search aria-hidden="true" className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</p>
            )}
            {filtered.map((o) => {
              const checked = selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => onToggle(o.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    checked ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 shrink-0 rounded-md border flex items-center justify-center",
                      checked
                        ? "bg-primary-strong border-primary-strong text-white"
                        : "border-border",
                    )}
                  >
                    {checked && <Check aria-hidden="true" className="w-3 h-3" />}
                  </span>
                  <span className="min-w-0 flex-1">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
