import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { PROVINCES } from "@/lib/provinces";
import HeroShowcase3D from "@/components/HeroShowcase3D";
import { CATEGORY_SEED } from "@/lib/categories";

/**
 * Marketing front door. Separate from "/" on purpose: the feed is what a
 * returning student wants to land on, and burying it behind a pitch would
 * punish the people already using the site.
 *
 * Everything here is real: live listings, live counts, the actual province
 * list. A marketplace that mocks up its own inventory has nothing to show. There is no stock photography and no animation library: the whole page
 * is type, colour and CSS keyframes, which is what a phone on Cuban mobile
 * data can actually afford.
 */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  
  // The front door must render even when the database does not answer. A
  // prospective student who gets a 500 here never finds out what the site is,
  // so live figures degrade to the parts we know without querying anything.
  const live = await loadLiveFigures();

  const stats = [
    ...(live
      ? [
          { value: live.activeListings, label: t("statAds") },
          { value: live.verifiedStudents, label: t("statStudents") },
        ]
      : []),
    { value: PROVINCES.length, label: t("statProvinces") },
    { value: live?.categoryCount ?? CATEGORY_SEED.length, label: t("statCategories") },
  ];

  const steps = [
    { n: t("step1Title"), body: t("step1Body") },
    { n: t("step2Title"), body: t("step2Body") },
    { n: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero: asymmetric split, copy left, the real marketplace right ── */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 md:pt-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-14">
        <div>
          <h1
            className="lp-rise text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl"
            style={{ textWrap: "balance" }}
          >
            {t("heroLine1")}{" "}
            <span className="lp-sheen bg-gradient-to-r from-brand via-[#19a3c4] to-brand bg-clip-text text-transparent">
              {t("heroAccent")}
            </span>
          </h1>

          <p
            className="lp-rise mt-6 max-w-[48ch] text-lg leading-relaxed text-gray-600"
            style={{ "--d": "90ms" } as React.CSSProperties}
          >
            {t("heroSub")}
          </p>

          <div
            className="lp-rise mt-9 flex flex-wrap gap-3"
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            <Link
              href="/register"
              className="rounded-xl bg-brand px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark active:scale-[0.98]"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/"
              className="rounded-xl border-2 border-navy/15 px-7 py-3.5 text-base font-bold text-navy transition hover:border-navy hover:bg-navy hover:text-white active:scale-[0.98]"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        {/* The hero panel. Real listings lead the feed at "/", so this spot
            carries the pitch instead of repeating inventory. */}
        <div
          className="lp-rise"
          style={{ "--d": "240ms" } as React.CSSProperties}
        >
          <HeroShowcase3D />
        </div>
      </section>

      {/* ── Numbers: no cards, just scale and a hairline ── */}
      <section className="border-y border-gray-200 bg-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-12 md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="lp-rise"
              style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
            >
              <dt className="text-4xl font-extrabold tabular-nums text-brand sm:text-5xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-500">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── The point of the site, stated plainly on a sea ground ── */}
      <section className="bg-navy px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {t("trustLine")}
          </p>
          <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-white/70">
            {t("trustBody")}
          </p>
        </div>
      </section>

      {/* ── How it works: staggered, not three equal cards ── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="max-w-[18ch] text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {t("howTitle")}
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="lp-rise"
              style={
                {
                  "--d": `${i * 110}ms`,
                  marginTop: `calc(${i} * clamp(0px, 2.2vw, 2.75rem))`,
                } as React.CSSProperties
              }
            >
              <div className="h-1 w-12 rounded-full bg-brand" />
              <h3 className="mt-5 text-xl font-bold text-navy">{s.n}</h3>
              <p className="mt-2 leading-relaxed text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reach: the whole country, as one moving band ── */}
      <section className="border-y border-gray-200 bg-white py-10">
        <p className="mx-auto mb-6 max-w-6xl px-4 text-sm font-bold uppercase tracking-[0.14em] text-gray-400">
          {t("reachLabel")}
        </p>
        <div className="relative flex overflow-hidden">
          <div className="lp-marquee flex shrink-0 gap-3 pr-3">
            {[...PROVINCES, ...PROVINCES].map((p, i) => (
              <span
                key={`${p.slug}-${i}`}
                className="whitespace-nowrap rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-navy"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            {t("closeTitle")}
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-brand px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark active:scale-[0.98]"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/"
              className="rounded-xl border-2 border-navy/15 px-8 py-4 text-base font-bold text-navy transition hover:border-navy hover:bg-navy hover:text-white active:scale-[0.98]"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

type LiveFigures = {
  activeListings: number;
  verifiedStudents: number;
  categoryCount: number;
};

/** Live numbers, or null when the database cannot be reached. */
async function loadLiveFigures(): Promise<LiveFigures | null> {
  try {
    const [activeListings, verifiedStudents, categoryCount] = await Promise.all([
      prisma.listing.count({ where: { status: "active" } }),
      prisma.user.count({ where: { verificationStatus: "approved" } }),
      prisma.category.count(),
    ]);
    return { activeListings, verifiedStudents, categoryCount };
  } catch (err) {
    console.error("[landing] live figures unavailable:", err);
    return null;
  }
}
