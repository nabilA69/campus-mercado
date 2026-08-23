import { connection } from "next/server";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_SEED } from "@/lib/categories";
import ListingRow from "@/components/ListingRow";
import ListingCard from "@/components/ListingCard";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";
import CategorySidebar from "@/components/CategorySidebar";
import Recommended3D from "@/components/Recommended3D";
import AdBanner from "@/components/AdBanner";
import SearchBar from "@/components/SearchBar";
import CategoryDropdown from "@/components/CategoryDropdown";
import { fetchListingsFeaturedFirst } from "@/lib/listings-query";

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { locale } = await params;
  const { view: viewParam } = await searchParams;
  // Render fresh each request so new posts, boosts and moderation appear immediately.
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tl = await getTranslations("listing");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const iconFor = (slug: string) =>
    CATEGORY_SEED.find((c) => c.slug === slug)?.icon ?? "📦";

  // Recent active listings (boosted ones surface first, then newest).
  const cards = await fetchListingsFeaturedFirst({ status: "active" }, 40);

  // Personalized recommendations from the categories this visitor browses most
  // (stored in the cm_interests cookie by InterestTracker on listing pages).
  const store = await cookies();
  // URL wins (shareable/refresh-safe), then the saved cookie, else the compact list.
  const view: ViewMode =
    viewParam === "grid" || viewParam === "list"
      ? viewParam
      : store.get("cm_view")?.value === "grid"
        ? "grid"
        : "list";
  const interestSlugs = (store.get("cm_interests")?.value ?? "")
    .split(",")
    .map((s) => decodeURIComponent(s))
    .filter(Boolean);
  const recommended =
    interestSlugs.length > 0
      ? await fetchListingsFeaturedFirst(
          { status: "active", category: { slug: { in: interestSlugs } } },
          12,
        )
      : [];

  // per-category counts for the sidebar
  const counts = await prisma.listing.groupBy({
    by: ["categoryId"],
    where: { status: "active" },
    _count: { _all: true },
  });
  const countFor = (id: string) =>
    counts.find((c) => c.categoryId === id)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Search first — the primary way into a classifieds site */}
      <section className="py-5">
        <SearchBar />
      </section>

      {/* Paid ad banner, or our own promo slideshow when nothing is booked. */}
      <div className="mb-8">
        <AdBanner position="home_top" />
      </div>

      {/* Personalized recommendations — 3D slideshow, auto-advancing */}
      <Recommended3D
        title={t("recommended")}
        cards={recommended}
        freeLabel={tl("free")}
        featuredLabel={tl("featured")}
      />

      <div className="flex flex-col gap-6 pb-12 lg:flex-row">
        {/* Sidebar: categories + provinces (desktop) */}
        <div className="hidden lg:block">
          <CategorySidebar
            categories={categories.map((cat) => ({
              slug: cat.slug,
              name: locale === "es" ? cat.nameEs : cat.nameEn,
              icon: iconFor(cat.slug),
              count: countFor(cat.id),
            }))}
          />
        </div>

        {/* Mobile: categories as a dropdown instead of a sidebar */}
        <div className="lg:hidden">
          <CategoryDropdown
            categories={categories.map((cat) => ({
              slug: cat.slug,
              name: locale === "es" ? cat.nameEs : cat.nameEn,
              icon: iconFor(cat.slug),
            }))}
          />
        </div>

        {/* Main column: dense list of recent ads */}
        <main className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t("recent")}</h2>
            <div className="flex items-center gap-2">
              <ViewToggle current={view} />
              <Link
                href="/post"
                className="shrink-0 rounded-md border-2 border-brand bg-white px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                {t("postCta")}
              </Link>
            </div>
          </div>

          {cards.length > 0 ? (
            view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {cards.map((c) => (
                  <ListingCard key={c.id} listing={c} />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {cards.map((c) => (
                  <ListingRow key={c.id} listing={c} locale={locale} />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-400">
              {t("noListings")}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
