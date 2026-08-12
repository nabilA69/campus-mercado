"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BOOST_TIERS, isBoostTier } from "@/lib/boosts";
import { saveImage, isAllowedImage } from "@/lib/storage";
import { normalizeUrl, isAdPosition } from "@/lib/urls";

async function requireAdmin(locale: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user!.role !== "admin") redirect(`/${locale}`);
  return user!;
}

/** Confirm or reject a Transfermóvil platform-fee payment. Confirming activates the boost/ad. */
export async function reviewPaymentAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const admin = await requireAdmin(locale);
  const paymentId = formData.get("paymentId") as string;
  const decision = formData.get("decision") as string; // approve | reject

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return;

  if (decision === "approve") {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "confirmed", confirmedById: admin.id },
    });

    // Activate a boost payment.
    if (payment.purpose === "boost" && payment.relatedBoostId) {
      const boost = await prisma.featuredBoost.findUnique({
        where: { id: payment.relatedBoostId },
      });
      if (boost && isBoostTier(boost.tier)) {
        const now = new Date();
        const expires = new Date(
          now.getTime() + BOOST_TIERS[boost.tier].days * 86400_000,
        );
        await prisma.featuredBoost.update({
          where: { id: boost.id },
          data: { status: "active", startsAt: now, expiresAt: expires },
        });
      }
    }

    // Activate an ad-slot payment.
    if (payment.purpose === "ad" && payment.relatedAdSlotId) {
      await prisma.adSlot.update({
        where: { id: payment.relatedAdSlotId },
        data: { active: true },
      });
    }
  } else {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "rejected", confirmedById: admin.id },
    });
    if (payment.relatedBoostId) {
      await prisma.featuredBoost.update({
        where: { id: payment.relatedBoostId },
        data: { status: "expired" },
      });
    }
  }

  revalidatePath(`/${locale}/admin/payments`);
}

export type AdSlotState = { error?: string; success?: boolean };

/** Create a self-served ad slot (banner sold to a local business). */
export async function createAdSlotAction(
  _prev: AdSlotState,
  formData: FormData,
): Promise<AdSlotState> {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);

  const position = (formData.get("position") as string) || "home_top";
  if (!isAdPosition(position)) return { error: "badPosition" };

  // Image: uploaded file wins; otherwise accept a pasted URL (bare domains ok).
  let imageUrl: string | null = null;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    if (!isAllowedImage(file.type)) return { error: "badImageType" };
    imageUrl = await saveImage(file, "ads");
  } else {
    imageUrl = normalizeUrl(formData.get("imageUrl") as string);
    if ((formData.get("imageUrl") as string)?.trim() && !imageUrl) {
      return { error: "badImageUrl" };
    }
  }
  if (!imageUrl) return { error: "imageRequired" };

  // Destination link is OPTIONAL — a banner with no link is still a valid ad.
  const rawTarget = ((formData.get("targetUrl") as string) || "").trim();
  const targetUrl = normalizeUrl(rawTarget);
  if (rawTarget && !targetUrl) return { error: "badTargetUrl" };

  const startsAtRaw = (formData.get("startsAt") as string) || "";
  const expiresAtRaw = (formData.get("expiresAt") as string) || "";
  const startsAt = startsAtRaw ? new Date(`${startsAtRaw}T00:00:00`) : null;
  // End of the chosen day, otherwise an ad expiring "today" dies at 00:00.
  const expiresAt = expiresAtRaw ? new Date(`${expiresAtRaw}T23:59:59`) : null;
  if (startsAt && expiresAt && expiresAt < startsAt) {
    return { error: "badDateRange" };
  }

  // Reuse an advertiser with the same name instead of piling up duplicates.
  const advertiserName = ((formData.get("advertiserName") as string) || "").trim();
  let advertiserId: string | undefined;
  if (advertiserName) {
    const existing = await prisma.advertiser.findFirst({
      where: { name: advertiserName },
    });
    advertiserId =
      existing?.id ??
      (await prisma.advertiser.create({ data: { name: advertiserName } })).id;
  }

  await prisma.adSlot.create({
    data: {
      position,
      imageUrl,
      targetUrl: targetUrl ?? "",
      advertiserId,
      active: true,
      startsAt,
      expiresAt,
    },
  });

  revalidatePath(`/${locale}/admin/ads`);
  return { success: true };
}

/** Moderate a reported listing: hide it (and resolve its reports) or dismiss the report. */
export async function reviewReportAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const reportId = formData.get("reportId") as string;
  const listingId = formData.get("listingId") as string;
  const decision = formData.get("decision") as string; // hide | dismiss | unhide

  if (decision === "hide" && listingId) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "hidden" },
    });
    await prisma.report.updateMany({
      where: { listingId, status: "open" },
      data: { status: "resolved" },
    });
  } else if (decision === "unhide" && listingId) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "active" },
    });
    await prisma.report.updateMany({
      where: { listingId, status: "open" },
      data: { status: "dismissed" },
    });
  } else if (decision === "dismiss") {
    if (listingId) {
      await prisma.report.updateMany({
        where: { listingId, status: "open" },
        data: { status: "dismissed" },
      });
    } else if (reportId) {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: "dismissed" },
      });
    }
  }

  revalidatePath(`/${locale}/admin/reports`);
}

/** Toggle an ad slot on/off. */
export async function toggleAdSlotAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const adSlotId = formData.get("adSlotId") as string;
  const slot = await prisma.adSlot.findUnique({ where: { id: adSlotId } });
  if (slot) {
    await prisma.adSlot.update({
      where: { id: adSlotId },
      data: { active: !slot.active },
    });
  }
  revalidatePath(`/${locale}/admin/ads`);
}
