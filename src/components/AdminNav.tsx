import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AdminNav() {
  const t = await getTranslations("adminNav");
  const items = [
    { href: "/admin", label: t("verifications") },
    { href: "/admin/payments", label: t("payments") },
    { href: "/admin/reports", label: t("reports") },
    { href: "/admin/ads", label: t("ads") },
  ];
  return (
    <nav className="mb-6 flex gap-2 border-b border-gray-200 pb-3 text-sm">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-brand"
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
