import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Ad click tracking: increment the counter, then redirect to the advertiser's URL.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ad = await prisma.adSlot.findUnique({ where: { id } });
  // No ad, or an ad with no destination link -> just go home instead of throwing.
  if (!ad || !ad.targetUrl) {
    return NextResponse.redirect(new URL("/", _req.url));
  }
  await prisma.adSlot.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  });
  return NextResponse.redirect(ad.targetUrl);
}
