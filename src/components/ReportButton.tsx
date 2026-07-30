import { getTranslations } from "next-intl/server";
import { reportListingAction } from "@/lib/actions/reports";

export default async function ReportButton({
  listingId,
  locale,
}: {
  listingId: string;
  locale: string;
}) {
  const t = await getTranslations("report");
  const reasons = ["spam", "prohibited", "scam", "other"] as const;

  return (
    <details className="mt-6 text-sm">
      <summary className="cursor-pointer text-gray-400 hover:text-red-600 select-none">
        ⚑ {t("report")}
      </summary>
      <form
        action={reportListingAction}
        className="mt-2 flex items-center gap-2"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="listingId" value={listingId} />
        <select
          name="reason"
          defaultValue="spam"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          {reasons.map((r) => (
            <option key={r} value={r}>
              {t(`reasons.${r}`)}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-red-600 px-3 py-1 text-white text-xs font-medium hover:bg-red-700">
          {t("submit")}
        </button>
      </form>
    </details>
  );
}
