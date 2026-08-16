"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveImage, isAllowedImage } from "@/lib/storage";
import { isProvinceSlug } from "@/lib/provinces";

export type ListingState = { error?: string };

const MAX_IMAGES = 4;

const schema = z.object({
  title: z.string().trim().min(3, "titleShort").max(120, "titleLong"),
  description: z.string().trim().min(10, "descShort").max(4000, "descLong"),
  price: z.coerce.number().int("priceInvalid").min(0, "priceInvalid"),
  currency: z.enum(["CUP", "USD", "MLC"]),
  categoryId: z.string().min(1, "categoryRequired"),
  province: z.string().trim().optional(),
  campus: z.string().trim().max(80).optional(),
  contactMethod: z.enum(["phone", "whatsapp", "email"]),
  contactValue: z.string().trim().min(3, "contactRequired").max(120),
});

export async function createListingAction(
  _prev: ListingState,
  formData: FormData,
): Promise<ListingState> {
  const locale = (formData.get("locale") as string) || "es";
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  // Only verified students may post (both-sides student gate).
  if (user!.verificationStatus !== "approved") {
    redirect(`/${locale}/verify`);
  }

  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    categoryId: formData.get("categoryId"),
    province: formData.get("province") || undefined,
    campus: formData.get("campus") || undefined,
    contactMethod: formData.get("contactMethod"),
    contactValue: formData.get("contactValue"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category) return { error: "categoryRequired" };

  // Save images (local dev: /public/uploads/listings). Swap for object storage in prod.
  const files = (formData.getAll("images") as File[]).filter(
    (f) => f && f.size > 0,
  );
  const imageUrls: string[] = [];
  for (const file of files.slice(0, MAX_IMAGES)) {
    if (!isAllowedImage(file.type)) return { error: "imageType" };
    try {
      imageUrls.push(await saveImage(file, "listings"));
    } catch (err) {
      console.error("[listings] image upload failed:", err);
      return { error: "storageUnavailable" };
    }
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: user!.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priceAmount: parsed.data.price,
      currency: parsed.data.currency,
      categoryId: parsed.data.categoryId,
      province: isProvinceSlug(parsed.data.province)
        ? parsed.data.province
        : null,
      campus: parsed.data.campus || null,
      contactMethod: parsed.data.contactMethod,
      contactValue: parsed.data.contactValue,
      images: {
        create: imageUrls.map((url, i) => ({ url, sortOrder: i })),
      },
    },
  });

  redirect(`/${locale}/listing/${listing.id}`);
}

/** Owner marks their listing as sold or active again. */
export async function setListingStatusAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const listingId = formData.get("listingId") as string;
  const status = formData.get("status") as string; // sold | active

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (status !== "sold" && status !== "active") {
    redirect(`/${locale}/account/listings`);
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (listing && listing.sellerId === user!.id) {
    await prisma.listing.update({ where: { id: listingId }, data: { status } });
  }
  redirect(`/${locale}/account/listings`);
}

/** Owner deletes their own listing (cascades images, boosts, reports). */
export async function deleteListingAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const listingId = formData.get("listingId") as string;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (listing && listing.sellerId === user!.id) {
    await prisma.listing.delete({ where: { id: listingId } });
  }
  redirect(`/${locale}/account/listings`);
}
