import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BOOST_TIERS, BOOST_CURRENCY, type BoostTier } from "@/lib/boosts";
import { requestBoostAction } from "@/lib/actions/boosts";
import { formatPrice } from "@/lib/format";

export default async function BoostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("boost");
  const tl = await getTranslations("listing");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (listing.sellerId !== user!.id) redirect(`/${locale}/account/listings`);

  const tiers = Object.entries(BOOST_TIERS) as [
    BoostTier,
    (typeof BOOST_TIERS)[BoostTier],
  ][];

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold mb-1">{t("title")}</h1>
      <p className="text-gray-600 mb-2">{t("intro")}</p>
      <p className="text-sm text-gray-400 mb-6 truncate">“{listing.title}”</p>

      <div className="space-y-3">
        {tiers.map(([key, tier]) => (
          <form
            key={key}
            action={requestBoostAction}
            className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between"
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="listingId" value={listing.id} />
            <input type="hidden" name="tier" value={key} />
            <div>
              <p className="font-semibold">
                {locale === "es" ? tier.labelEs : tier.labelEn}
              </p>
              <p className="text-sm text-gray-500">
                {tier.days} {t("days")} ·{" "}
                <span className="font-medium text-brand">
                  {formatPrice(tier.price, BOOST_CURRENCY, tl("free"))}
                </span>
              </p>
            </div>
            <button className="rounded-md bg-amber-400 text-amber-900 px-4 py-2 font-bold hover:bg-amber-500">
              ★ {t("choose")}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
