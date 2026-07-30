"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveImage, isAllowedImage } from "@/lib/storage";

export type ListingState = { error?: string };

const MAX_IMAGES = 4;

const schema = z.object({
  title: z.string().trim().min(3, "titleShort").max(120, "titleLong"),
  description: z.string().trim().min(10, "descShort").max(4000, "descLong"),
  price: z.coerce.number().int("priceInvalid").min(0, "priceInvalid"),
  currency: z.enum(["CUP", "USD", "MLC"]),
  categoryId: z.string().min(1, "categoryRequired"),
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
    imageUrls.push(await saveImage(file, "listings"));
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: user!.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priceAmount: parsed.data.price,
      currency: parsed.data.currency,
      categoryId: parsed.data.categoryId,
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
