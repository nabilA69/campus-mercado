"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  updateListingAction,
  deleteListingImageAction,
  type ListingState,
} from "@/lib/actions/listings";
import { PROVINCES } from "@/lib/provinces";
import { FACULTIES, universitiesFor } from "@/lib/universities";
import type { CategoryOption } from "@/components/PostListingForm";

export type EditListingData = {
  id: string;
  title: string;
  description: string;
  priceAmount: number;
  currency: string;
  categoryId: string;
  province: string | null;
  campus: string | null;
  contactMethod: string;
  contactValue: string;
  images: { id: string; url: string }[];
};

const MAX_IMAGES = 4;

export default function EditListingForm({
  listing,
  categories,
}: {
  listing: EditListingData;
  categories: CategoryOption[];
}) {
  const t = useTranslations("post");
  const te = useTranslations("editListing");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ListingState, FormData>(
    updateListingAction,
    {},
  );

  // campus is stored as one label ("Universidad · Facultad"); split it back out
  // so the same two selects can be pre-filled.
  const [storedUni, storedFaculty] = (listing.campus ?? "").split(" · ");
  const initialProvince = listing.province ?? "";
  const known = universitiesFor(initialProvince);
  const uniIsKnown = !!storedUni && known.includes(storedUni);

  const [province, setProvince] = useState(initialProvince);
  const [university, setUniversity] = useState(
    uniIsKnown ? storedUni : storedUni ? "__other__" : "",
  );

  const room = MAX_IMAGES - listing.images.length;

  return (
    <>
      {/* Photos are managed outside the main form so removing one never
          discards unsaved text edits... but each is its own form, so they
          cannot be nested inside it either. */}
      {listing.images.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-gray-700">{te("photos")}</p>
          <div className="grid grid-cols-4 gap-2">
            {listing.images.map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-md border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                <form action={deleteListingImageAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="imageId" value={img.id} />
                  <button className="w-full bg-gray-50 py-1 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600">
                    {te("removePhoto")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="listingId" value={listing.id} />

        <Labeled label={t("adTitle")}>
          <input
            name="title"
            type="text"
            required
            maxLength={120}
            defaultValue={listing.title}
            className={inputCls}
          />
        </Labeled>

        <Labeled label={t("description")}>
          <textarea
            name="description"
            required
            rows={5}
            maxLength={4000}
            defaultValue={listing.description}
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
              required
              defaultValue={listing.priceAmount}
              className={inputCls}
            />
          </Labeled>
          <Labeled label={t("currency")}>
            <select name="currency" defaultValue={listing.currency} className={inputCls}>
              <option value="CUP">CUP</option>
              <option value="USD">USD</option>
              <option value="MLC">MLC</option>
            </select>
          </Labeled>
        </div>

        <Labeled label={t("category")}>
          <select
            name="categoryId"
            required
            defaultValue={listing.categoryId}
            className={inputCls}
          >
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
              // Universities are province-specific, so a pick from the old
              // province is no longer valid — but a typed-in "Otra" value is,
              // so keep it instead of silently discarding what was entered.
              setUniversity((u) => (u === "__other__" ? u : ""));
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
              defaultValue={uniIsKnown ? "" : (storedUni ?? "")}
              className={inputCls}
            />
          </Labeled>
        )}

        <Labeled label={t("faculty")}>
          <select
            name="faculty"
            defaultValue={storedFaculty ?? ""}
            className={inputCls}
          >
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
            <select
              name="contactMethod"
              defaultValue={listing.contactMethod}
              className={inputCls}
            >
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
              defaultValue={listing.contactValue}
              className={inputCls}
            />
          </Labeled>
        </div>

        {room > 0 && (
          <Labeled label={te("addPhotos", { count: room })}>
            <input
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
            />
          </Labeled>
        )}

        {state.error && (
          <p className="text-sm text-red-600">{t(`errors.${state.error}`)}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? te("saving") : te("save")}
        </button>
      </form>
    </>
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
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
