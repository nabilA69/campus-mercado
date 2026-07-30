"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  submitVerificationAction,
  type VerifyState,
} from "@/lib/actions/verification";

export default function VerifyForm() {
  const t = useTranslations("verify");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<VerifyState, FormData>(
    submitVerificationAction,
    {},
  );

  if (state.success) {
    return (
      <p className="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
        {t("success")}
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
          name="idCard"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
        />
      </label>

      {state.error && (
        <p className="text-sm text-red-600">
          {state.error === "already" ? t("approved") : t(state.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-white font-semibold hover:bg-brand-dark disabled:opacity-50"
      >
        {t("submit")}
      </button>
    </form>
  );
}
