import { connection } from "next/server";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_SEED } from "@/lib/categories";
import ListingCard from "@/components/ListingCard";
import Recommended3D from "@/components/Recommended3D";
import AdBanner from "@/components/AdBanner";
import SearchBar from "@/components/SearchBar";
import CategoryDropdown from "@/components/CategoryDropdown";
import { fetchListingsFeaturedFirst } from "@/lib/listings-query";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
  const cards = await fetchListingsFeaturedFirst({ status: "active" }, 12);

  // Personalized recommendations from the categories this visitor browses most
  // (stored in the cm_interests cookie by InterestTracker on listing pages).
  const store = await cookies();
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

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="py-10 sm:py-14 text-center">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">
          {t("heroTitle")}
        </h1>
        <p className="mt-3 text-gray-600 max-w-xl mx-auto">
          {t("heroSubtitle")}
        </p>
        {/* search + province filter */}
        <div className="mt-7">
          <SearchBar />
        </div>

        <Link
          href="/post"
          className="mt-5 inline-block rounded-md bg-brand px-5 py-2.5 text-white font-semibold hover:bg-brand-dark"
        >
          {t("postCta")}
        </Link>
      </section>

      {/* Paid ad banner, or our own promo slideshow when nothing is booked.
          mb-10 leaves room for the slideshow's dots, which sit below it. */}
      <div className="mb-10">
        <AdBanner position="home_top" />
      </div>

      {/* Personalized recommendations — dramatic 3D slideshow, auto-advancing */}
      <Recommended3D
        title={t("recommended")}
        cards={recommended}
        freeLabel={tl("free")}
        featuredLabel={tl("featured")}
      />

      {/* Categories — dropdown, navigates on select */}
      <section className="mb-10 max-w-md">
        <CategoryDropdown
          categories={categories.map((cat) => ({
            slug: cat.slug,
            name: locale === "es" ? cat.nameEs : cat.nameEn,
            icon: iconFor(cat.slug),
          }))}
        />
      </section>

      {/* Recent listings */}
      <section className="mb-12">
        <h2 className="text-lg font-bold mb-4">{t("recent")}</h2>
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
      </section>
    </div>
  );
}
