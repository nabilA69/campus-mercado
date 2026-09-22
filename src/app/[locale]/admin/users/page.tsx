import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import {
  setUserRoleAction,
  setUserVerificationAction,
  deleteUserAction,
  adminResetPasswordAction,
} from "@/lib/actions/admin";

const STATUS_STYLE: Record<string, string> = {
  unverified: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; pwOk?: string; pwError?: string }>;
}) {
  const { locale } = await params;
  const { q, pwOk, pwError } = await searchParams;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("adminUsers");

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);
  if (me!.role !== "admin") redirect(`/${locale}`);

  const query = (q ?? "").trim();
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { listings: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav current="/admin/users" />
      <h1 className="mb-4 text-xl font-bold">{t("title")}</h1>

      <form className="mb-5 flex gap-2" action="" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder={t("searchPh")}
          className="h-11 min-w-0 flex-1 rounded-md border border-gray-300 px-3 focus:border-brand focus:outline-none"
        />
        <button className="h-11 shrink-0 rounded-md bg-brand px-4 font-medium text-white hover:bg-brand-dark">
          {t("search")}
        </button>
      </form>

      {pwOk && (
        <p className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {t("pwChanged")}
        </p>
      )}
      {pwError && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t("pwTooShort")}
        </p>
      )}

      {users.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-400">
          {t("none")}
        </p>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => {
            const isMe = u.id === me!.id;
            return (
              <li key={u.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {u.name}
                      {u.role === "admin" && (
                        <span className="ml-2 rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          admin
                        </span>
                      )}
                      {isMe && (
                        <span className="ml-2 text-xs text-gray-400">({t("you")})</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-gray-500">{u.email}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {t("joined")}: {u.createdAt.toISOString().slice(0, 10)} ·{" "}
                      {t("ads")}: {u._count.listings}
                      {u.dateOfBirth
                        ? ` · ${t("dob")}: ${u.dateOfBirth.toISOString().slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLE[u.verificationStatus]}`}
                  >
                    {t(`status.${u.verificationStatus}`)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  {/* verification */}
                  <form action={setUserVerificationAction} className="flex items-center gap-1">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="status"
                      defaultValue={u.verificationStatus}
                      className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                    >
                      {["unverified", "pending", "approved", "rejected"].map((s) => (
                        <option key={s} value={s}>
                          {t(`status.${s}`)}
                        </option>
                      ))}
                    </select>
                    <button className="h-9 rounded-md border border-gray-300 px-3 text-sm font-medium hover:border-brand hover:text-brand">
                      {t("apply")}
                    </button>
                  </form>

                  {/* role */}
                  {!isMe && (
                    <form action={setUserRoleAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={u.role === "admin" ? "student" : "admin"}
                      />
                      <button className="h-9 rounded-md border border-navy px-3 text-sm font-medium text-navy hover:bg-navy hover:text-white">
                        {u.role === "admin" ? t("makeStudent") : t("makeAdmin")}
                      </button>
                    </form>
                  )}

                  {/* reset this user's password */}
                  <details>
                    <summary className="cursor-pointer select-none text-sm text-gray-400 hover:text-brand">
                      {t("resetPw")}
                    </summary>
                    <form action={adminResetPasswordAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder={t("newPwPh")}
                        className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                      />
                      <button className="h-9 rounded-md border border-brand px-3 text-sm font-medium text-brand hover:bg-brand hover:text-white">
                        {t("setPw")}
                      </button>
                    </form>
                  </details>

                  {/* delete, behind a reveal */}
                  {!isMe && (
                    <details className="ml-auto">
                      <summary className="cursor-pointer select-none text-sm text-gray-400 hover:text-red-600">
                        {t("delete")}
                      </summary>
                      <form action={deleteUserAction} className="mt-2">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="userId" value={u.id} />
                        <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                          {t("confirmDelete")}
                        </button>
                        <span className="ml-2 text-xs text-gray-400">
                          {t("deleteWarning")}
                        </span>
                      </form>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
