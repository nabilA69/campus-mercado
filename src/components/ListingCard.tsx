import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { provinceName } from "@/lib/provinces";

export type ListingCardData = {
  id: string;
  title: string;
  priceAmount: number;
  currency: string;
  campus: string | null;
  province?: string | null;
  imageUrl: string | null;
  isFeatured?: boolean;
};

export default async function ListingCard({ listing }: { listing: ListingCardData }) {
  const t = await getTranslations("listing");

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group rounded-lg bg-white border border-gray-200 overflow-hidden hover:border-brand hover:shadow-sm transition flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
        {listing.isFeatured && (
          <span className="absolute top-1.5 left-1.5 z-10 rounded bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 shadow">
            ★ {t("featured")}
          </span>
        )}
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
        ) : (
          <span className="text-3xl text-gray-300">📦</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-sm font-medium line-clamp-2">{listing.title}</p>
        <p className="mt-1 text-brand font-bold">
          {formatPrice(listing.priceAmount, listing.currency, t("free"))}
        </p>
        {(listing.province || listing.campus) && (
          <p className="mt-auto pt-1 text-xs text-gray-400 truncate">
            {[provinceName(listing.province), listing.campus]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
