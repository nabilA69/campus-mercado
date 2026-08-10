"use client";

import { useActionState, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  submitVerificationAction,
  type VerifyState,
} from "@/lib/actions/verification";

// Downscale + recompress the photo in the browser before upload (saves bandwidth
// on Cuba's slow connections). Keeps enough resolution for the AI to read the No. CI.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1400;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.85),
    );
    if (!blob) return file;
    return new File([blob], "carne.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export default function VerifyForm() {
  const t = useTranslations("verify");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, formAction, pending] = useActionState<VerifyState, FormData>(
    submitVerificationAction,
    {},
  );

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setReady(false);
      return;
    }
    setBusy(true);
    const compressed = await compressImage(file);
    const dt = new DataTransfer();
    dt.items.add(compressed);
    if (inputRef.current) inputRef.current.files = dt.files;
    setBusy(false);
    setReady(true);
  }

  // Approved.
  if (state.success) {
    return (
      <p className="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
        ✓ {t("results.approved")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          {t("ciLabel")}
        </span>
        <input
          name="ciNumber"
          type="text"
          inputMode="numeric"
          pattern="\d{11}"
          maxLength={11}
          placeholder="01052360900"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 tracking-widest focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <span className="block text-xs text-gray-400 mt-1">{t("ciHint")}</span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          {t("idLabel")}
        </span>
        <p className="mb-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-xs">
          {t("cardNote")}
        </p>
        <input
          ref={inputRef}
          name="idCard"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required
          onChange={onChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
        />
      </label>

      {state.reason && state.reason !== "approved" && (
        <p className="text-sm text-red-600">
          {t(
            `results.${
              {
                ci_mismatch: "ciMismatch",
                not_carne: "notCarne",
                unreadable: "unreadable",
                typed_mismatch: "typedMismatch",
              }[state.reason] ?? "ciMismatch"
            }`,
          )}
        </p>
      )}
      {state.error && (
        <p className="text-sm text-red-600">
          {state.error === "already" ? t("approved") : t(state.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || busy || !ready}
        className="rounded-md bg-brand px-4 py-2 text-white font-semibold hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? t("checking") : t("submit")}
      </button>
    </form>
  );
}
