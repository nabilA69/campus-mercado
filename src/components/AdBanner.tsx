import { prisma } from "@/lib/prisma";
import HouseAdSlideshow from "./HouseAdSlideshow";

/** Renders the active paid ad for a position, or our own promo slideshow. */
export default async function AdBanner({
  position = "home_top",
}: {
  position?: string;
}) {
  const now = new Date();

  const ad = await prisma.adSlot.findFirst({
    where: {
      position,
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // No paid advertiser booked for this slot yet -> run our own promo slideshow
  // instead of leaving an empty placeholder.
  if (!ad) return <HouseAdSlideshow />;

  // Count the view. Never let a stats write break the page render.
  try {
    await prisma.adSlot.update({
      where: { id: ad.id },
      data: { impressions: { increment: 1 } },
    });
  } catch {
    /* ignore */
  }

  const banner = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={ad.imageUrl}
      alt="Ad"
      loading="lazy"
      className="w-full h-auto object-cover"
    />
  );

  // The destination link is optional — render a plain banner when there isn't one.
  if (!ad.targetUrl) {
    return (
      <div className="block overflow-hidden rounded-lg border border-gray-200">
        {banner}
      </div>
    );
  }

  return (
    <a
      href={`/api/ad/${ad.id}/click`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block overflow-hidden rounded-lg border border-gray-200"
    >
      {banner}
    </a>
  );
}
