import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import AdminNav from "@/components/AdminNav";
import { PROVINCES } from "@/lib/provinces";
import {
  adminUpdateListingAction,
  adminDeleteListingImageAction,
} from "@/lib/actions/admin";

export default async function AdminEditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("adminEdit");

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);
  if (me!.role !== "admin") redirect(`/${locale}`);

  const [listing, categories] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        seller: { select: { name: true, email: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!listing) notFound();

  const field =
    "h-11 w-full rounded-md border border-gray-300 px-3 focus:border-brand focus:outline-none";
  const label = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <AdminNav current="/admin/listings" />

      <Link
        href="/admin/listings"
        className="text-sm text-gray-500 hover:text-brand"
      >
        ← {t("back")}
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-bold">{t("title")}</h1>
      <p className="mb-5 text-sm text-gray-500">
        {listing!.seller.name} · {listing!.seller.email}
      </p>

      {sp.saved && (
        <p className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {t("saved")}
        </p>
      )}
      {sp.error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t("required")}
        </p>
      )}

      <form action={adminUpdateListingAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="listingId" value={listing!.id} />

        <div>
          <label className={label} htmlFor="title">
            {t("fTitle")}
          </label>
          <input id="title" name="title" defaultValue={listing!.title} className={field} />
        </div>

        <div>
          <label className={label} htmlFor="description">
            {t("fDescription")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={listing!.description}
            className="w-full rounded-md border border-gray-300 p-3 focus:border-brand focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="price">
              {t("fPrice")}
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              defaultValue={listing!.priceAmount}
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="currency">
              {t("fCurrency")}
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={listing!.currency}
              className={field}
            >
              {["CUP", "USD", "MLC"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="categoryId">
              {t("fCategory")}
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={listing!.categoryId}
              className={field}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "es" ? c.nameEs : c.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="province">
              {t("fProvince")}
            </label>
            <select
              id="province"
              name="province"
              defaultValue={listing!.province ?? ""}
              className={field}
            >
              <option value="">—</option>
              {PROVINCES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="campus">
            {t("fCampus")}
          </label>
          <input
            id="campus"
            name="campus"
            defaultValue={listing!.campus ?? ""}
            className={field}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="contactMethod">
              {t("fContactMethod")}
            </label>
            <select
              id="contactMethod"
              name="contactMethod"
              defaultValue={listing!.contactMethod}
              className={field}
            >
              <option value="phone">{t("phone")}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">{t("email")}</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="contactValue">
              {t("fContactValue")}
            </label>
            <input
              id="contactValue"
              name="contactValue"
              defaultValue={listing!.contactValue}
              className={field}
            />
          </div>
        </div>

        <button className="h-11 w-full rounded-md bg-brand font-semibold text-white hover:bg-brand-dark">
          {t("save")}
        </button>
      </form>

      {/* Photos */}
      <h2 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t("photos")}
      </h2>
      {listing!.images.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-400">
          {t("noPhotos")}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {listing!.images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <form action={adminDeleteListingImageAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="imageId" value={img.id} />
                <input type="hidden" name="listingId" value={listing!.id} />
                <button className="w-full bg-gray-50 py-1.5 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600">
                  {t("removePhoto")}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
