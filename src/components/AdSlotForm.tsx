"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createAdSlotAction, type AdSlotState } from "@/lib/actions/admin";
import { AD_POSITIONS } from "@/lib/urls";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function AdSlotForm() {
  const t = useTranslations("adminAds");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<AdSlotState, FormData>(
    createAdSlotAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 mb-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <h2 className="font-semibold">{t("create")}</h2>

      <label className="block text-sm">
        <span className="text-gray-600">{t("position")}</span>
        <select name="position" defaultValue="home_top" className={inputCls}>
          {AD_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {t(`positions.${p}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">{t("image")}</span>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-white"
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">{t("imageUrl")}</span>
        {/* type=text, not url: we normalise bare domains server-side */}
        <input
          name="imageUrl"
          type="text"
          inputMode="url"
          placeholder="ejemplo.com/banner.jpg"
          className={inputCls}
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">
          {t("targetUrl")}{" "}
          <span className="text-gray-400">({t("optional")})</span>
        </span>
        <input
          name="targetUrl"
          type="text"
          inputMode="url"
          placeholder="ejemplo.com"
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-gray-400">
          {t("targetUrlHint")}
        </span>
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">{t("advertiser")}</span>
        <input name="advertiserName" type="text" className={inputCls} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-gray-600">{t("startsAt")}</span>
          <input name="startsAt" type="date" className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">{t("expiresAt")}</span>
          <input name="expiresAt" type="date" className={inputCls} />
        </label>
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {t(`errors.${state.error}`)}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
          {t("created")}
        </p>
      )}

      <button
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2.5 text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? t("creating") : t("submit")}
      </button>
    </form>
  );
}
