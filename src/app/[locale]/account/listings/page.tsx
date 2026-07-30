import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

export default async function MyListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("myListings");
  const tl = await getTranslations("listing");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const listings = await prisma.listing.findMany({
    where: { sellerId: user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      boosts: { orderBy: { createdAt: "desc" }, take: 1 },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const now = Date.now();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Link
          href="/post"
          className="rounded-md bg-brand px-3 py-1.5 text-white text-sm font-medium hover:bg-brand-dark"
        >
          {t("post")}
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-lg bg-white border border-gray-200 p-8 text-center text-gray-400">
          {t("none")}
        </p>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => {
            const boost = l.boosts[0];
            const activeBoost =
              boost?.status === "active" &&
              boost.expiresAt &&
              boost.expiresAt.getTime() > now;
            const pendingBoost = boost?.status === "pending";
            return (
              <li
                key={l.id}
                className="rounded-lg bg-white border border-gray-200 p-3 flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.images[0].url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl text-gray-300">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{l.title}</p>
                  <p className="text-sm text-brand font-semibold">
                    {formatPrice(l.priceAmount, l.currency, tl("free"))}
                  </p>
                  {activeBoost && (
                    <p className="text-xs text-amber-600 font-medium">
                      ★ {t("boostedUntil")}{" "}
                      {boost.expiresAt!.toISOString().slice(0, 10)}
                    </p>
                  )}
                  {pendingBoost && (
                    <p className="text-xs text-gray-400">{t("boostPending")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Link
                    href={`/listing/${l.id}`}
                    className="text-xs text-gray-500 hover:text-brand text-right"
                  >
                    {t("view")}
                  </Link>
                  {!activeBoost && (
                    <Link
                      href={`/listing/${l.id}/boost`}
                      className="rounded-md bg-amber-400 text-amber-900 px-3 py-1.5 text-xs font-bold hover:bg-amber-500"
                    >
                      ★ {t("boost")}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
