import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import type { ListingCardData } from "./ListingCard";

/**
 * Compact, text-first listing row — the classifieds pattern: many ads visible at
 * once, almost no bytes. Images stay on the detail page.
 */
export default async function ListingRow({
  listing,
  locale,
}: {
  listing: ListingCardData & { createdAt?: Date | string | null };
  locale: string;
}) {
  const t = await getTranslations("listing");
  const place = [provinceName(listing.province), listing.campus]
    .filter(Boolean)
    .join(" · ");

  const date = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString(locale === "es" ? "es" : "en", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex items-baseline gap-3 border-b border-gray-200 px-3 py-2.5 transition hover:bg-brand/5"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {listing.isFeatured && (
            <span className="shrink-0 rounded bg-amber-400 px-1 text-[10px] font-bold text-amber-900">
              ★
            </span>
          )}
          <span className="truncate text-sm font-medium text-navy group-hover:text-brand group-hover:underline">
            {listing.title}
          </span>
        </span>
        {place && (
          <span className="mt-0.5 block truncate text-xs text-gray-400">
            {place}
          </span>
        )}
      </span>

      <span className="shrink-0 text-sm font-bold text-brand">
        {formatPrice(listing.priceAmount, listing.currency, t("free"))}
      </span>
      {date && (
        <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">
          {date}
        </span>
      )}
    </Link>
  );
}
