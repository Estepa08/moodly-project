import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { PRACTICE_ITEMS, OTHER_ITEMS, DASHBOARD_ITEM } from "../../layout/nav-config";
import { ChevronRight } from "lucide-react";

const STATIC_LABELS: Record<string, string> = {
  "/practices": "nav.practices",
  "/onboarding": "nav.onboarding",
  "/privacy": "nav.privacy",
  "/terms": "nav.terms",
};

export default function Breadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  const crumbs: { label: string; path: string }[] = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    acc += "/" + segments[i];
    const labelKey =
      STATIC_LABELS[acc] ??
      [...PRACTICE_ITEMS, ...OTHER_ITEMS].find((n) => n.path === acc)?.labelKey ??
      DASHBOARD_ITEM.labelKey;
    crumbs.push({ label: t(labelKey), path: acc });
  }

  return (
    <nav aria-label="Breadcrumb" className="px-4 pt-2">
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link
            to="/my-day"
            className="hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {t(DASHBOARD_ITEM.labelKey)}
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            <ChevronRight aria-hidden="true" className="w-3 h-3 shrink-0" />
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="text-foreground font-medium">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
