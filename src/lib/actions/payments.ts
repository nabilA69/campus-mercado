"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type ReferenceState = { error?: string; success?: boolean };

/** The payer submits the Transfermóvil transaction reference so an admin can match & confirm it. */
export async function submitPaymentReferenceAction(
  _prev: ReferenceState,
  formData: FormData,
): Promise<ReferenceState> {
  const locale = (formData.get("locale") as string) || "es";
  const paymentId = formData.get("paymentId") as string;
  const reference = ((formData.get("reference") as string) || "").trim();

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (reference.length < 4) return { error: "tooShort" };

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== user!.id) {
    return { error: "notFound" };
  }
  if (payment.status !== "pending") return { error: "notPending" };

  await prisma.payment.update({
    where: { id: paymentId },
    data: { reference },
  });

  revalidatePath(`/${locale}/pay/${paymentId}`);
  return { success: true };
}
