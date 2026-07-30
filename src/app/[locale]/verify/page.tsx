import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import VerifyForm from "@/components/VerifyForm";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("verify");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold mb-2">{t("title")}</h1>

      {user!.verificationStatus === "approved" ? (
        <p className="text-green-700">{t("approved")}</p>
      ) : user!.verificationStatus === "pending" ? (
        <p className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
          {t("pending")}
        </p>
      ) : (
        <>
          <p className="text-gray-600 mb-6">{t("intro")}</p>
          <VerifyForm />
        </>
      )}
    </div>
  );
}
