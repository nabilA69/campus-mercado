"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BOOST_TIERS, BOOST_CURRENCY, isBoostTier } from "@/lib/boosts";

/** A verified owner requests a boost for their listing -> pending boost + pending payment. */
export async function requestBoostAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const listingId = formData.get("listingId") as string;
  const tier = (formData.get("tier") as string) || "";

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user!.verificationStatus !== "approved") redirect(`/${locale}/verify`);
  if (!isBoostTier(tier)) redirect(`/${locale}/listing/${listingId}/boost`);

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user!.id) {
    redirect(`/${locale}/account/listings`);
  }

  const price = BOOST_TIERS[tier].price;

  const boost = await prisma.featuredBoost.create({
    data: { listingId, tier, status: "pending" },
  });
  const payment = await prisma.payment.create({
    data: {
      userId: user!.id,
      purpose: "boost",
      amount: price,
      currency: BOOST_CURRENCY,
      method: "transfermovil",
      status: "pending",
      relatedBoostId: boost.id,
    },
  });

  redirect(`/${locale}/pay/${payment.id}`);
}
