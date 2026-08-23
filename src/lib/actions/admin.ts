"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BOOST_TIERS, isBoostTier } from "@/lib/boosts";
import { saveImage, isAllowedImage } from "@/lib/storage";
import { normalizeUrl, isAdPosition } from "@/lib/urls";
import { isProvinceSlug } from "@/lib/provinces";
import { slugify } from "@/lib/slug";

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
    try {
      imageUrl = await saveImage(file, "ads");
    } catch (err) {
      console.error("[ads] image upload failed:", err);
      return { error: "storageUnavailable" };
    }
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

/* ───────────────────────── Full admin control ─────────────────────────
 * Everything below is admin-only (requireAdmin redirects otherwise) and is
 * deliberately guarded so an admin cannot lock themselves out of the site.
 */

/** Promote or demote a user. An admin can never demote themselves. */
export async function setUserRoleAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const admin = await requireAdmin(locale);
  const userId = formData.get("userId") as string;
  const role = formData.get("role") === "admin" ? "admin" : "student";

  if (userId === admin.id) return; // no self-demotion: avoids lockout
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath(`/${locale}/admin/users`);
}

/** Force a verification status without going through the CI check. */
export async function setUserVerificationAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const userId = formData.get("userId") as string;
  const raw = formData.get("status") as string;
  const status = ["unverified", "pending", "approved", "rejected"].includes(raw)
    ? raw
    : "unverified";

  await prisma.user.update({
    where: { id: userId },
    data: { verificationStatus: status },
  });
  await prisma.studentVerification.updateMany({
    where: { userId },
    data: { status, reviewNotes: "set by admin" },
  });
  revalidatePath(`/${locale}/admin/users`);
}

/** Delete a user and everything they own. Cannot be used on yourself. */
export async function deleteUserAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const admin = await requireAdmin(locale);
  const userId = formData.get("userId") as string;
  if (userId === admin.id) return;

  await prisma.user.delete({ where: { id: userId } }); // cascades to listings etc.
  revalidatePath(`/${locale}/admin/users`);
}

/** Change any listing's status (active / hidden / sold). */
export async function adminSetListingStatusAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const listingId = formData.get("listingId") as string;
  const raw = formData.get("status") as string;
  const status = ["active", "hidden", "sold"].includes(raw) ? raw : "active";

  await prisma.listing.update({ where: { id: listingId }, data: { status } });
  revalidatePath(`/${locale}/admin/listings`);
}

/** Delete any listing outright. */
export async function adminDeleteListingAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const listingId = formData.get("listingId") as string;

  await prisma.listing.delete({ where: { id: listingId } });
  revalidatePath(`/${locale}/admin/listings`);
}

/** Feature a listing for N days without requiring a payment. */
export async function adminFeatureListingAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const listingId = formData.get("listingId") as string;
  const days = Math.min(90, Math.max(1, Number(formData.get("days")) || 7));

  const now = new Date();
  await prisma.featuredBoost.create({
    data: {
      listingId,
      tier: "standard",
      status: "active",
      startsAt: now,
      expiresAt: new Date(now.getTime() + days * 86400_000),
    },
  });
  revalidatePath(`/${locale}/admin/listings`);
}

/** End every active boost on a listing. */
export async function adminUnfeatureListingAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const listingId = formData.get("listingId") as string;

  await prisma.featuredBoost.updateMany({
    where: { listingId, status: "active" },
    data: { status: "expired", expiresAt: new Date() },
  });
  revalidatePath(`/${locale}/admin/listings`);
}

/** Edit any listing's content — the admin equivalent of the seller's own form. */
export async function adminUpdateListingAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const listingId = formData.get("listingId") as string;

  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const categoryId = (formData.get("categoryId") as string) || "";
  const province = (formData.get("province") as string) || "";
  const campus = ((formData.get("campus") as string) || "").trim();
  const contactValue = ((formData.get("contactValue") as string) || "").trim();
  const rawMethod = formData.get("contactMethod") as string;
  const contactMethod = ["phone", "whatsapp", "email"].includes(rawMethod)
    ? rawMethod
    : "phone";
  const rawCurrency = formData.get("currency") as string;
  const currency = ["CUP", "USD", "MLC"].includes(rawCurrency) ? rawCurrency : "CUP";
  const priceAmount = Math.max(0, Math.round(Number(formData.get("price")) || 0));

  if (!title || !description || !contactValue) {
    redirect(`/${locale}/admin/listings/${listingId}?error=1`);
  }
  // Ignore a category id that no longer exists rather than blowing up the update.
  const category = categoryId
    ? await prisma.category.findUnique({ where: { id: categoryId } })
    : null;

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      title,
      description,
      priceAmount,
      currency,
      contactMethod,
      contactValue,
      campus: campus || null,
      province: isProvinceSlug(province) ? province : null,
      ...(category ? { categoryId: category.id } : {}),
    },
  });

  revalidatePath(`/${locale}/admin/listings`);
  redirect(`/${locale}/admin/listings/${listingId}?saved=1`);
}

/** Remove one photo from a listing. */
export async function adminDeleteListingImageAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const imageId = formData.get("imageId") as string;
  const listingId = formData.get("listingId") as string;

  await prisma.listingImage.delete({ where: { id: imageId } });
  revalidatePath(`/${locale}/admin/listings/${listingId}`);
}

/* ───────────────────────────── Categories ───────────────────────────── */

/** Add a category. The slug is what the URL filters on, so it is normalized. */
export async function createCategoryAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);

  const nameEs = ((formData.get("nameEs") as string) || "").trim();
  const nameEn = ((formData.get("nameEn") as string) || "").trim();
  const slug = slugify(((formData.get("slug") as string) || nameEn || nameEs));
  if (!slug || !nameEs || !nameEn) return;

  const clash = await prisma.category.findUnique({ where: { slug } });
  if (clash) return; // slug is unique; silently keep the existing one

  const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.category.create({
    data: { slug, nameEs, nameEn, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidatePath(`/${locale}/admin/categories`);
}

/** Rename a category / change its position. The slug stays put so links survive. */
export async function updateCategoryAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const id = formData.get("categoryId") as string;
  const nameEs = ((formData.get("nameEs") as string) || "").trim();
  const nameEn = ((formData.get("nameEn") as string) || "").trim();
  const sortOrder = Math.round(Number(formData.get("sortOrder")) || 0);
  if (!nameEs || !nameEn) return;

  await prisma.category.update({
    where: { id },
    data: { nameEs, nameEn, sortOrder },
  });
  revalidatePath(`/${locale}/admin/categories`);
}

/** Delete a category. Refused while listings still point at it. */
export async function deleteCategoryAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await requireAdmin(locale);
  const id = formData.get("categoryId") as string;

  const inUse = await prisma.listing.count({ where: { categoryId: id } });
  if (inUse > 0) {
    redirect(`/${locale}/admin/categories?inUse=1`);
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath(`/${locale}/admin/categories`);
}
