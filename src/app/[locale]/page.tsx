import { connection } from "next/server";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_SEED } from "@/lib/categories";
import ListingCard from "@/components/ListingCard";
import Recommended3D from "@/components/Recommended3D";
import AdBanner from "@/components/AdBanner";
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
        <Link
          href="/post"
          className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 text-white font-semibold hover:bg-brand-dark"
        >
          {t("postCta")}
        </Link>
      </section>

      {/* Self-served ad banner (home_top) */}
      <div className="mb-8">
        <AdBanner position="home_top" />
      </div>

      {/* Personalized recommendations — dramatic 3D slideshow, auto-advancing */}
      <Recommended3D
        title={t("recommended")}
        cards={recommended}
        freeLabel={tl("free")}
        featuredLabel={tl("featured")}
      />

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">{t("browseCategories")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/c/${cat.slug}`}
              className="rounded-lg bg-white border border-gray-200 p-4 hover:border-brand hover:shadow-sm transition flex items-center gap-3"
            >
              <span className="text-2xl" aria-hidden>
                {iconFor(cat.slug)}
              </span>
              <span className="font-medium text-sm">
                {locale === "es" ? cat.nameEs : cat.nameEn}
              </span>
            </Link>
          ))}
        </div>
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
