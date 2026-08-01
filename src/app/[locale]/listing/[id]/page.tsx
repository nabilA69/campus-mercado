import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

import ReportButton from "@/components/ReportButton";

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const { locale, id } = await params;
  const { reported } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("listing");
  const tr = await getTranslations("report");

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      seller: { select: { name: true, verificationStatus: true } },
      boosts: { where: { status: "active" }, take: 1 },
    },
  });
  if (!listing || listing.status === "hidden") notFound();

  const viewer = await getCurrentUser();
  const canSeeContact = viewer?.verificationStatus === "approved";
  const isOwner = viewer?.id === listing.sellerId;
  const now = Date.now();
  const isBoosted = listing.boosts.some(
    (b) => b.expiresAt && b.expiresAt.getTime() > now,
  );
  const tb = await getTranslations("myListings");
  const categoryName =
    locale === "es" ? listing.category.nameEs : listing.category.nameEn;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-brand">
        ← {t("backHome")}
      </Link>

      {reported && (
        <p className="mt-4 rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">
          {tr("thanks")}
        </p>
      )}

      <div className="mt-4 grid md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-2">
          {listing.images.length > 0 ? (
            listing.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.url}
                alt={listing.title}
                className="w-full rounded-lg border border-gray-200 object-cover"
              />
            ))
          ) : (
            <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center text-4xl text-gray-300">
              📦
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {categoryName}
          </span>
          {listing.status === "sold" && (
            <span className="ml-2 inline-block text-xs font-bold bg-gray-700 text-white px-2 py-1 rounded">
              {t("soldBadge")}
            </span>
          )}
          <h1 className="mt-2 text-2xl font-bold">{listing.title}</h1>
          <p className="mt-1 text-2xl font-extrabold text-brand">
            {formatPrice(listing.priceAmount, listing.currency, t("free"))}
          </p>

          {listing.campus && (
            <p className="mt-2 text-sm text-gray-500">📍 {listing.campus}</p>
          )}

          <p className="mt-4 whitespace-pre-wrap text-gray-700">
            {listing.description}
          </p>

          <div className="mt-4 text-sm text-gray-500">
            {listing.seller.verificationStatus === "approved" && (
              <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                ✓ {t("verifiedSeller")}
              </span>
            )}
            <p className="mt-1">
              {t("postedOn")}{" "}
              {listing.createdAt.toISOString().slice(0, 10)}
            </p>
          </div>

          {/* Owner: boost this listing */}
          {isOwner && !isBoosted && (
            <Link
              href={`/listing/${listing.id}/boost`}
              className="mt-4 inline-block rounded-md bg-amber-400 text-amber-900 px-4 py-2 text-sm font-bold hover:bg-amber-500"
            >
              ★ {tb("boost")}
            </Link>
          )}
          {isBoosted && (
            <span className="mt-4 inline-block rounded bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold">
              ★ {t("featured")}
            </span>
          )}

          {/* Contact — gated to verified students */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="font-semibold mb-2">{t("contactTitle")}</h2>
            {canSeeContact ? (
              <p className="text-lg font-mono">
                {listing.contactMethod === "email" ? "✉️ " : "📞 "}
                {listing.contactValue}
              </p>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">{t("contactGated")}</p>
                <Link
                  href="/register"
                  className="inline-block rounded-md bg-brand px-4 py-2 text-white font-medium hover:bg-brand-dark"
                >
                  {t("goRegister")}
                </Link>
              </div>
            )}
          </div>

          {/* Report / flag this listing */}
          {!isOwner && <ReportButton listingId={listing.id} locale={locale} />}
        </div>
      </div>
    </div>
  );
}
