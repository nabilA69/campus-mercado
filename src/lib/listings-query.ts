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

  // AND the caller's filter with the boost partition instead of spreading it:
  // a spread would let our `id` key overwrite an `id` the caller already set
  // (e.g. "not this listing" on the similar-products row).
  const featured =
    boostedList.length > 0
      ? await prisma.listing.findMany({
          where: { AND: [where, { id: { in: boostedList } }] },
          orderBy: { createdAt: "desc" },
          take,
          include,
        })
      : [];

  const rest = await prisma.listing.findMany({
    where: { AND: [where, { id: { notIn: boostedList } }] },
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
    createdAt: l.createdAt,
    imageUrl: l.images[0]?.url ?? null,
    isFeatured: boostedIds.has(l.id),
  }));
}

export const PER_PAGE = 24;

export type ListingsPage = {
  cards: ListingCardData[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * One page of listings, boosted first then newest.
 *
 * The feed is two queries concatenated, so a page can straddle the boundary:
 * it may be all boosted, all unboosted, or the tail of one and the head of the
 * other. The maths below splits the window across both rather than paging each
 * independently, which would repeat or drop rows at the seam.
 */
export async function fetchListingsPage(
  where: Prisma.ListingWhereInput,
  page: number,
  perPage: number = PER_PAGE,
): Promise<ListingsPage> {
  const boostedIds = await getActiveBoostedIds();
  const boostedList = [...boostedIds];

  const featuredWhere: Prisma.ListingWhereInput = {
    AND: [where, { id: { in: boostedList } }],
  };
  const restWhere: Prisma.ListingWhereInput = {
    AND: [where, { id: { notIn: boostedList } }],
  };

  const [featuredCount, restCount] = await Promise.all([
    boostedList.length > 0 ? prisma.listing.count({ where: featuredWhere }) : 0,
    prisma.listing.count({ where: restWhere }),
  ]);

  const total = featuredCount + restCount;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const skip = (current - 1) * perPage;

  // Window [skip, skip + perPage) over featured ++ rest.
  const featSkip = Math.min(skip, featuredCount);
  const featTake = Math.max(0, Math.min(perPage, featuredCount - skip));
  const restSkip = Math.max(0, skip - featuredCount);
  const restTake = perPage - featTake;

  const include = { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } };

  const [featured, rest] = await Promise.all([
    featTake > 0
      ? prisma.listing.findMany({
          where: featuredWhere,
          orderBy: { createdAt: "desc" },
          skip: featSkip,
          take: featTake,
          include,
        })
      : Promise.resolve([]),
    restTake > 0
      ? prisma.listing.findMany({
          where: restWhere,
          orderBy: { createdAt: "desc" },
          skip: restSkip,
          take: restTake,
          include,
        })
      : Promise.resolve([]),
  ]);

  return {
    total,
    page: current,
    totalPages,
    cards: [...featured, ...rest].map((l) => ({
      id: l.id,
      title: l.title,
      priceAmount: l.priceAmount,
      currency: l.currency,
      campus: l.campus,
      province: l.province,
      createdAt: l.createdAt,
      imageUrl: l.images[0]?.url ?? null,
      isFeatured: boostedIds.has(l.id),
    })),
  };
}
