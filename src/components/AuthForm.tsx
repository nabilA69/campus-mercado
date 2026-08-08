"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  registerAction,
  loginAction,
  type AuthState,
} from "@/lib/actions/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const action = mode === "register" ? registerAction : loginAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-bold mb-6">
        {mode === "register" ? t("registerTitle") : t("loginTitle")}
      </h1>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        {mode === "register" && (
          <Field label={t("name")} name="name" type="text" autoComplete="name" />
        )}
        <Field
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
        />
        {mode === "register" && (
          <Field
            label={t("dob")}
            name="dob"
            type="date"
            autoComplete="bday"
          />
        )}
        <Field
          label={t("password")}
          name="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />

        {state.error && (
          <p className="text-sm text-red-600">{t(`errors.${state.error}`)}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-brand px-4 py-3 text-white font-semibold hover:bg-brand-dark disabled:opacity-50"
        >
          {mode === "register" ? t("registerButton") : t("loginButton")}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        {mode === "register" ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={mode === "register" ? "/login" : "/register"}
          className="text-brand font-medium hover:underline"
        >
          {mode === "register" ? t("goLogin") : t("goRegister")}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}
