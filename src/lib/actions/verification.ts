"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveImageBytes, isAllowedImage } from "@/lib/storage";
import { imageForVision } from "@/lib/images";
import { isValidCiFormat, ciMatchesDob } from "@/lib/ci";
import { verifyCarneImage, aiVisionConfigured } from "@/lib/verify-ci-ai";

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

  const typedCi = ((formData.get("ciNumber") as string) || "").replace(/\D/g, "");
  const useAi = aiVisionConfigured();

  // Without AI the typed No. CI is the only signal, so it stays required.
  if (!useAi && !isValidCiFormat(typedCi)) return { error: "errorCiFormat" };
  // With AI a typed number is optional, but if given it must be well-formed.
  if (useAi && typedCi && !isValidCiFormat(typedCi)) {
    return { error: "errorCiFormat" };
  }

  const file = formData.get("idCard") as File | null;
  if (!file || file.size === 0) return { error: "errorNoFile" };
  if (!isAllowedImage(file.type)) return { error: "errorType" };

  const bytes = Buffer.from(await file.arrayBuffer());
  // If storage is down we still verify (the CI↔DOB check doesn't need the file);
  // we just record that the image couldn't be kept, rather than blocking a student.
  let url = "";
  try {
    url = await saveImageBytes(bytes, file.type, "ids");
  } catch (err) {
    console.error("[verify] ID image upload failed:", err);
  }

  let approved: boolean;
  let ciNumber: string | null;
  let reason: string;
  let note: string | undefined;
  // "pending" sends the submission to the admin queue instead of deciding it.
  let status: string;

  if (useAi) {
    // Send a downscaled JPEG, not the original: every provider accepts JPEG,
    // and a 5 MB photo becomes a 7 MB base64 payload that is slow and may
    // exceed request limits outright.
    let visionBytes: Buffer = bytes;
    let visionType: string = file.type;
    try {
      const v = await imageForVision(bytes);
      visionBytes = v.bytes;
      visionType = v.contentType;
    } catch {
      // Unreadable by the decoder; let the model judge the original.
    }

    const decision = await verifyCarneImage({
      base64: visionBytes.toString("base64"),
      mediaType: visionType,
      dob: user.dateOfBirth,
      typedCi,
    });
    note = decision.detail;

    if (decision.reason === "not_configured") {
      // No provider set up at all: this is the deliberate deterministic mode,
      // so run the typed-CI check exactly as the non-AI path does.
      approved = isValidCiFormat(typedCi) && ciMatchesDob(typedCi, user.dateOfBirth);
      ciNumber = typedCi || null;
      reason = approved ? "approved" : "ci_mismatch";
      status = approved ? "approved" : "rejected";
    } else if (decision.reason === "ai_error") {
      // The provider failed on THIS submission while working generally. Falling
      // back to the typed number would approve on a self-consistent CI alone,
      // skipping the "is this really a carné" check — which anyone able to
      // provoke an error could do on purpose. A human looks instead; nobody is
      // blocked, and the photo check is not silently dropped.
      approved = false;
      ciNumber = typedCi || null;
      reason = "ai_unavailable";
      status = "pending";
      note = `ai_error(${decision.detail ?? ""}) -> manual review`;
    } else {
      approved = decision.approved;
      ciNumber = decision.ciNumber ?? (typedCi || null);
      reason = decision.reason;
      status = approved ? "approved" : "rejected";
    }
  } else {
    approved = ciMatchesDob(typedCi, user.dateOfBirth);
    ciNumber = typedCi;
    reason = approved ? "approved" : "ci_mismatch";
    status = approved ? "approved" : "rejected";
  }
  const record = {
    idCardImageUrl: url,
    ciNumber,
    ciAutoMatch: approved,
    status,
    reviewNotes: reason,
    ocrResult: note ? JSON.stringify({ reason, note }) : null,
  };

  await prisma.studentVerification.upsert({
    where: { userId: user.id },
    update: record,
    create: { userId: user.id, ...record },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationStatus: status },
  });

  return approved ? { success: true } : { reason };
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

  revalidatePath(`/${locale}/admin/verifications`);
}
