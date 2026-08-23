import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import AdminNav from "@/components/AdminNav";

/** Admin home: the numbers that matter, and anything waiting on a decision. */
export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("adminDash");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user!.role !== "admin") redirect(`/${locale}`);

  const now = new Date();
  const [
    users,
    verifiedUsers,
    listings,
    activeListings,
    pendingVerifications,
    pendingPayments,
    openReports,
    activeAds,
    activeBoosts,
    confirmedPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { verificationStatus: "approved" } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.studentVerification.count({ where: { status: "pending" } }),
    prisma.payment.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { status: "open" } }),
    prisma.adSlot.count({ where: { active: true } }),
    prisma.featuredBoost.count({
      where: { status: "active", expiresAt: { gt: now } },
    }),
    prisma.payment.findMany({ where: { status: "confirmed" } }),
  ]);

  // Revenue collected, grouped by currency (boosts + ad sales).
  const revenue = confirmedPayments.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.amount;
    return acc;
  }, {});

  const stats = [
    { label: t("users"), value: users, href: "/admin/users" as const },
    { label: t("verified"), value: verifiedUsers, href: "/admin/users" as const },
    { label: t("listings"), value: listings, href: "/admin/listings" as const },
    { label: t("active"), value: activeListings, href: "/admin/listings" as const },
    { label: t("boosted"), value: activeBoosts, href: "/admin/listings" as const },
    { label: t("activeAds"), value: activeAds, href: "/admin/ads" as const },
  ];

  const todo = [
    {
      label: t("pendingVerifications"),
      value: pendingVerifications,
      href: "/admin/verifications" as const,
    },
    {
      label: t("pendingPayments"),
      value: pendingPayments,
      href: "/admin/payments" as const,
    },
    { label: t("openReports"), value: openReports, href: "/admin/reports" as const },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <AdminNav current="/admin" />
      <h1 className="mb-1 text-xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("signedInAs", { email: user!.email })}</p>

      {/* Needs attention */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t("needsAttention")}
      </h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {todo.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-lg border p-4 transition ${
              s.value > 0
                ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                : "border-gray-200 bg-white hover:border-brand"
            }`}
          >
            <p className="text-2xl font-extrabold text-navy">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Site numbers */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t("overview")}
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand"
          >
            <p className="text-2xl font-extrabold text-navy">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Money */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t("revenue")}
      </h2>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {Object.keys(revenue).length === 0 ? (
          <p className="text-sm text-gray-400">{t("noRevenue")}</p>
        ) : (
          <ul className="flex flex-wrap gap-6">
            {Object.entries(revenue).map(([currency, amount]) => (
              <li key={currency}>
                <span className="text-2xl font-extrabold text-brand">
                  {amount.toLocaleString("es")}
                </span>{" "}
                <span className="text-sm font-medium text-gray-500">{currency}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-gray-400">{t("revenueNote")}</p>
      </div>
    </div>
  );
}
