"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  requestPasswordResetAction,
  type ResetState,
} from "@/lib/actions/auth";

export default function ForgotPasswordForm() {
  const t = useTranslations("forgot");
  const [state, action, pending] = useActionState<ResetState, FormData>(
    requestPasswordResetAction,
    {},
  );

  if (state.sent) {
    return (
      <p className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        {t("sent")}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {t("email")}
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{t("invalid")}</p>}

      <button
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
