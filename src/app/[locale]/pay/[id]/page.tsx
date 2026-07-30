import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolveQrImage, transfermovilDeepLink } from "@/lib/transfermovil";
import PaymentReferenceForm from "@/components/PaymentReferenceForm";

export default async function PayPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pay");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) notFound();
  if (payment.userId !== user!.id && user!.role !== "admin") {
    redirect(`/${locale}/account`);
  }

  const account = process.env.TRANSFERMOVIL_ACCOUNT || "";
  const payInfo = {
    account,
    amount: payment.amount,
    currency: payment.currency,
    ref: payment.id,
  };
  const qrImage =
    payment.status === "pending" ? await resolveQrImage(payInfo) : null;
  const deepLink =
    payment.status === "pending" ? transfermovilDeepLink(payInfo) : null;
  const purposeLabel =
    payment.purpose === "boost" ? t("purposeBoost") : t("purposeAd");
  const statusLabel =
    payment.status === "confirmed"
      ? t("statusConfirmed")
      : payment.status === "rejected"
        ? t("statusRejected")
        : t("statusPending");

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-bold mb-6">{t("title")}</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <Row label={t("purpose")} value={purposeLabel} />
        <Row
          label={t("amount")}
          value={`${payment.amount.toLocaleString("es")} ${payment.currency}`}
          strong
        />
        <Row label={t("status")} value={statusLabel} />
      </div>

      {payment.status === "pending" && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900 mb-4">{t("instructions")}</p>

          {/* Transfermóvil QR */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-medium text-amber-800 mb-2">
              {t("scanQr")}
            </p>
            {qrImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImage}
                alt="Transfermóvil QR"
                width={200}
                height={200}
                className="rounded-lg bg-white p-2 border border-amber-200"
              />
            )}
          </div>

          {/* Deep-link to open the app (if configured) */}
          {deepLink && (
            <a
              href={deepLink}
              className="mt-4 block text-center rounded-md bg-brand px-4 py-2 text-white text-sm font-semibold hover:bg-brand-dark"
            >
              {t("openApp")}
            </a>
          )}

          {/* Account fallback */}
          <div className="mt-4 rounded-md bg-white border border-amber-200 p-3 text-center">
            <p className="text-xs text-gray-500">{t("account")}</p>
            <p className="font-mono text-lg">
              {account || t("notConfigured")}
            </p>
          </div>

          {/* Payer submits their transaction reference */}
          <div className="mt-5 border-t border-amber-200 pt-4">
            <PaymentReferenceForm
              paymentId={payment.id}
              existing={payment.reference}
            />
          </div>

          <p className="mt-4 text-xs text-amber-700">{t("waiting")}</p>
        </div>
      )}

      {payment.status === "confirmed" && (
        <p className="mt-5 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
          {t("done")}
        </p>
      )}
      {payment.status === "rejected" && (
        <p className="mt-5 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {t("rejected")}
        </p>
      )}

      <div className="mt-6">
        <Link
          href="/account/listings"
          className="text-sm text-brand hover:underline"
        >
          ← {t("title")}
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={strong ? "text-lg font-bold text-brand" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
