import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { components } from "../lib/api-types";
import { ProgressBar } from "./ui/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import EmptyState from "./ui/empty-state";
import { cn } from "../lib/utils";

type CbaExample = components["schemas"]["CbaExample"];

interface CbaLibraryProps {
  examples: CbaExample[];
}

export default function CbaLibrary({ examples }: CbaLibraryProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  if (examples.length === 0) {
    return <EmptyState icon={BookOpen} title={t("cba.libraryEmpty")} />;
  }

  const example = examples[index];
  const advantages = example.items.filter((i) => i.itemType === "advantage");
  const disadvantages = example.items.filter((i) => i.itemType === "disadvantage");

  return (
    <div className="space-y-3">
      <Card className="shadow-neumorphic">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{example.persona}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-foreground">{example.thoughtText}</p>

          {example.distortions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {example.distortions.map((d) => (
                <Link
                  key={d.id}
                  to="/distortions"
                  className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground shadow-neumorphic-sm hover:text-primary transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t(`cognitiveDistortions.${d.distortionKey}`)}
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-accent">{t("cba.pros")}</p>
              <ul className="space-y-1">
                {advantages.map((i) => (
                  <li key={i.id} className="text-sm text-muted-foreground">
                    {i.itemText}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-destructive">{t("cba.cons")}</p>
              <ul className="space-y-1">
                {disadvantages.map((i) => (
                  <li key={i.id} className="text-sm text-muted-foreground">
                    {i.itemText}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="text-sm font-semibold text-accent">{example.prosWeight}</span>
            <ProgressBar
              segments={[
                { value: example.prosWeight, className: "bg-accent" },
                { value: example.consWeight, className: "bg-destructive" },
              ]}
              className="flex-1"
            />
            <span className="text-sm font-semibold text-destructive">{example.consWeight}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label={t("cba.prevExample")}
          className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-all duration-150 cursor-pointer active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {examples.map((e, i) => (
            <span
              key={e.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-150",
                i === index ? "w-6 bg-primary" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(examples.length - 1, i + 1))}
          disabled={index === examples.length - 1}
          aria-label={t("cba.nextExample")}
          className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-all duration-150 cursor-pointer active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
