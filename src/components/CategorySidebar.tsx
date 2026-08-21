import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PROVINCES } from "@/lib/provinces";

export type SidebarCategory = {
  slug: string;
  name: string;
  icon: string;
  count: number;
};

/**
 * Classifieds-style sidebar: every category and province one click away, with
 * live counts. Text-only, so it costs almost nothing to render.
 */
export default async function CategorySidebar({
  categories,
}: {
  categories: SidebarCategory[];
}) {
  const t = await getTranslations("home");
  const ts = await getTranslations("search");

  return (
    <aside className="w-full lg:w-56 lg:shrink-0">
      <nav className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
          {t("browseCategories")}
        </h2>
        <ul>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/c/${c.slug}`}
                className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm text-navy last:border-0 hover:bg-brand/5 hover:text-brand"
              >
                <span aria-hidden>{c.icon}</span>
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="shrink-0 text-xs text-gray-400">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="mt-4 rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
          {ts("browseProvinces")}
        </h2>
        <ul className="max-h-72 overflow-y-auto">
          {PROVINCES.map((p) => (
            <li key={p.slug}>
              <Link
                href={{ pathname: "/search", query: { province: p.slug } }}
                className="block border-b border-gray-100 px-3 py-1.5 text-sm text-navy last:border-0 hover:bg-brand/5 hover:text-brand"
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
