"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

// Single compact toggle (shows the language you'd switch TO). Half the width of
// two buttons — important for fitting the header on narrow phones.
export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const other = locale === "es" ? "en" : "es";

  return (
    <button
      onClick={() => router.replace(pathname, { locale: other })}
      aria-label={`Switch language to ${other.toUpperCase()}`}
      className="shrink-0 inline-flex items-center h-10 rounded-md border border-gray-300 px-2.5 text-xs font-semibold uppercase text-gray-600 hover:border-brand hover:text-brand"
    >
      {other}
    </button>
  );
}
