import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import ListingCard from "@/components/ListingCard";
import SearchBar from "@/components/SearchBar";
import { fetchListingsFeaturedFirst } from "@/lib/listings-query";
import { isProvinceSlug, provinceName, PROVINCES } from "@/lib/provinces";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; province?: string; category?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("search");

  const q = (sp.q ?? "").trim();
  const province = isProvinceSlug(sp.province) ? sp.province : "";
  const categorySlug = (sp.category ?? "").trim();

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const category = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  const where: Prisma.ListingWhereInput = {
    status: "active",
    ...(province ? { province } : {}),
    ...(category ? { categoryId: category.id } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { campus: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const cards = await fetchListingsFeaturedFirst(where, 48);

  // Build a link that keeps the other filters intact.
  const linkWith = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (province) p.set("province", province);
    if (categorySlug) p.set("category", categorySlug);
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    return `/search?${p.toString()}`;
  };

  const activeProvinceName = provinceName(province);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <SearchBar defaultQuery={q} defaultProvince={province} />

      {/* active filters */}
      {(q || province || category) && (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">{t("filters")}:</span>
          {q && (
            <Link
              href={linkWith({ q: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-3 py-1 text-navy hover:bg-navy/10"
            >
              “{q}” <span aria-hidden>✕</span>
            </Link>
          )}
          {activeProvinceName && (
            <Link
              href={linkWith({ province: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-3 py-1 text-navy hover:bg-navy/10"
            >
              📍 {activeProvinceName} <span aria-hidden>✕</span>
            </Link>
          )}
          {category && (
            <Link
              href={linkWith({ category: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-3 py-1 text-navy hover:bg-navy/10"
            >
              {locale === "es" ? category.nameEs : category.nameEn}{" "}
              <span aria-hidden>✕</span>
            </Link>
          )}
          <Link
            href="/search"
            className="text-gray-400 underline hover:text-brand"
          >
            {t("clearAll")}
          </Link>
        </div>
      )}

      {/* category chips */}
      <div className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href={linkWith({ category: "" })}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
            !category
              ? "border-brand bg-brand text-white"
              : "border-gray-300 bg-white text-gray-600 hover:border-brand"
          }`}
        >
          {t("allCategories")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={linkWith({ category: c.slug })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              category?.id === c.id
                ? "border-brand bg-brand text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-brand"
            }`}
          >
            {locale === "es" ? c.nameEs : c.nameEn}
          </Link>
        ))}
      </div>

      <h1 className="mt-6 text-lg font-bold">
        {t("resultsCount", { count: cards.length })}
      </h1>

      {cards.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((c) => (
            <ListingCard key={c.id} listing={c} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">{t("noResults")}</p>
          {province && (
            <Link
              href={linkWith({ province: "" })}
              className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
            >
              {t("searchAllCuba")}
            </Link>
          )}
        </div>
      )}

      {/* browse by province */}
      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t("browseProvinces")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {PROVINCES.map((p) => (
          <Link
            key={p.slug}
            href={linkWith({ province: p.slug })}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              province === p.slug
                ? "border-navy bg-navy text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-navy hover:text-navy"
            }`}
          >
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
