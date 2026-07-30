"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidCiFormat, ciMatchesDob } from "@/lib/ci";
import { saveImage, isAllowedImage } from "@/lib/storage";

export type VerifyState = { error?: string; success?: boolean };

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

  // Date of birth must exist (set at registration) to check the CI number.
  if (!user.dateOfBirth) return { error: "errorNoDob" };

  // Validate the typed No. CI and match its first 6 digits (YYMMDD) to the DOB.
  const ciNumber = ((formData.get("ciNumber") as string) || "").replace(/\s/g, "");
  if (!isValidCiFormat(ciNumber)) return { error: "errorCiFormat" };
  if (!ciMatchesDob(ciNumber, user.dateOfBirth)) return { error: "errorCiMismatch" };

  const file = formData.get("idCard") as File | null;
  if (!file || file.size === 0) return { error: "errorNoFile" };
  if (!isAllowedImage(file.type)) return { error: "errorType" };

  const url = await saveImage(file, "ids");

  await prisma.studentVerification.upsert({
    where: { userId: user.id },
    update: {
      idCardImageUrl: url,
      ciNumber,
      ciAutoMatch: true,
      status: "pending",
      reviewNotes: null,
    },
    create: {
      userId: user.id,
      idCardImageUrl: url,
      ciNumber,
      ciAutoMatch: true,
      status: "pending",
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationStatus: "pending" },
  });

  return { success: true };
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
