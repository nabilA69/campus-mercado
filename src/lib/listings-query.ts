import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ListingCardData } from "@/components/ListingCard";

/** Set of listing ids that currently have an ACTIVE, non-expired boost. */
export async function getActiveBoostedIds(): Promise<Set<string>> {
  const now = new Date();
  const boosts = await prisma.featuredBoost.findMany({
    where: { status: "active", expiresAt: { gt: now } },
    select: { listingId: true },
  });
  return new Set(boosts.map((b) => b.listingId));
}

/** Fetch listings with boosted ones surfaced first, then newest. */
export async function fetchListingsFeaturedFirst(
  where: Prisma.ListingWhereInput,
  take: number,
): Promise<ListingCardData[]> {
  const boostedIds = await getActiveBoostedIds();
  const boostedList = [...boostedIds];

  const include = { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } };

  const featured =
    boostedList.length > 0
      ? await prisma.listing.findMany({
          where: { ...where, id: { in: boostedList } },
          orderBy: { createdAt: "desc" },
          take,
          include,
        })
      : [];

  const rest = await prisma.listing.findMany({
    where: { ...where, id: { notIn: boostedList } },
    orderBy: { createdAt: "desc" },
    take,
    include,
  });

  return [...featured, ...rest].slice(0, take).map((l) => ({
    id: l.id,
    title: l.title,
    priceAmount: l.priceAmount,
    currency: l.currency,
    campus: l.campus,
    province: l.province,
    imageUrl: l.images[0]?.url ?? null,
    isFeatured: boostedIds.has(l.id),
  }));
}
