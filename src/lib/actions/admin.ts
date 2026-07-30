"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BOOST_TIERS, isBoostTier } from "@/lib/boosts";
import { saveImage, isAllowedImage } from "@/lib/storage";

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

/** Create a self-served ad slot (banner sold to a local business). */
export async function createAdSlotAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);

  const position = (formData.get("position") as string) || "home_top";
  const targetUrl = (formData.get("targetUrl") as string) || "";
  const advertiserName = (formData.get("advertiserName") as string)?.trim();
  const startsAtRaw = formData.get("startsAt") as string;
  const expiresAtRaw = formData.get("expiresAt") as string;

  // Image: uploaded file preferred; else a pasted URL.
  let imageUrl = (formData.get("imageUrl") as string)?.trim() || "";
  const file = formData.get("image") as File | null;
  if (file && file.size > 0 && isAllowedImage(file.type)) {
    imageUrl = await saveImage(file, "ads");
  }
  if (!imageUrl || !targetUrl) {
    redirect(`/${locale}/admin/ads`);
  }

  let advertiserId: string | undefined;
  if (advertiserName) {
    const adv = await prisma.advertiser.create({ data: { name: advertiserName } });
    advertiserId = adv.id;
  }

  await prisma.adSlot.create({
    data: {
      position,
      imageUrl,
      targetUrl,
      advertiserId,
      active: true,
      startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
    },
  });

  revalidatePath(`/${locale}/admin/ads`);
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
