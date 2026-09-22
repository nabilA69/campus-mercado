"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  changePasswordAction,
  type PasswordState,
} from "@/lib/actions/auth";

export default function ChangePasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("password");
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    {},
  );

  const field =
    "h-11 w-full rounded-md border border-gray-300 px-3 focus:border-brand focus:outline-none";

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />

      {state.success && (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {t("changed")}
        </p>
      )}
      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t(`err.${state.error}`)}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="currentPassword">
          {t("current")}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className={field}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="newPassword">
          {t("new")}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          className={field}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="confirmPassword">
          {t("confirm")}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={field}
        />
      </div>

      <button
        disabled={pending}
        className="h-11 w-full rounded-md bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
