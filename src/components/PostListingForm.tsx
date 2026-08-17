"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createListingAction,
  type ListingState,
} from "@/lib/actions/listings";
import { PROVINCES } from "@/lib/provinces";
import { FACULTIES, universitiesFor } from "@/lib/universities";

export type CategoryOption = { id: string; name: string };

export default function PostListingForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const t = useTranslations("post");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ListingState, FormData>(
    createListingAction,
    {},
  );
  const [province, setProvince] = useState("");
  const [university, setUniversity] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <Labeled label={t("adTitle")}>
        <input
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder={t("adTitlePh")}
          className={inputCls}
        />
      </Labeled>

      <Labeled label={t("description")}>
        <textarea
          name="description"
          required
          rows={5}
          maxLength={4000}
          placeholder={t("descriptionPh")}
          className={inputCls}
        />
      </Labeled>

      <div className="grid grid-cols-2 gap-3">
        <Labeled label={t("price")}>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            required
            className={inputCls}
          />
        </Labeled>
        <Labeled label={t("currency")}>
          <select name="currency" defaultValue="CUP" className={inputCls}>
            <option value="CUP">CUP</option>
            <option value="USD">USD</option>
            <option value="MLC">MLC</option>
          </select>
        </Labeled>
      </div>

      <Labeled label={t("category")}>
        <select name="categoryId" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            {t("categoryChoose")}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Labeled>

      <Labeled label={t("province")}>
        <select
          name="province"
          required
          value={province}
          onChange={(e) => {
            setProvince(e.target.value);
            setUniversity(""); // universities depend on the province
          }}
          className={inputCls}
        >
          <option value="" disabled>
            {t("provinceChoose")}
          </option>
          {PROVINCES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </Labeled>

      {/* Universities are filtered by the chosen province */}
      <Labeled label={t("university")}>
        <select
          name="university"
          value={university}
          disabled={!province}
          onChange={(e) => setUniversity(e.target.value)}
          className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
        >
          <option value="">
            {province ? t("universityChoose") : t("provinceFirst")}
          </option>
          {universitiesFor(province).map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
          <option value="__other__">{t("otherOption")}</option>
        </select>
      </Labeled>

      {university === "__other__" && (
        <Labeled label={t("universityOther")}>
          <input
            name="universityOther"
            type="text"
            maxLength={120}
            required
            placeholder={t("universityOtherPh")}
            className={inputCls}
          />
        </Labeled>
      )}

      <Labeled label={t("faculty")}>
        <select name="faculty" defaultValue="" className={inputCls}>
          <option value="">{t("facultyChoose")}</option>
          {FACULTIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Labeled>

      <div className="grid grid-cols-2 gap-3">
        <Labeled label={t("contactMethod")}>
          <select name="contactMethod" defaultValue="phone" className={inputCls}>
            <option value="phone">{t("contactPhone")}</option>
            <option value="whatsapp">{t("contactWhatsapp")}</option>
            <option value="email">{t("contactEmail")}</option>
          </select>
        </Labeled>
        <Labeled label={t("contactValue")}>
          <input
            name="contactValue"
            type="text"
            required
            maxLength={120}
            placeholder={t("contactValuePh")}
            className={inputCls}
          />
        </Labeled>
      </div>

      <Labeled label={t("images")}>
        <input
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
        />
      </Labeled>

      {state.error && (
        <p className="text-sm text-red-600">{t(`errors.${state.error}`)}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2.5 text-white font-semibold hover:bg-brand-dark disabled:opacity-50"
      >
        {t("submit")}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
