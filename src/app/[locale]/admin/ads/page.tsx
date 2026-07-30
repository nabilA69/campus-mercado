import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAdSlotAction, toggleAdSlotAction } from "@/lib/actions/admin";
import AdminNav from "@/components/AdminNav";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default async function AdminAdsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminAds");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user!.role !== "admin") redirect(`/${locale}`);

  const slots = await prisma.adSlot.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <AdminNav />
      <h1 className="text-xl font-bold mb-6">{t("title")}</h1>

      {/* Create form */}
      <form
        action={createAdSlotAction}
        className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 mb-8"
      >
        <input type="hidden" name="locale" value={locale} />
        <h2 className="font-semibold">{t("create")}</h2>

        <label className="block text-sm">
          <span className="text-gray-600">{t("position")}</span>
          <select name="position" defaultValue="home_top" className={inputCls}>
            <option value="home_top">home_top</option>
            <option value="sidebar">sidebar</option>
            <option value="listing_inline">listing_inline</option>
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
          <input name="imageUrl" type="url" className={inputCls} />
        </label>

        <label className="block text-sm">
          <span className="text-gray-600">{t("targetUrl")}</span>
          <input name="targetUrl" type="url" required className={inputCls} />
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

        <button className="rounded-md bg-brand px-4 py-2 text-white text-sm font-semibold hover:bg-brand-dark">
          {t("submit")}
        </button>
      </form>

      {/* Existing slots */}
      <h2 className="font-semibold mb-3">{t("existing")}</h2>
      {slots.length === 0 ? (
        <p className="rounded-lg bg-white border border-gray-200 p-6 text-center text-gray-400">
          {t("none")}
        </p>
      ) : (
        <ul className="space-y-3">
          {slots.map((s) => (
            <li
              key={s.id}
              className="rounded-lg bg-white border border-gray-200 p-3 flex items-center gap-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.imageUrl}
                alt=""
                className="w-24 h-12 object-cover rounded border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.position}</p>
                <p className="text-xs text-gray-400 truncate">{s.targetUrl}</p>
                <p className="text-xs text-gray-500">
                  {t("impressions")}: {s.impressions} · {t("clicks")}: {s.clicks}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    s.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.active ? t("active") : t("inactive")}
                </span>
                <form action={toggleAdSlotAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="adSlotId" value={s.id} />
                  <button className="text-xs text-brand hover:underline">
                    {t("toggle")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
