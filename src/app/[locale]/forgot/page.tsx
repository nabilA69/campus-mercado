import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default async function ForgotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forgot");

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-1 text-xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-gray-600">{t("intro")}</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-gray-500">
        <Link href="/login" className="text-brand hover:underline">
          ← {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
