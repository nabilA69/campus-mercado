import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reviewVerificationAction } from "@/lib/actions/verification";
import AdminNav from "@/components/AdminNav";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user!.role !== "admin") redirect(`/${locale}`);

  const pending = await prisma.studentVerification.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  const userIds = pending.map((p) => p.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <AdminNav />
      <h1 className="text-xl font-bold mb-1">{t("title")}</h1>
      <h2 className="text-sm text-gray-500 mb-6">{t("verifications")}</h2>

      {pending.length === 0 ? (
        <p className="rounded-lg bg-white border border-gray-200 p-6 text-center text-gray-400">
          {t("none")}
        </p>
      ) : (
        <ul className="space-y-4">
          {pending.map((v) => {
            const u = userById.get(v.userId);
            return (
              <li
                key={v.id}
                className="rounded-lg bg-white border border-gray-200 p-4 flex flex-col sm:flex-row gap-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.idCardImageUrl}
                  alt="ID card"
                  className="w-full sm:w-40 h-40 object-cover rounded-md border"
                />
                <div className="flex-1">
                  <p className="font-medium">{u?.name}</p>
                  <p className="text-sm text-gray-500">{u?.email}</p>
                  <p className="text-sm mt-2">
                    <span className="text-gray-500">No. CI:</span>{" "}
                    <span className="font-mono tracking-wider">
                      {v.ciNumber ?? "—"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    DOB:{" "}
                    {u?.dateOfBirth
                      ? u.dateOfBirth.toISOString().slice(0, 10)
                      : "—"}{" "}
                    {v.ciAutoMatch && (
                      <span className="text-green-600 font-medium">
                        ✓ CI↔DOB auto-match
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("submitted")}: {v.createdAt.toLocaleString()}
                  </p>

                  <div className="mt-4 rounded-md bg-gray-50 border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      {t("checklistTitle")}
                    </p>
                    {/* Approve requires the admin to confirm both factors. */}
                    <form action={reviewVerificationAction} className="space-y-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="verificationId" value={v.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <label className="flex items-start gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          name="confirmCard"
                          required
                          className="mt-0.5"
                        />
                        <span>{t("confirmCard")}</span>
                      </label>
                      <label className="flex items-start gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          name="confirmCi"
                          required
                          className="mt-0.5"
                        />
                        <span>{t("confirmCi")}</span>
                      </label>
                      <button className="mt-1 rounded-md bg-green-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-green-700">
                        {t("approve")}
                      </button>
                    </form>
                    <form action={reviewVerificationAction} className="mt-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="verificationId" value={v.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <button className="rounded-md bg-red-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-red-700">
                        {t("reject")}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
