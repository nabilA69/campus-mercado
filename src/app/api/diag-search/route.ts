import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchListingsFeaturedFirst } from "@/lib/listings-query";

// TEMPORARY diagnostic: isolates whether /search fails in the DB layer or in render.
export async function GET() {
  const out: Record<string, unknown> = {};

  try {
    out.categories = (await prisma.category.count()) + " categories";
  } catch (e) {
    out.categoriesError = String(e).slice(0, 300);
  }

  try {
    const rows = await prisma.listing.findMany({
      where: { status: "active" },
      select: { id: true, province: true },
      take: 3,
    });
    out.provinceColumn = "ok";
    out.sample = rows;
  } catch (e) {
    out.provinceColumnError = String(e).slice(0, 400);
  }

  try {
    const cards = await fetchListingsFeaturedFirst({ status: "active" }, 48);
    out.fetchListings = `ok (${cards.length})`;
  } catch (e) {
    out.fetchListingsError = String(e).slice(0, 400);
  }

  return NextResponse.json(out);
}
