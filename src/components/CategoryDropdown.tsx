"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export type CategoryOption = { slug: string; name: string; icon: string };

/**
 * Categories as a single dropdown instead of a card grid — compact, and it
 * navigates straight to the category as soon as one is picked.
 */
export default function CategoryDropdown({
  categories,
  defaultSlug = "",
}: {
  categories: CategoryOption[];
  defaultSlug?: string;
}) {
  const t = useTranslations("home");
  const router = useRouter();

  return (
    <label className="block">
      <span className="mb-2 block text-lg font-bold text-foreground">
        {t("browseCategories")}
      </span>
      <div className="relative">
        <select
          defaultValue={defaultSlug}
          onChange={(e) => {
            const slug = e.target.value;
            if (slug) router.push(`/c/${slug}`);
          }}
          aria-label={t("browseCategories")}
          className="h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-4 pr-10 text-base shadow-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
        >
          <option value="">{t("categoryChoose")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {/* chevron */}
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}
