"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 text-sm">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          className={`px-2 py-1 rounded uppercase ${
            l === locale
              ? "bg-brand text-white font-semibold"
              : "text-gray-500 hover:text-brand"
          }`}
          aria-current={l === locale ? "true" : undefined}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
