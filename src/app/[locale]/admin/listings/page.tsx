import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import AdminNav from "@/components/AdminNav";
import { formatPrice } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import {
  adminSetListingStatusAction,
  adminDeleteListingAction,
  adminFeatureListingAction,
  adminUnfeatureListingAction,
} from "@/lib/actions/admin";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  hidden: "bg-red-100 text-red-700",
  sold: "bg-gray-200 text-gray-600",
};

export default async function AdminListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("adminListings");
  const tl = await getTranslations("listing");

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);
  if (me!.role !== "admin") redirect(`/${locale}`);

  const query = (sp.q ?? "").trim();
  const status = ["active", "hidden", "sold"].includes(sp.status ?? "")
    ? sp.status
    : "";

  const now = new Date();
  const listings = await prisma.listing.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      seller: { select: { name: true, email: true } },
      category: true,
      boosts: { where: { status: "active" } },
    },
  });

  const filters: { key: string; label: string }[] = [
    { key: "", label: t("all") },
    { key: "active", label: t("statusLabel.active") },
    { key: "hidden", label: t("statusLabel.hidden") },
    { key: "sold", label: t("statusLabel.sold") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav current="/admin/listings" />
      <h1 className="mb-4 text-xl font-bold">{t("title")}</h1>

      <form className="mb-3 flex gap-2" action="" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder={t("searchPh")}
          className="h-11 min-w-0 flex-1 rounded-md border border-gray-300 px-3 focus:border-brand focus:outline-none"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button className="h-11 shrink-0 rounded-md bg-brand px-4 font-medium text-white hover:bg-brand-dark">
          {t("search")}
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key || "all"}
            href={{
              pathname: "/admin/listings",
              query: { ...(query ? { q: query } : {}), ...(f.key ? { status: f.key } : {}) },
            }}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              (status ?? "") === f.key
                ? "border-brand bg-brand text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-brand"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-400">
          {t("none")}
        </p>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => {
            const featured = l.boosts.some(
              (b) => b.expiresAt && b.expiresAt > now,
            );
            return (
              <li key={l.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/listing/${l.id}`}
                      className="font-medium text-navy hover:text-brand hover:underline"
                    >
                      {featured && <span className="mr-1 text-amber-500">★</span>}
                      {l.title}
                    </Link>
                    <p className="text-sm text-brand font-semibold">
                      {formatPrice(l.priceAmount, l.currency, tl("free"))}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {(locale === "es" ? l.category.nameEs : l.category.nameEn)}
                      {l.province ? ` · ${provinceName(l.province)}` : ""}
                      {` · ${l.seller.name} (${l.seller.email})`}
                      {` · ${l.createdAt.toISOString().slice(0, 10)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLE[l.status] ?? ""}`}
                  >
                    {t(`statusLabel.${l.status}`)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <form action={adminSetListingStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="listingId" value={l.id} />
                    <select
                      name="status"
                      defaultValue={l.status}
                      className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                    >
                      {["active", "hidden", "sold"].map((s) => (
                        <option key={s} value={s}>
                          {t(`statusLabel.${s}`)}
                        </option>
                      ))}
                    </select>
                    <button className="h-9 rounded-md border border-gray-300 px-3 text-sm font-medium hover:border-brand hover:text-brand">
                      {t("apply")}
                    </button>
                  </form>

                  {featured ? (
                    <form action={adminUnfeatureListingAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="listingId" value={l.id} />
                      <button className="h-9 rounded-md border border-amber-400 px-3 text-sm font-medium text-amber-700 hover:bg-amber-50">
                        {t("unfeature")}
                      </button>
                    </form>
                  ) : (
                    <form action={adminFeatureListingAction} className="flex items-center gap-1">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="listingId" value={l.id} />
                      <input
                        name="days"
                        type="number"
                        min={1}
                        max={90}
                        defaultValue={7}
                        className="h-9 w-16 rounded-md border border-gray-300 px-2 text-sm"
                      />
                      <button className="h-9 rounded-md bg-amber-400 px-3 text-sm font-bold text-amber-900 hover:bg-amber-500">
                        ★ {t("feature")}
                      </button>
                    </form>
                  )}

                  <Link
                    href={`/admin/listings/${l.id}`}
                    className="flex h-9 items-center rounded-md border border-navy px-3 text-sm font-medium text-navy hover:bg-navy hover:text-white"
                  >
                    {t("edit")}
                  </Link>

                  <details className="ml-auto">
                    <summary className="cursor-pointer select-none text-sm text-gray-400 hover:text-red-600">
                      {t("delete")}
                    </summary>
                    <form action={adminDeleteListingAction} className="mt-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="listingId" value={l.id} />
                      <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                        {t("confirmDelete")}
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
