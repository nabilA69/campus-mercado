"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const REASONS = ["spam", "prohibited", "scam", "other"];

/** A logged-in user reports a listing. */
export async function reportListingAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const listingId = formData.get("listingId") as string;
  let reason = (formData.get("reason") as string) || "other";
  if (!REASONS.includes(reason)) reason = "other";

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (listing) {
    await prisma.report.create({
      data: { listingId, reason, reporterId: user!.id, status: "open" },
    });
  }

  redirect(`/${locale}/listing/${listingId}?reported=1`);
}
