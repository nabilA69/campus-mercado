import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

/** Renders the active self-served ad for a position, or an "advertise here" fallback. */
export default async function AdBanner({
  position = "home_top",
}: {
  position?: string;
}) {
  const t = await getTranslations("footer");
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

  if (!ad) {
    return (
      <a
        href="mailto:ads@campusmercado.shop"
        className="block h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 hover:border-brand hover:text-brand"
      >
        {t("advertise")}
      </a>
    );
  }

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
