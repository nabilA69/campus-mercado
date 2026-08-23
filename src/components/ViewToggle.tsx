"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export type ViewMode = "list" | "grid";

/**
 * Switches the ad feed between a compact text list and a grid of picture cards.
 * The choice goes into a cookie so it sticks on the next visit, and into the URL
 * so it survives a refresh and can be shared.
 */
export default function ViewToggle({ current }: { current: ViewMode }) {
  const t = useTranslations("view");
  const router = useRouter();
  const pathname = usePathname();

  function choose(mode: ViewMode) {
    if (mode === current) return;
    try {
      document.cookie = `cm_view=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch {
      /* cookies blocked — the URL below still carries the choice */
    }
    router.push({ pathname, query: { view: mode } });
  }

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border transition";
  const on = "border-brand bg-brand text-white";
  const off = "border-gray-300 bg-white text-gray-500 hover:border-brand hover:text-brand";

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("label")}>
      <button
        type="button"
        onClick={() => choose("list")}
        aria-pressed={current === "list"}
        title={t("list")}
        aria-label={t("list")}
        className={`${base} ${current === "list" ? on : off}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => choose("grid")}
        aria-pressed={current === "grid"}
        title={t("grid")}
        aria-label={t("grid")}
        className={`${base} ${current === "grid" ? on : off}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </button>
    </div>
  );
}
