"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  submitPaymentReferenceAction,
  type ReferenceState,
} from "@/lib/actions/payments";

export default function PaymentReferenceForm({
  paymentId,
  existing,
}: {
  paymentId: string;
  existing?: string | null;
}) {
  const t = useTranslations("pay");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ReferenceState, FormData>(
    submitPaymentReferenceAction,
    {},
  );

  if (state.success) {
    return (
      <p className="rounded-md bg-green-50 border border-green-200 text-green-800 px-3 py-2 text-sm">
        {t("referenceSaved")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="paymentId" value={paymentId} />
      <label className="block text-sm font-medium text-gray-700">
        {t("referenceLabel")}
      </label>
      <input
        name="reference"
        type="text"
        required
        defaultValue={existing ?? ""}
        placeholder={t("referencePh")}
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <p className="text-xs text-gray-400">{t("referenceHint")}</p>
      {state.error && (
        <p className="text-sm text-red-600">{t(`refErrors.${state.error}`)}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50"
      >
        {t("submitReference")}
      </button>
    </form>
  );
}
