import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reviewReportAction } from "@/lib/actions/admin";
import AdminNav from "@/components/AdminNav";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminReports");
  const tr = await getTranslations("report");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user!.role !== "admin") redirect(`/${locale}`);

  const reports = await prisma.report.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { id: true, title: true, status: true } } },
  });

  // Group open reports by listing.
  const groups = new Map<
    string,
    { title: string; status: string; reasons: string[]; count: number }
  >();
  for (const r of reports) {
    const g = groups.get(r.listingId) ?? {
      title: r.listing.title,
      status: r.listing.status,
      reasons: [],
      count: 0,
    };
    g.reasons.push(r.reason);
    g.count += 1;
    groups.set(r.listingId, g);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <AdminNav current="/admin/reports" />
      <h1 className="text-xl font-bold mb-6">{t("title")}</h1>

      {groups.size === 0 ? (
        <p className="rounded-lg bg-white border border-gray-200 p-6 text-center text-gray-400">
          {t("none")}
        </p>
      ) : (
        <ul className="space-y-3">
          {[...groups.entries()].map(([listingId, g]) => (
            <li
              key={listingId}
              className="rounded-lg bg-white border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/listing/${listingId}`}
                    className="font-medium hover:text-brand truncate block"
                  >
                    {g.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {t("reportsCount", { count: g.count })}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded"
                      >
                        {tr(`reasons.${r}`)}
                      </span>
                    ))}
                  </div>
                  {g.status === "hidden" && (
                    <p className="mt-1 text-xs text-gray-400">
                      {t("alreadyHidden")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {g.status !== "hidden" ? (
                    <form action={reviewReportAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="listingId" value={listingId} />
                      <input type="hidden" name="decision" value="hide" />
                      <button className="w-full rounded-md bg-red-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-red-700">
                        {t("hide")}
                      </button>
                    </form>
                  ) : (
                    <form action={reviewReportAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="listingId" value={listingId} />
                      <input type="hidden" name="decision" value="unhide" />
                      <button className="w-full rounded-md bg-green-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-green-700">
                        {t("unhide")}
                      </button>
                    </form>
                  )}
                  <form action={reviewReportAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="listingId" value={listingId} />
                    <input type="hidden" name="decision" value="dismiss" />
                    <button className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 text-sm font-medium hover:bg-gray-50">
                      {t("dismiss")}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
