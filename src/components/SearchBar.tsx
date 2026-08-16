"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PROVINCES } from "@/lib/provinces";

/**
 * Prominent search: free text + province, submitting to /search.
 * On phones the two controls stack into one rounded card; on wider screens they
 * sit inline like a single pill.
 */
export default function SearchBar({
  defaultQuery = "",
  defaultProvince = "",
  autoFocus = false,
}: {
  defaultQuery?: string;
  defaultProvince?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const locale = useLocale();
  const [q, setQ] = useState(defaultQuery);
  const [province, setProvince] = useState(defaultProvince);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (province) params.set("province", province);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-2xl"
      role="search"
      aria-label={t("title")}
    >
      <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-navy/5 sm:flex-row sm:items-center sm:rounded-full sm:pl-5 sm:pr-2">
        {/* text */}
        <div className="flex flex-1 items-center gap-2 px-2 sm:px-0">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="h-11 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-gray-400"
          />
        </div>

        {/* province */}
        <div className="flex items-center gap-2 sm:border-l sm:border-gray-200 sm:pl-3">
          <span className="pl-2 text-gray-400 sm:pl-0" aria-hidden>
            📍
          </span>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            aria-label={t("province")}
            className="h-11 w-full min-w-0 bg-transparent pr-1 text-sm outline-none sm:w-44"
          >
            <option value="">{t("allProvinces")}</option>
            {PROVINCES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-brand px-6 font-semibold text-white transition hover:bg-brand-dark sm:rounded-full"
        >
          {t("button")}
        </button>
      </div>
      <input type="hidden" value={locale} readOnly />
    </form>
  );
}
