import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/admin";

export default async function AdminCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ inUse?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("adminCats");

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);
  if (me!.role !== "admin") redirect(`/${locale}`);

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { listings: true } } },
  });

  const field = "h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-brand focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <AdminNav current="/admin/categories" />
      <h1 className="mb-1 text-xl font-bold">{t("title")}</h1>
      <p className="mb-5 text-sm text-gray-500">{t("intro")}</p>

      {sp.inUse && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t("inUse")}
        </p>
      )}

      {/* New category */}
      <form
        action={createCategoryAction}
        className="mb-8 rounded-lg border border-gray-200 bg-white p-4"
      >
        <input type="hidden" name="locale" value={locale} />
        <p className="mb-3 font-semibold">{t("addTitle")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input name="nameEs" placeholder={t("nameEs")} className={field} />
          <input name="nameEn" placeholder={t("nameEn")} className={field} />
          <input name="slug" placeholder={t("slugPh")} className={field} />
        </div>
        <button className="mt-3 h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          {t("add")}
        </button>
      </form>

      <ul className="space-y-3">
        {categories.map((c) => (
          <li key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {c.slug}
              </code>
              <span className="text-xs text-gray-400">
                {t("used", { count: c._count.listings })}
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <form action={updateCategoryAction} className="flex flex-1 flex-wrap items-end gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="categoryId" value={c.id} />
                <input
                  name="nameEs"
                  defaultValue={c.nameEs}
                  className={`${field} min-w-[9rem] flex-1`}
                />
                <input
                  name="nameEn"
                  defaultValue={c.nameEn}
                  className={`${field} min-w-[9rem] flex-1`}
                />
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={c.sortOrder}
                  title={t("order")}
                  className="h-10 w-20 rounded-md border border-gray-300 px-2 text-sm"
                />
                <button className="h-10 rounded-md border border-gray-300 px-3 text-sm font-medium hover:border-brand hover:text-brand">
                  {t("save")}
                </button>
              </form>

              {c._count.listings === 0 && (
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="categoryId" value={c.id} />
                  <button className="h-10 rounded-md px-3 text-sm text-gray-400 hover:text-red-600">
                    {t("delete")}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
