import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Page links that preserve whatever filters are already in the URL.
 * `base` is the pathname; `query` is everything except `page`.
 */
export default async function Pager({
  base,
  query,
  page,
  totalPages,
}: {
  base: string;
  query: Record<string, string>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations("pager");

  // A compact window around the current page, always including first and last.
  const nums = new Set<number>([1, totalPages, page]);
  if (page - 1 > 1) nums.add(page - 1);
  if (page + 1 < totalPages) nums.add(page + 1);
  const pages = [...nums].sort((a, b) => a - b);

  const linkTo = (p: number) => ({
    pathname: base,
    query: { ...query, ...(p > 1 ? { page: String(p) } : {}) },
  });

  const box =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm";

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link
          href={linkTo(page - 1)}
          className={`${box} border-gray-300 bg-white text-gray-600 hover:border-brand hover:text-brand`}
        >
          ← {t("prev")}
        </Link>
      )}

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {/* a gap in the sequence means pages were skipped */}
          {i > 0 && p - pages[i - 1] > 1 && (
            <span className="px-1 text-gray-400">…</span>
          )}
          {p === page ? (
            <span className={`${box} border-brand bg-brand font-semibold text-white`}>
              {p}
            </span>
          ) : (
            <Link
              href={linkTo(p)}
              className={`${box} border-gray-300 bg-white text-gray-600 hover:border-brand hover:text-brand`}
            >
              {p}
            </Link>
          )}
        </span>
      ))}

      {page < totalPages && (
        <Link
          href={linkTo(page + 1)}
          className={`${box} border-gray-300 bg-white text-gray-600 hover:border-brand hover:text-brand`}
        >
          {t("next")} →
        </Link>
      )}
    </nav>
  );
}
