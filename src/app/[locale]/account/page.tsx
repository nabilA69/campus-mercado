import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";

const STATUS_KEY: Record<string, string> = {
  unverified: "statusUnverified",
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
};

const STATUS_STYLE: Record<string, string> = {
  unverified: "bg-gray-100 text-gray-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const tm = await getTranslations("myListings");
  const tp = await getTranslations("password");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  const status = user!.verificationStatus;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold mb-1">{t("title")}</h1>
      <p className="text-gray-600 mb-6">{user!.name} · {user!.email}</p>

      <div className="rounded-lg bg-white border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {t("status")}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_STYLE[status]}`}
          >
            {t(STATUS_KEY[status])}
          </span>
        </div>

        <div className="mt-4">
          {status === "approved" ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700">{t("verifyApprovedMsg")}</p>
              <Link
                href="/post"
                className="inline-block rounded-md bg-brand px-4 py-2 text-white font-semibold hover:bg-brand-dark"
              >
                {t("postAd")}
              </Link>
            </div>
          ) : status === "pending" ? (
            <p className="text-sm text-amber-700">{t("verifyPendingMsg")}</p>
          ) : (
            <Link
              href="/verify"
              className="inline-block rounded-md bg-brand px-4 py-2 text-white font-semibold hover:bg-brand-dark"
            >
              {t("verifyCta")}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link
          href="/account/listings"
          className="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand hover:text-brand"
        >
          {tm("title")}
        </Link>
      </div>

      {/* Password */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">{tp("title")}</h2>
        <p className="mb-4 text-sm text-gray-500">{tp("intro")}</p>
        <ChangePasswordForm locale={locale} />
      </div>
    </div>
  );
}
