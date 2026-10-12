import { connection } from "next/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ListingCard from "@/components/ListingCard";
import { fetchListingsPage } from "@/lib/listings-query";
import Pager from "@/components/Pager";

// Category page: lists active listings in the category, with a text search.
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale, slug } = await params;
  const { q, page } = await searchParams;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const query = (q ?? "").trim();
  const feed = await fetchListingsPage(
    {
      categoryId: category.id,
      status: "active",
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    Number(page) || 1,
  );
  const cards = feed.cards;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-bold mb-4">
        {locale === "es" ? category.nameEs : category.nameEn}
      </h1>

      {/* Search within category */}
      <form className="mb-6 flex gap-2" action="" method="get">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 h-11 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button className="shrink-0 rounded-md bg-brand px-4 h-11 text-white font-medium hover:bg-brand-dark">
          {t("search")}
        </button>
      </form>

      {cards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cards.map((c) => (
            <ListingCard key={c.id} listing={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center text-gray-400">
          {t("noListings")}
        </div>
      )}

      <Pager
        base={`/c/${slug}`}
        query={query ? { q: query } : {}}
        page={feed.page}
        totalPages={feed.totalPages}
      />
    </div>
  );
}
