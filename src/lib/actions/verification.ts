"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveImage, isAllowedImage } from "@/lib/storage";
import { isValidCiFormat, ciMatchesDob } from "@/lib/ci";

export type VerifyState = {
  error?: string;
  success?: boolean;
  reason?: string; // "ci_mismatch" when the No. CI doesn't match the DOB
};

// Instant, deterministic verification (no AI, no admin): the student types the
// No. CI from their Carné; if its first 6 digits (YYMMDD) match their date of
// birth, they're verified immediately. The photo is stored as a record.
export async function submitVerificationAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const locale = (formData.get("locale") as string) || "es";
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  if (user.verificationStatus === "approved") {
    return { error: "already" };
  }
  if (!user.dateOfBirth) return { error: "errorNoDob" };

  const ciNumber = ((formData.get("ciNumber") as string) || "").replace(/\D/g, "");
  if (!isValidCiFormat(ciNumber)) return { error: "errorCiFormat" };

  const file = formData.get("idCard") as File | null;
  if (!file || file.size === 0) return { error: "errorNoFile" };
  if (!isAllowedImage(file.type)) return { error: "errorType" };

  const matches = ciMatchesDob(ciNumber, user.dateOfBirth);
  const status = matches ? "approved" : "rejected";
  const url = await saveImage(file, "ids");

  await prisma.studentVerification.upsert({
    where: { userId: user.id },
    update: {
      idCardImageUrl: url,
      ciNumber,
      ciAutoMatch: matches,
      status,
      reviewNotes: matches ? "auto-approved (CI↔DOB match)" : "ci_mismatch",
    },
    create: {
      userId: user.id,
      idCardImageUrl: url,
      ciNumber,
      ciAutoMatch: matches,
      status,
      reviewNotes: matches ? "auto-approved (CI↔DOB match)" : "ci_mismatch",
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationStatus: status },
  });

  return matches ? { success: true } : { reason: "ci_mismatch" };
}

/** Admin-only: approve or reject a pending student verification. */
export async function reviewVerificationAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect(`/${locale}/login`);

  const verificationId = formData.get("verificationId") as string;
  const decision = formData.get("decision") as string; // "approve" | "reject"
  const verification = await prisma.studentVerification.findUnique({
    where: { id: verificationId },
  });
  if (!verification) return;

  const newStatus = decision === "approve" ? "approved" : "rejected";
  await prisma.studentVerification.update({
    where: { id: verificationId },
    data: { status: newStatus, reviewedById: admin!.id },
  });
  await prisma.user.update({
    where: { id: verification.userId },
    data: { verificationStatus: newStatus },
  });

  revalidatePath(`/${locale}/admin`);
}
