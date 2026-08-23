import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reviewPaymentAction } from "@/lib/actions/admin";
import AdminNav from "@/components/AdminNav";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminPayments");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user!.role !== "admin") redirect(`/${locale}`);

  const payments = await prisma.payment.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  const userIds = [...new Set(payments.map((p) => p.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <AdminNav current="/admin/payments" />
      <h1 className="text-xl font-bold mb-6">{t("title")}</h1>

      {payments.length === 0 ? (
        <p className="rounded-lg bg-white border border-gray-200 p-6 text-center text-gray-400">
          {t("none")}
        </p>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => {
            const u = userById.get(p.userId);
            return (
              <li
                key={p.id}
                className="rounded-lg bg-white border border-gray-200 p-4 flex flex-wrap items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand">
                    {p.amount.toLocaleString("es")} {p.currency}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("purpose")}: {p.purpose}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {t("user")}: {u?.name} ({u?.email})
                  </p>
                  {p.reference && (
                    <p className="text-xs text-gray-400">
                      {t("reference")}: {p.reference}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <form action={reviewPaymentAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="paymentId" value={p.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button className="rounded-md bg-green-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-green-700">
                      {t("confirm")}
                    </button>
                  </form>
                  <form action={reviewPaymentAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="paymentId" value={p.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <button className="rounded-md bg-red-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-red-700">
                      {t("reject")}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
