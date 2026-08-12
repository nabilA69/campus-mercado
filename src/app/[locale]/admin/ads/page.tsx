import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toggleAdSlotAction } from "@/lib/actions/admin";
import AdminNav from "@/components/AdminNav";
import AdSlotForm from "@/components/AdSlotForm";
import { isAdPosition } from "@/lib/urls";

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

      {/* Create form (client component: validates and reports errors inline) */}
      <AdSlotForm />

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
                <p className="text-sm font-medium">
                  {isAdPosition(s.position)
                    ? t(`positions.${s.position}`)
                    : s.position}
                </p>
                {s.targetUrl ? (
                  <a
                    href={s.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline truncate block"
                  >
                    {s.targetUrl}
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">{t("noLink")}</p>
                )}
                <p className="text-xs text-gray-500">
                  {t("impressions")}: {s.impressions} · {t("clicks")}: {s.clicks}
                </p>
                {s.expiresAt && (
                  <p className="text-xs text-gray-400">
                    {t("expiresAt")}: {s.expiresAt.toISOString().slice(0, 10)}
                  </p>
                )}
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
