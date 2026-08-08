import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} CampusMercado. {t("tagline")}</p>
        <a href="mailto:ads@campusmercado.shop" className="hover:text-brand">
          {t("advertise")}
        </a>
      </div>
    </footer>
  );
}
