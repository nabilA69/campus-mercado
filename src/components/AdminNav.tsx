import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Tabs across every admin section. `current` is the href of the active page. */
export default async function AdminNav({ current }: { current?: string }) {
  const t = await getTranslations("adminNav");
  const items = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/verifications", label: t("verifications") },
    { href: "/admin/users", label: t("users") },
    { href: "/admin/listings", label: t("listings") },
    { href: "/admin/categories", label: t("categories") },
    { href: "/admin/payments", label: t("payments") },
    { href: "/admin/reports", label: t("reports") },
    { href: "/admin/ads", label: t("ads") },
  ];
  return (
    <nav className="mb-6 flex flex-wrap gap-1.5 border-b border-gray-200 pb-3 text-sm">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`rounded-md px-3 py-1.5 transition ${
            current === it.href
              ? "bg-brand font-semibold text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-brand"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
